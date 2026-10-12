import { expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import plugin, { expandTemplate } from "../src/plugin";

test("default export is a v2 plugin definition", () => {
  expect(plugin.id).toBe("beads-rust");
  expect(typeof plugin.setup).toBe("function");
});

// ── Fake v2 context ────────────────────────────────────────────────────

interface AgentEntry {
  name: string;
  mode: "primary" | "subagent" | "all";
}

const AGENTS: AgentEntry[] = [
  { name: "build", mode: "primary" },
  { name: "plan", mode: "primary" },
  { name: "explore", mode: "subagent" },
  { name: "worker", mode: "all" },
  { name: "mayor", mode: "primary" },
];

// Fake `br` on PATH so `br prime` prints something.
const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "beads-rust-test-"));
fs.writeFileSync(path.join(binDir, "br"), "#!/bin/sh\necho issue graph summary\n", { mode: 0o755 });
process.env.PATH = `${binDir}:${process.env.PATH}`;

async function setup(options: Record<string, unknown> = {}) {
  let contextHook: ((input: any) => Promise<void>) | undefined;
  const commands: any[] = [];
  const agents = new Map<string, any>();
  const prompts: any[] = [];
  const ctx: any = {
    options,
    location: { directory: os.tmpdir() },
    agent: {
      get: async ({ agentID }: { agentID: string }) => {
        const agent = AGENTS.find((a) => a.name === agentID);
        if (!agent) throw new Error(`Agent not found: ${agentID}`);
        return { data: agent };
      },
      transform: async (cb: (e: any) => void) => {
        cb({
          update: (id: string, fn: (a: any) => void) => {
            const a = agents.get(id) ?? { id };
            fn(a);
            agents.set(id, a);
          },
        });
        return { dispose: async () => {} };
      },
    },
    command: {
      transform: async (cb: (e: any) => void) => {
        cb({ add: (c: any) => commands.push(c) });
        return { dispose: async () => {} };
      },
    },
    session: {
      get: async () => ({ location: { directory: os.tmpdir() } }),
      prompt: async (input: any) => prompts.push(input),
      hook: async (name: string, cb: any) => {
        if (name === "context") contextHook = cb;
        return { dispose: async () => {} };
      },
    },
  };
  await plugin.setup(ctx);

  /** Simulate one model request; returns true if beads context was injected. */
  async function request(sessionID: string, agent: string) {
    const input = { sessionID, agent, system: [] as any[] };
    await contextHook!(input);
    return input.system.some((p) => p.text.includes("<beads-context>"));
  }
  return { request, commands, agents, prompts };
}

// ── Injection scoping ──────────────────────────────────────────────────

test("default (primary) mode injects for primary agents, skips subagents", async () => {
  const { request } = await setup();
  expect(await request("s-build", "build")).toBe(true);
  expect(await request("s-explore", "explore")).toBe(false);
});

test("inject allowlist: only listed agents receive beads context", async () => {
  const { request } = await setup({ inject: ["mayor", "worker", "guard", "inspector", "envoy"] });
  expect(await request("s-build", "build")).toBe(false);
  expect(await request("s-plan", "plan")).toBe(false);
  expect(await request("s-worker", "worker")).toBe(true);
  expect(await request("s-mayor", "mayor")).toBe(true);
});

test("inject allowlist: unknown agent is excluded", async () => {
  const { request } = await setup({ inject: ["worker"] });
  expect(await request("s-custom", "my-custom-agent")).toBe(false);
});

test("inject 'none' disables injection except for beads-task-agent", async () => {
  const { request } = await setup({ inject: "none" });
  expect(await request("s-build", "build")).toBe(false);
  expect(await request("s-worker", "worker")).toBe(false);
  expect(await request("s-task", "beads-task-agent")).toBe(true);
});

test("beads-task-agent always receives context regardless of allowlist", async () => {
  const { request } = await setup({ inject: ["mayor"] });
  expect(await request("s-task", "beads-task-agent")).toBe(true);
});

test("context is injected on every request of a session (survives compaction)", async () => {
  const { request } = await setup({ inject: ["worker"] });
  expect(await request("s-worker", "worker")).toBe(true);
  expect(await request("s-worker", "worker")).toBe(true);
});

test("malformed inject option falls back to primary mode", async () => {
  const { request } = await setup({ inject: 42 });
  expect(await request("s-build", "build")).toBe(true);
});

// ── Commands and agent ─────────────────────────────────────────────────

test("registers beads commands and the task agent", async () => {
  const { commands, agents, prompts } = await setup();
  const names = commands.map((c) => c.name);
  expect(names).toContain("beads:ready");
  expect(names).toContain("beads:create");

  const task = agents.get("beads-task-agent");
  expect(task.mode).toBe("subagent");
  expect(task.system).toContain("br ready --json");

  const show = commands.find((c) => c.name === "beads:show");
  await show.execute({ sessionID: "s1", prompt: { text: "br-42" }, delivery: "immediate" });
  expect(prompts[0].sessionID).toBe("s1");
  expect(prompts[0].text).toContain("br-42");
  expect(prompts[0].text).not.toContain("$1");
});

test("expandTemplate follows OpenCode placeholder semantics", () => {
  expect(expandTemplate("close $1 because $2", 'br-1 "it is done" now')).toBe("close br-1 because it is done now");
  expect(expandTemplate("all: $ARGUMENTS", "a b")).toBe("all: a b");
  expect(expandTemplate("show $1", "")).toBe("show");
  expect(expandTemplate("no placeholders", "extra")).toBe("no placeholders\n\nextra");
});
