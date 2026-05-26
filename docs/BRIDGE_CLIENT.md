# pk-client Home Bridge consumers (v1.5.10)

12 subcommands across two groups:

## Adapter consumers

| Subcommand | Bridge route |
|---|---|
| `pk-client flight report` | `POST /reports/update`, `/reports/runtime`, `/reports/closure` |
| `pk-client canon analyze` | `POST /canon/analyze` |
| `pk-client forensics attribution` | `POST /forensics/attribution` |
| `pk-client rgano packet` | `POST /rgano/signature-packet` |
| `pk-client rootrabbit health` | `POST /rootrabbit/health-report` |

## Trio Cluster B consumers

| Subcommand | Bridge route |
|---|---|
| `pk-client bridge probe` | `GET /api/planekey/bridge/probe` |
| `pk-client bridge attest` | `POST /bridge/attest` |
| `pk-client bridge attestations` | `GET /bridge/attestations` |
| `pk-client bridge compare` | `POST /bridge/compare` |
| `pk-client bridge incident` | `POST /bridge/incident` |
| `pk-client bridge policy` | `GET /bridge/policy` |
| `pk-client bridge dashboard` | `GET /bridge/dashboard/{id}` |

## Zero translator

| Subcommand | What |
|---|---|
| `pk-client zero translate <json>` | Convert Zero JSON to planekey.patch.v1 |
| `pk-client zero translate <json> --submit` | POST to bridge admin self-update |

## Default: local-only

Every consumer runs offline by default. Pass `--submit` to POST to bridge.planekey.dev.

Bridge URL is a constant: `https://bridge.planekey.dev`. No config knob.
