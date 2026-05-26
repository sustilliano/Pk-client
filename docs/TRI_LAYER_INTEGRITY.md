# PlaneKey Tri-Layer Integrity

PlaneKey v1.5.5 separates source control, builder output, and live deployment into three integrity layers:

- `dev`: canon project files and local working tree.
- `builder`: Polsia/agent/rebuild/export layer.
- `live`: deployed Render/PlaneKey server state.

## Private hashes

v1.5.5 adds private HMAC indexes. Plain SHA256 manifests are useful for local forensics, but they should not be public trust artifacts.

```bash
export PLANEKEY_INDEX_SECRET="long-random-local-secret"
pk-client integrity private ./working/current --layer dev --name dev-index
```

## Layer attestations

```bash
pk-client layer attest dev ./working/current --name dev-canon
pk-client layer attest builder ./exports/candidate --name builder-candidate
pk-client layer attest live ./live-snapshot --name live-current
```

## Compare layers

```bash
pk-client layer compare dev-index.json builder-index.json --name dev-vs-builder
pk-client layer alert builder-index.json live-index.json --name builder-vs-live-alert
```

## Security model

The dev, builder, and live layers can compare integrity without publishing raw hashes. Runtime folders, logs, agent files, secrets, and RootRabbit nap state are excluded by default.
