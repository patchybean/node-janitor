# CI/CD Integration

Node Janitor is designed to work seamlessly in CI/CD pipelines.

## Silent Mode

For non-interactive environments:

```bash
node-janitor --silent --older-than 30d
```

No prompts, no colors, just results.

## JSON Output

Machine-readable output for automation:

```bash
node-janitor --json --older-than 30d
```

```json
{
  "folders": [...],
  "totalSize": 2684354560,
  "count": 15
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (scan failed, permission denied, etc.) |

## Examples

### GitHub Actions

```yaml
name: Cleanup

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Cleanup old node_modules
        run: |
          npx node-janitor --silent --older-than 7d --path ${{ github.workspace }}
```

### GitLab CI

```yaml
cleanup:
  stage: maintenance
  script:
    - npx node-janitor --silent --older-than 7d
  only:
    - schedules
```

### Jenkins

```groovy
pipeline {
    agent any
    triggers {
        cron('0 0 * * 0')
    }
    stages {
        stage('Cleanup') {
            steps {
                sh 'npx node-janitor --silent --older-than 7d --path ${WORKSPACE}'
            }
        }
    }
}
```

### Azure DevOps

```yaml
schedules:
  - cron: '0 0 * * 0'
    displayName: Weekly cleanup
    branches:
      include:
        - main

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  
  - script: npx node-janitor --silent --older-than 7d
    displayName: Cleanup node_modules
```

## Automation with JSON

Parse JSON output in scripts:

```bash
#!/bin/bash
# Get total size in bytes
TOTAL=$(node-janitor report --json | jq '.totalSize')

# Alert if over 10GB
if [ $TOTAL -gt 10737418240 ]; then
  echo "Warning: node_modules total exceeds 10GB"
  node-janitor --silent --older-than 30d
fi
```

## Docker

### Cleanup in Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm install

# Cleanup before final image
RUN npx node-janitor --deep-clean --path /app/node_modules
```

### Multi-stage Build

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Cleanup before final stage
RUN npx node-janitor --deep-clean

FROM node:20-alpine
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
```
