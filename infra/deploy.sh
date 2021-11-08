rg=$1
sa="$rg-sa"
fn="${rg}fn"

echo "Create a resource group"
az group create -n $rg -l southcentralus

echo "Create a storage account and get the connection string"
az storage account create -n $fn -g $rg -l southcentralus --sku Standard_LRS
az storage account keys list -n $fn -g $rg 
key=$(az storage account keys list -n $fn -g $rg --query "([].value)[0]" -o tsv)
constr="DefaultEndpointsProtocol=http;AccountName=$fn;AccountKey=$key"

