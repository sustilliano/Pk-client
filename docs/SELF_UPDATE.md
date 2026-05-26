# PlaneKey Client Self Update

## Commands

```bash
pk-client self version --manifest
pk-client self doctor
pk-client self update ./planekey-client-v1.5.7.zip --dryRun
pk-client self update ./planekey-client-v1.5.7.zip
```

## Safety model

1. Extracts/stages the candidate update
2. Requires `package.json` and `bin/pk-client.js`
3. Runs `--help` against the candidate
4. Writes update plan JSON
5. Backs up current tool files
6. Updates only allowed tool paths
7. Runs `--help` after install
8. Rolls back if smoke test fails

Protected workspace folders are not touched: vault/, inventory/, working/, patches/, bundles/, reports/, exports/
