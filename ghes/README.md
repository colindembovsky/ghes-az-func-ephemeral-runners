# GHES Setup

1. Configure your server to run Actions.
1. Register a runner at org or enterprise level with the tag `permanent`
1. Sync the Azure login task using `actions-sync`
1. Add the following secrets to the repo:
   - `AZURE_CREDENTIALS`: Credentials to where you want to run the ACI ephemeral runners
   - `REPO_PAT`: A personal access token with `repo` and `workflow` permissions

> Note: If you have an Enterprise-level permanent runner, ensure that you edit the org runner settings to allow repos to see the Enterprise runner groups.