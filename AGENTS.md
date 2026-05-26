# AGENTS.md — pk-client branch

You're on the **pk-client** deployable branch. Content is the npm
package `planekey-client` v1.5.7. At the root: `package.json`,
`bin/pk-client.js`, `tools/`, `docs/`. Public npm publish target.

## What this product does

The 4,889-line monolith CLI that runs on a user's machine. 42
subcommands covering workspace init/import, snapshots, integrity
attestations, trust-gate scans (rootrabbit / safetynet / repoguard),
edge/cloudflare planning, self-update, rebuild scanning of zip piles,
patches, bundles, GitHub export.

Also serves as the **AI-coherence tool** for assistants without MCP
(ChatGPT, Perplexity, etc.) — the layer-attest/compare loop lets an
AI verify what changed between its own context-limited sessions.

## Key files

- `bin/pk-client.js` (4,889 lines) — the monolith
- `tools/flight.js`, `tools/hutch.js` — runtime safety validators
- `docs/AGENT_RUNTIME_MAP.md` — 8 AI runtimes detected
- `docs/TRI_LAYER_INTEGRITY.md` — dev/builder/live attestation pattern
- `docs/SELF_UPDATE.md` — how the client auto-updates
