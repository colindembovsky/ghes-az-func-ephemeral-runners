# github-webhook-funcs
Simple nodejs function to respond (and post) webhooks from/to GitHub

## Testing in CodeSpaces

### Start the Emulator
```bash
cd MonaResponder

# set the config
export EPHEMERAL_SPINNER_ORG=central
export EPHEMERAL_SPINNER_REPO=ephemeral-runner
export EPHEMERAL_SPINNER_WORKFLOW=ephemeral.yml
export EPHEMERAL_SPINNER_WORKFLOW_REF=main
export PAT=<PAT with repo and workflow permissions>
export GITHUB_SERVER=https://colindembovsky-0cd7b2095901bb090.gh-quality.net

# run the function emulator
npm start
```

### curl
1. Open a new terminal
```bash
curl --header "Content-Type: application/json" --request POST http://localhost:7071/api/WorkflowJob -L --data "@test/workflow_job.json" -i
```