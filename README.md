# GHES Ephemeral Runner Function/Action Solution

This repo contains code for:
1. An Azure function that can listen for `workflow_job` webhook events from a GHES instance.
1. A workflow that can be configured in GHES to spin up ephemeral runners in Azure Container Instances (ACI) as well as tear down orphaned ACI.

## Developing in CodeSpaces

### Start the Emulator
```bash
cd MonaResponder

# set the config
export EPHEMERAL_SPINNER_ORG=central
export EPHEMERAL_SPINNER_REPO=ephemeral-runner
export EPHEMERAL_SPINNER_WORKFLOW=ephemeral.yml
export EPHEMERAL_SPINNER_WORKFLOW_REF=main
export GITHUB_SERVER=https://colindembovsky-0cd7b2095901bb090.gh-quality.net
export GITHUB_SECRET=<secret>
export IGNORE_LABEL=permanent
export PAT=<PAT with repo and workflow permissions>

# run the function emulator
npm start
```

### curl
1. Open a new terminal
1. Run curl:
```bash
sha="123"
curl -H "Content-Type: application/json" -H "x-hub-signature: sha1=$sha" -X POST http://localhost:7071/api/WorkflowJob -L --data "@test/completed.json" -i
```

> **Note**: The call should fail for mismatched signature. Check the output for the calculated hash and update the `sha` variable. Then repeat the command. If you change the contents of the file, repeat this process.

## Deploying the Function to Azure

There is an action to deploy for you! Add the secrets below, edit the static values in the workflow file and invoke.

### Secrets

Name|Value
--|--
`AZURE_CREDENTIALS`|Azure Credentials to access the destination subscription
`REPO_PAT`|PAT with `repo` and `workflow` permissions; this will be used to authenticate the `workflow_dispatch` call
`SECRET`|A `secret` that you must use when you configure the webhook in your GHES instance

### Static Values

In [.github/workflows/deploy-function.yml](.github/workflows/deploy-function.yml) there are some constants:

```yml
env:
  rg: cdfunc
  ghes: https://colindembovsky-0cd7b2095901bb090.gh-quality.net
  org: central
  repo: ephemeral-runner
  ignore-label: permanent
```  

Update these as necessary.

> **Note**: The `ignore-label` is **CRITICAL**. If you do not configure this, you will get an infinte loop where the function is queuing a workflow which triggers another queue and so on and so on. Your _permanent_ runners should have the `permanent` label to avoid this!!

> **Note**: The workflow that is triggered is `ghes/org/repo/ephemeral.yml@main` by default.

Then excute the `🚀  Deploy WebHook Fn` Action!

The last step (**Display URL**) of the function will emit the URL that you need to register. Note this URL as well as the value you configured for `SECRET`.

## Configure GHES

1. Configure your server to run Actions.
1. Register a runner at org or enterprise level with the tag `permanent`. This runner will spin up ephemeral runners.
1. Sync the [azure/login](https://github.com/azure/login) repo using [actions-sync](https://github.com/actions/actions-sync).
1. Create an org and repo for the workflow that is responsible for spinning up ephemeral agents (in response to the call from the Azure function).
1. Copy the [ghes/ephemeral.yml](ghes/ephemeral.yml) file to the `.github/workflows` folder of the repo.
1. Add the following secrets to the repo:
   - `AZURE_CREDENTIALS`: Credentials to the Azure subscription where you want to run the ACI ephemeral runners
   - `REPO_PAT`: A personal access token with `repo` and `workflow` permissions - this will be used to generate a PAT to register the agent on the incoming repo.

> **Note**: If you have an Enterprise-level permanent runner, ensure that you edit the org runner settings to allow repos to see the Enterprise runner groups.

### Set up the WebHook

1. At the Enterprise (or org) settings, navigate to **Hooks** and add a new webhook.
1. Enter the URL (including the `code`) and the `secret`.
1. Make sure to change the content type to `application/json`
1. Check `Workflow jobs` as the event type and click **Update webhook**

## Sample Workflow

With all the configuration done, you can create jobs that will be executed on the ephemeral runners:

```yml
name: Some Job

on:
  workflow_dispatch:

jobs:
  dostuff:
    runs-on: [ self-hosted, '${{ github.repository_owner }}-${{ github.event.repository.name }}-${{ github.run_id }}' ]
    steps:
    - uses: actions/checkout@v2
    - run: echo hello world!
```

The only thing you have to do is configure the runner with `self-hosted` and then some other unique value. To ensure a unique value, you can use `${{ github.repository_owner }}-${{ github.event.repository.name }}-${{ github.run_id }}`.

When this job queues, the webhook will fire and the job will wait for a runner matching the labels. The Azure Function will extract the unique label out and then invoke the `ephemeral.yml` workflow in the configured repo. This will in turn create an ACI self-hosted runner registered to the same repo as the invoking workflow with the unique label. The job then executes in the ephemeral runner. Once the job completes, the ephemeral runner unregisters. Another webhook is then fired to remove the (now terminated) ACI.