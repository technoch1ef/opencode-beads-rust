import { expect, test } from "bun:test";
import plugin from "../src/plugin";

test("default export is a Plugin factory function", () => {
  expect(typeof plugin).toBe("function");
});

// ── Injection scoping ──────────────────────────────────────────────────

interface AgentEntry {
  name: string;
  mode: "primary" | "subagent" | "all";
}

/**
 * Build a minimal fake PluginInput. Captures every session.prompt call so
 * tests can assert whether beads context was injected.
 */
function makeInput(agentList: AgentEntry[]) {
  const prompts: unknown[] = [];
  const client = {
    app: {
      agents: async () => ({ data: agentList }),
    },
    session: {
      messages: async () => ({ data: [] }),
      prompt: async (args: unknown) => {
        prompts.push(args);
        return {};
      },
    },
  };
  // Fake Bun shell: $`br prime`.text() → non-empty output
  const $ = () => ({ text: async () => "issue graph summary" });
  return { input: { client, $ } as never, prompts };
}

async function sendMessage(
  hooks: Record<string, unknown>,
  sessionID: string,
  agent: string | undefined,
) {
  const chatMessage = hooks["chat.message"] as (
    input: unknown,
    output: unknown,
  ) => Promise<void>;
  await chatMessage(
    {},
    { message: { sessionID, agent, model: { providerID: "p", modelID: "m" } } },
  );
}

const AGENTS: AgentEntry[] = [
  { name: "build", mode: "primary" },
  { name: "plan", mode: "primary" },
  { name: "explore", mode: "subagent" },
  { name: "worker", mode: "all" },
  { name: "mayor", mode: "primary" },
];

test("default (primary) mode injects for primary agents, skips subagents", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input)) as Record<string, unknown>;

  await sendMessage(hooks, "s-build", "build");
  expect(prompts.length).toBe(1);

  await sendMessage(hooks, "s-explore", "explore");
  expect(prompts.length).toBe(1); // subagent skipped
});

test("inject allowlist: only listed agents receive beads context", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input, {
    inject: ["mayor", "worker", "guard", "inspector", "envoy"],
  })) as Record<string, unknown>;

  await sendMessage(hooks, "s-build", "build");
  await sendMessage(hooks, "s-plan", "plan");
  expect(prompts.length).toBe(0); // primary agents NOT in allowlist

  await sendMessage(hooks, "s-worker", "worker");
  await sendMessage(hooks, "s-mayor", "mayor");
  expect(prompts.length).toBe(2);
});

test("inject allowlist: unknown/undefined agent is excluded", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input, {
    inject: ["worker"],
  })) as Record<string, unknown>;

  await sendMessage(hooks, "s-anon", undefined);
  await sendMessage(hooks, "s-custom", "my-custom-agent");
  expect(prompts.length).toBe(0);
});

test("inject 'none' disables injection except for beads-task-agent", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input, { inject: "none" })) as Record<
    string,
    unknown
  >;

  await sendMessage(hooks, "s-build", "build");
  await sendMessage(hooks, "s-worker", "worker");
  expect(prompts.length).toBe(0);

  await sendMessage(hooks, "s-task", "beads-task-agent");
  expect(prompts.length).toBe(1);
});

test("beads-task-agent always receives context regardless of allowlist", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input, {
    inject: ["mayor"],
  })) as Record<string, unknown>;

  await sendMessage(hooks, "s-task", "beads-task-agent");
  expect(prompts.length).toBe(1);
});

test("injection happens once per session", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input, {
    inject: ["worker"],
  })) as Record<string, unknown>;

  await sendMessage(hooks, "s-worker", "worker");
  await sendMessage(hooks, "s-worker", "worker");
  expect(prompts.length).toBe(1);
});

test("malformed inject option falls back to primary mode", async () => {
  const { input, prompts } = makeInput(AGENTS);
  const hooks = (await plugin(input, { inject: 42 as never })) as Record<
    string,
    unknown
  >;

  await sendMessage(hooks, "s-build", "build");
  expect(prompts.length).toBe(1); // legacy behavior preserved
});
