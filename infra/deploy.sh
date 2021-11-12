# args
#rg="cdfunc"
#server="https://colindembovsky-0cd7b2095901bb090.gh-quality.net"
#pat=""
#org="central"
#repo="ephemeral-runner"

# constants
sa="${rg}sa"
fn="${rg}fn"

echo "Create a resource group"
az group create -n $rg -l southcentralus

echo "Create a storage account and get the connection string"
az storage account create -n $sa -g $rg -l southcentralus --sku Standard_LRS

echo "Create the function app plan"
plan="${fn}-plan"
az functionapp plan create -g $rg -n $plan --sku B1

echo "Create the function app"
az functionapp create -g $rg -p $plan -n $fn -s $sa --functions-version 3 --runtime node

echo "Configure environment settings"
az functionapp config appsettings set -n $fn -g $rg --settings \
    EPHEMERAL_SPINNER_ORG=$org \
    EPHEMERAL_SPINNER_REPO=$repo \
    EPHEMERAL_SPINNER_WORKFLOW=ephemeral.yml \
    EPHEMERAL_SPINNER_WORKFLOW_REF=main \
    GITHUB_SERVER=$server \
    IGNORE_LABEL=$ignore_label \
    GITHUB_SECRET=$secret \
    PAT=$pat

# echo "Pack"
# func pack

# echo "Deploy function code"
# az functionapp deploy -n $fn -g $rg --src-path MonaResponder.zip