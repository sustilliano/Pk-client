# PlaneKey Client v1.5.7

A local cleanup, inventory, SafetyNet, and reverse-rebuild client for PlaneKey.

Dependency-free Node.js. Uses Node built-ins and optional OS zip commands only.

## Install

```bash
npm install -g planekey-client
```

Or run locally:

```bash
node ./bin/pk-client.js --help
```

## What it does

- Imports messy folders and zip downloads into immutable snapshots
- Hashes files and writes manifests
- Finds duplicate files by SHA-256
- Compares two snapshots or two `.sha` manifests
- Creates one clean editable working tree
- Runs RootRabbit, Hutch, and Flight SafetyNet checks
- Runs Public RepoGuard checks (blocks secrets from GitHub exports)
- Creates PlaneKey request bundles from working-tree changes
- Exports a GitHub-ready folder excluding secrets, logs, local vaults
- Rebuilds clean project trees from zip piles using route/import/feature matrix overlap
- Private tri-layer integrity indexes (dev/builder/live attestation)
- Edge/Cloudflare defensive routing plans
- PixelGuard / ResidueGuard scanning
- AI-coherence tool for context-limited assistants

## Quick Start

```bash
pk-client init ./MyProject
cd ./MyProject
pk-client import ~/Downloads/project.zip --name fresh-download
pk-client safetynet scan
pk-client repoguard scan
pk-client export github-ready
```

## 42 Subcommands

```
pk-client init|import|list|inventory|compare|sha-compare
pk-client set-working|working-manifest
pk-client rootrabbit scan|safetynet scan|repoguard scan
pk-client rebuild scan|create|scan-zips|from-zips
pk-client patch add|bundle create|export github-ready
pk-client status|tree
pk-client self version|doctor|update
pk-client integrity private|layer attest|layer compare|layer alert|layer policy
pk-client edge scan|plan|dashboard|cloudflare policy|apply
pk-client pixelguard scan|residue map|compare|explain
pk-client burrow keygen|keys|send|inbox|proof
pk-client warren|warren mirrors|health|failovers
pk-client thump send|feed|consensus
```

## License

UNLICENSED
