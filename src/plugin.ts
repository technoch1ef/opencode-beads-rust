/**
 * OpenCode Beads Plugin (OpenCode v2 plugin API)
 *
 * Integrates the beads issue tracker with OpenCode.
 *
 * Features:
 * - Context injection: `br prime` output is added to the system prompt
 *   (captured once per session, so it survives compaction)
 * - Commands parsed from beads command definitions
 * - Task agent for autonomous issue completion
 */

import { execFile } from "node:child_process";
import type { Plugin } from "@opencode-ai/plugin";
import { BEADS_GUIDANCE, loadAgent, loadCommands } from "./vendor";

/** Name of the plugin's own task agent. Always receives beads context. */
const BEADS_TASK_AGENT = "beads-task-agent";

/**
 * Run `br prime` in `cwd` and build the beads context block.
 * Returns undefined if br is not installed, not initialized, or prints nothing.
 */
function buildBeadsContext(cwd: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile("br", ["prime"], { cwd, maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      const prime = String(stdout ?? "").trim();
      if (err || !prime) return resolve(undefined);
      resolve(`<beads-context>
${prime}
</beads-context>

${BEADS_GUIDANCE}`);
    });
  });
}

const argsRegex = /(?:"[^"]*"|'[^']*'|[^\s"']+)/g;
const quoteTrimRegex = /^["']|["']$/g;
const placeholderRegex = /\$(\d+)/g;

/**
 * Expand `$1..$N` and `$ARGUMENTS` in a command template, mirroring
 * OpenCode's markdown command semantics (the last placeholder takes the rest).
 */
export function expandTemplate(template: string, input: string): string {
  const args = (input.match(argsRegex) ?? []).map((a) => a.replace(quoteTrimRegex, ""));
  const placeholders = template.match(placeholderRegex) ?? [];
  const last = Math.max(0, ...placeholders.map((p) => Number(p.slice(1))));
  const expanded = template
    .replaceAll(placeholderRegex, (_, index) => {
      const position = Number(index);
      if (position - 1 >= args.length) return "";
      return position === last ? args.slice(position - 1).join(" ") : args[position - 1]!;
    })
    .replaceAll("$ARGUMENTS", input);
  if (placeholders.length === 0 && !template.includes("$ARGUMENTS") && input.trim()) {
    return `${expanded}\n\n${input}`.trim();
  }
  return expanded.trim();
}

/**
 * Plugin options (passed via the tuple form in opencode.json):
 *
 * ```jsonc
 * "plugins": [
 *   ["@technoch1ef/opencode-beads-rust", { "inject": ["mayor", "worker"] }]
 * ]
 * ```
 */
export interface BeadsPluginOptions {
  /**
   * Controls which agents receive beads context injection (`br prime`
   * output + CLI guidance).
   *
   * - `"primary"` (default) — inject for all primary/all-mode agents
   *   (subagents are always skipped)
   * - `"none"` — never inject (commands and the task agent stay registered)
   * - `string[]` — inject only for the listed agent names
   *
   * The plugin's own `beads-task-agent` always receives context.
   */
  inject?: "primary" | "none" | string[];
}

/** Normalize the raw (untyped) plugin options from opencode config. */
function parseInjectOption(raw: unknown): "primary" | "none" | string[] {
  if (raw === "none") return "none";
  if (Array.isArray(raw)) return raw.filter((a): a is string => typeof a === "string");
  return "primary";
}

export const BeadsPlugin: Plugin.Plugin = {
  id: "beads-rust",
  async setup(ctx) {
    const [commands, agents] = await Promise.all([loadCommands(), loadAgent()]);
    const inject = parseInjectOption((ctx.options as BeadsPluginOptions).inject);

    /** Beads context per session; `undefined` = skip. Captured once per session. */
    const sessionContext = new Map<string, Promise<string | undefined>>();

    /**
     * Check if an agent should receive beads context injection.
     *
     * Allowlist / `"none"` modes only admit listed agents (plus the plugin's
     * own `beads-task-agent`). In `"primary"` mode, subagents (like `explore`
     * and `general`) are skipped — they're invoked for specific tasks and
     * shouldn't waste tokens on beads context.
     */
    async function shouldInject(agentName: string): Promise<boolean> {
      if (agentName === BEADS_TASK_AGENT) return true;
      if (inject === "none") return false;
      if (Array.isArray(inject)) return inject.includes(agentName);

      const agent = await ctx.agent.get({ agentID: agentName }).catch(() => undefined);
      // Query failed — inject as safe fallback
      if (!agent) return true;
      return agent.data.mode === "primary" || agent.data.mode === "all";
    }

    async function resolveContext(sessionID: string, agent: string) {
      if (!(await shouldInject(agent))) return undefined;
      const session = await ctx.session.get({ sessionID }).catch(() => undefined);
      return buildBeadsContext(session?.location.directory ?? ctx.location.directory);
    }

    const registrations = await Promise.all([
      ctx.session.hook("context", async (input) => {
        let pending = sessionContext.get(input.sessionID);
        if (!pending) {
          pending = resolveContext(input.sessionID, input.agent);
          sessionContext.set(input.sessionID, pending);
        }
        const text = await pending;
        if (text) input.system.push({ type: "text", text });
      }),

      ctx.command.transform((editor) => {
        for (const [name, command] of Object.entries(commands)) {
          editor.add({
            name,
            description: command.description,
            async execute(input) {
              await ctx.session.prompt({
                ...input.prompt,
                sessionID: input.sessionID,
                text: expandTemplate(command.template, input.prompt.text),
                delivery: input.delivery,
              });
            },
          });
        }
      }),

      ctx.agent.transform((editor) => {
        for (const [id, agent] of Object.entries(agents)) {
          // `update` creates the agent when it doesn't exist yet.
          editor.update(id, (item) => {
            item.description = agent.description;
            item.system = agent.system;
            item.mode = agent.mode;
          });
        }
      }),
    ]);

    return async () => {
      await Promise.all(registrations.map((r) => r.dispose()));
    };
  },
};

export default BeadsPlugin;
