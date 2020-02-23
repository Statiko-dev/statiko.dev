---
title: "Pre-requisites"
linkTitle: "Pre-requisites"
slug: pre-requisites
weight: 2
description: |
  Set up the required Azure resources
---

Statiko nodes can run on any server, on any cloud and on-premises.

However, Statiko requires an object storage service and a key vault to store app bundles and secrets such as TLS certificates and codesigning keys. At the moment, Statiko uses Microsoft Azure for those services. We're happy to accept contributions that add support for other storage services or key vaults.

On Azure, Statiko requires:

- Azure Blob Storage: an object storage service to store the app bundles
- Azure Key Vault: a vault to store TLS certificates (public certificates and private keys) and the codesigning key
- Azure AD: identity service that can be used by clients to authenticate with Statiko nodes (this is optional)

For most users these two services are going to be free or cost a nominal amount every month, less than $1/month after the free trial ends.

If you don't have one already, get an [Azure account](https://azure.com/free) and start the free trial.

# Azure resources

This section explains the Azure resources that you need to deploy, and the commands to do that directly from your terminal.

To run the commands, use the Azure CLI, which is cross-platform and can be [installed from here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

After installing the Azure CLI, run the following command to authenticate with your Azure subscription:

```sh
az login
```

> Note: some of the commands below require the [jq](https://stedolan.github.io/jq/download/) utility installed

## Resource Group

A Resource Group is a logical grouping unit, which will group all resources we're creating (except Azure AD). You can create one with the command below.

You can choose as region any [Azure region](https://azure.microsoft.com/en-us/global-infrastructure/geographies/). If you're going to deploy Statiko on Azure, choose the same region where your VM will live; if your nodes will be outside of Azure, choose a region that's geographically close.

```sh
# Name of the Resource Group: can be anything you want
RG_NAME="Statiko"

# Name of the Azure region (see `az account list-locations`)
AZURE_REGION="West US 2"

# Create the Resource Group
az group create \
  --name $RG_NAME \
  --location $AZURE_REGION
```

## Azure Storage

Create a Storage Account:

```sh
# Name of the Storage account; must be globally unique
STORAGE_ACCOUNT_NAME="mystatikostorage"

# Create the Storage Account
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RG_NAME \
  --location $AZURE_REGION \
  --access-tier hot \
  --https-only true \
  --kind StorageV2 \
  --sku Standard_LRS
```

Take note of the storage account name, that is the value of `azure.storage.account` in the configuration file for the Statiko nodes.

Then, create a private container called "apps" inside the Storage Account:

```sh
# Create the "apps" container
az storage container create \
  --name apps \
  --account-name $STORAGE_ACCOUNT_NAME \
  --public-access off \
  --fail-on-exist
```

## Azure Key Vault

Next, create an Azure Key Vault that will store TLS certificates and codesigning keys, safely.

```sh
# Name of the Key Vault; must be globally unique
KEY_VAULT_NAME="mystatikokv"

# Create the Key Vault
az keyvault create \
  --name $KEY_VAULT_NAME \
  --resource-group $RG_NAME \
  --location $AZURE_REGION \
  --enable-soft-delete true \
  --enabled-for-deployment false \
  --enabled-for-disk-encryption false \
  --enabled-for-template-deployment false \
  --sku standard
```

## Service Principal

This Service Principal is used by the Statiko nodes to authenticate with Azure Key Vault and Azure Storage.

Note that we're creating the Service Principal in the "long" way (creating an Azure AD application first, then the Service Principal, then setting its permissions), without using the `azure ad sp create-for-rbac` command, to limit the permissions of the Service Principal to the absolutely minimum required.

### Create the Service Principal

Create an app in the Azure AD:

````sh
# Name of the Service Principal; can be anything you'd like
SP_NAME="Statiko-Test"

# Create the app
SP_ID=$(az ad app create \
  --display-name $SP_NAME \
  --available-to-other-tenants false \
  | jq -r .appId)

echo "Application ID is: $SP_ID"

# Create a client secret
APP_PASSWORD=$(openssl rand -base64 30)
az ad app credential reset \
  --id $SP_ID \
  --credential-description cli \
  --years 10 \
  --password $APP_PASSWORD

echo "App's secret key is: $APP_PASSWORD"
echo "Tenant ID is: $(az account show | jq -r .tenantId)"
````

Take note of the following values that will be used in the Statiko node's configuration file:

- Application ID, which is the value for `azure.sp.clientId` (and it's also used in the command below)
- Tenant ID, which is the value for `azure.sp.tenantId`
- Secret Key, which is the value for `azure.sp.clientSecret`

Create a Service Principal (with no RBAC access by default) for the app we just created:

````sh
# Create the Service Principal
az ad sp create --id $SP_ID

# Hide the app from users's dashboards
az ad sp update --id $SP_ID --add tags "HideApp"

# Optional: require admins to manually assign the app to users
az ad sp update --id $SP_ID --set appRoleAssignmentRequired=true
````

### Subscription ID

Get the Azure subscription ID in a variable:

```sh
AZURE_SUBSCRIPTION=$(az account show | jq -r .id)
echo "Azure subscription ID: $AZURE_SUBSCRIPTION"
```

This variablle will be used by some of the commands below.

### Azure Storage permissions

Ensure that the Service Principal has the "Storage Blob Data Contributor" role for the Storage Account:

```sh
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $SP_ID \
  --scope /subscriptions/$AZURE_SUBSCRIPTION/resourceGroups/$RG_NAME/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT_NAME
```

### Azure Key Vault permissions

Assign permissions to the Service Principal, creating an access policy for Azure Key Vault, with limited permissions:

- Key permissions: "Get", "List"
- Secret permissions: "Get"
- Certificate permissions: "Get", "List"

```sh
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --key-permissions get list \
  --secret-permissions get \
  --certificate-permissions get list \
  --spn $SP_ID
```

## Azure AD application for client authentication (optional)

> This step is optional

Clients can authenticate with Statiko nodes either using a pre-shared key, or through Azure AD.

Using Azure AD to authenticate with Statiko nodes has some advantages in terms of security (Azure AD tokens are are short-lived and can be revoked) and access control (if you have multiple users).

In order to let clients authenticate with Statiko nodes using Azure AD, create another Azure AD application (different from the Service Principal we created earlier):

```sh
# Applications are identified by a URL, which doesn't necessarily need to exist or be valid
APP_URL="statiko.mydomain.com"

# Create the application
APP_ID=$( \
  az ad app create \
  --display-name $APP_URL \
  --available-to-other-tenants false \
  --native-app true \
  --reply-urls http://localhost:3993 \
    | jq -r .appId \
)
echo "Azure AD auth application's ID is: $APP_ID"
echo "Tenant ID is: $(az account show | jq -r .tenantId)"
```

Take note of the following values that will be used in the Statiko node's configuration file:

- Application ID, which is the value for `auth.azureAD.clientId`
- Tenant ID, which is the value for `auth.azureAD.tenantId`

## Next step

You've completed the creation of all pre-requisites. As a next step, learn how to run Statiko:

- [Using Docker](/docs/for-admins/set-up/run-with-docker) (recommended)
- As a [standalone app](/docs/for-admins/set-up/run-standalone)
