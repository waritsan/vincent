targetScope = 'subscription'

// The main bicep module to provision Azure resources.
// For a more complete walkthrough to understand how this file works with azd,
// see https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/make-azd-compatible?pivots=azd-create

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

// Optional parameters to override the default azd resource naming conventions.
// Add the following to main.parameters.json to provide values:
// "resourceGroupName": {
//      "value": "myGroupName"
// }
param resourceGroupName string = ''

var abbrs = loadJsonContent('./abbreviations.json')

// tags that should be applied to all resources.
var tags = {
  // Tag all resources with the environment name.
  'azd-env-name': environmentName
}

// Generate a unique token to be used in naming resources.
// Remove linter suppression after using.
#disable-next-line no-unused-vars
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

// Name of the service defined in azure.yaml
// A tag named azd-service-name with this value should be applied to the service host resource, such as:
//   Microsoft.Web/sites for appservice, function
// Example usage:
//   tags: union(tags, { 'azd-service-name': apiServiceName })
var apiServiceName = 'api'
var webServiceName = 'web'
var chatApiServiceName = 'chat-api'

// Organize resources in a resource group
resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Add resources to be provisioned below.
// A full example that leverages azd bicep modules can be seen in the todo-python-mongo template:
// https://github.com/Azure-Samples/todo-python-mongo/tree/main/infra

// Monitoring resources
module monitoring 'core/monitor/monitoring.bicep' = {
  name: 'monitoring'
  scope: rg
  params: {
    location: location
    tags: tags
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
  }
}

// Storage account for Azure Functions
module storage 'core/storage/storage-account.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    name: '${abbrs.storageStorageAccounts}${resourceToken}'
    location: location
    tags: tags
  }
}

// App Service Plan for Azure Functions
module appServicePlan 'core/host/appserviceplan.bicep' = {
  name: 'appserviceplan'
  scope: rg
  params: {
    name: '${abbrs.webServerFarms}${resourceToken}'
    location: location
    tags: tags
    sku: {
      name: 'Y1'
      tier: 'Dynamic'
    }
  }
}

// Azure Functions App
module functionApp 'core/host/functions.bicep' = {
  name: 'function'
  scope: rg
  params: {
    name: '${abbrs.webSitesFunctions}${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': apiServiceName })
    applicationInsightsName: monitoring.outputs.applicationInsightsName
    appServicePlanId: appServicePlan.outputs.id
    runtimeName: 'python'
    runtimeVersion: '3.12'
    storageAccountName: storage.outputs.name
    managedIdentity: true
    alwaysOn: false
    allowedOrigins: [
      'https://calm-bay-09b1e430f.1.azurestaticapps.net'
      'http://localhost:3000'
    ]
    appSettings: {
      AZURE_AI_ENDPOINT: aiFoundry.outputs.aiFoundryEndpoint
      AZURE_AI_DEPLOYMENT_NAME: aiFoundry.outputs.modelDeploymentName
      AZURE_AI_PROJECT_NAME: 'project-${resourceToken}'
      // AZURE_AI_AGENT_ID will be set manually after agent creation
      AZURE_COSMOS_ENDPOINT: cosmosDb.outputs.endpoint
      AZURE_COSMOS_DATABASE_NAME: cosmosDb.outputs.databaseName
    }
  }
}

// create a static web app
module web 'core/host/staticwebapp.bicep' = {
  name: 'web'
  scope: rg
  params: {
    name: '${abbrs.webStaticSites}${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': webServiceName })
    appSettings: {
      NEXT_PUBLIC_API_URL: functionApp.outputs.uri
    }
  }
}

// create an AI Foundry account with model deployment
module aiFoundry 'core/ai/ai-foundry-project.bicep' = {
  name: 'aifoundry'
  scope: rg
  params: {
    aiFoundryName: '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    aiProjectName: 'project-${resourceToken}'
    location: location
    tags: tags
    deployGPT4o: true
    modelDeploymentName: 'gpt-4o'
  }
}

// Grant the Function App access to AI Foundry
module aiFoundryRoleAssignment 'core/security/role-rg.bicep' = {
  name: 'ai-foundry-role-assignment'
  scope: rg
  params: {
    principalId: functionApp.outputs.identityPrincipalId
    roleDefinitionId: '25fbc0a9-bd7c-42a3-aa1a-3b75d497ee68' // Cognitive Services Contributor
    principalType: 'ServicePrincipal'
  }
}

// Container Apps Environment for chat API
module containerAppsEnvironment 'core/host/container-apps-environment.bicep' = {
  name: 'container-apps-environment'
  scope: rg
  params: {
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    tags: tags
    logAnalyticsWorkspaceName: monitoring.outputs.logAnalyticsWorkspaceName
  }
}

// Container Registry for chat API
module containerRegistry 'core/host/container-registry.bicep' = {
  name: 'container-registry'
  scope: rg
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
  }
}

// Managed Identity for Container Apps
module chatApiIdentity 'core/security/managed-identity.bicep' = {
  name: 'chat-api-identity'
  scope: rg
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}chatapi-${resourceToken}'
    location: location
    tags: tags
  }
}

// Grant Container Registry pull access to the identity
module containerRegistryAccess 'core/security/registry-access.bicep' = {
  name: 'registry-access'
  scope: rg
  params: {
    containerRegistryName: containerRegistry.outputs.name
    principalId: chatApiIdentity.outputs.principalId
  }
}

// Grant AI Foundry access to chat API identity at the resource level
module chatApiAiFoundryAccess 'core/security/role-resource.bicep' = {
  name: 'chatapi-ai-foundry-role-assignment'
  scope: rg
  params: {
    principalId: chatApiIdentity.outputs.principalId
    roleDefinitionId: '64702f94-c441-49e6-a78b-ef80e0188fee' // Azure AI Developer
    principalType: 'ServicePrincipal'
    cognitiveServicesName: aiFoundry.outputs.cognitiveServicesName
  }
}

// Grant Cognitive Services User role to chat API identity
module chatApiCognitiveServicesUser 'core/security/role-resource.bicep' = {
  name: 'chatapi-cognitive-services-user'
  scope: rg
  params: {
    principalId: chatApiIdentity.outputs.principalId
    roleDefinitionId: 'a97b65f3-24c7-4388-baec-2e87135dc908' // Cognitive Services User
    principalType: 'ServicePrincipal'
    cognitiveServicesName: aiFoundry.outputs.cognitiveServicesName
  }
}

// Chat API Container App with TRUE streaming support
module chatApi 'core/host/chat-api.bicep' = {
  name: 'chat-api'
  scope: rg
  params: {
    name: '${abbrs.appContainerApps}chatapi-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': chatApiServiceName })
    containerAppsEnvironmentName: containerAppsEnvironment.outputs.name
    containerRegistryName: containerRegistry.outputs.name
    identityName: chatApiIdentity.outputs.name
    azureAiEndpoint: aiFoundry.outputs.aiFoundryEndpoint
    azureAiProjectName: 'project-${resourceToken}'
    azureAiAgentId: 'asst_VF1pUCg1iH9WkKtnhbd3Lq09' // Set to your agent ID
    serviceName: chatApiServiceName
  }
}

// Cosmos DB with Serverless (cheapest option - pay only for what you use)
module cosmosDb 'core/database/cosmos/cosmos-serverless.bicep' = {
  name: 'cosmosdb'
  scope: rg
  params: {
    name: '${abbrs.documentDBDatabaseAccounts}${resourceToken}'
    location: location
    tags: tags
    kind: 'GlobalDocumentDB'
    databaseName: 'blogdb'
    containers: [
      {
        name: 'posts'
        partitionKeyPath: '/id'
      }
    ]
  }
}

// Grant the Function App access to Cosmos DB
module cosmosDbRoleAssignment 'core/database/cosmos/sql/cosmos-sql-role-assign.bicep' = {
  name: 'cosmosdb-role-assignment'
  scope: rg
  params: {
    accountName: cosmosDb.outputs.name
    roleDefinitionId: '${cosmosDb.outputs.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002' // Cosmos DB Built-in Data Contributor
    principalId: functionApp.outputs.identityPrincipalId
  }
}

// Add outputs from the deployment here, if needed.
//
// This allows the outputs to be referenced by other bicep deployments in the deployment pipeline,
// or by the local machine as a way to reference created resources in Azure for local development.
// Secrets should not be added here.
//
// Outputs are automatically saved in the local azd environment .env file.
// To see these outputs, run `azd env get-values`,  or `azd env get-values --output json` for json output.
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_FUNCTION_APP_NAME string = functionApp.outputs.name
output AZURE_FUNCTION_URI string = functionApp.outputs.uri
output AZURE_CHAT_API_URI string = chatApi.outputs.uri
output AZURE_CHAT_API_NAME string = chatApi.outputs.name
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_AI_ENDPOINT string = aiFoundry.outputs.aiFoundryEndpoint
output AZURE_AI_DEPLOYMENT_NAME string = aiFoundry.outputs.modelDeploymentName
output AZURE_AI_PROJECT_NAME string = 'project-${resourceToken}'
// AZURE_AI_AGENT_ID will be set manually after agent creation
output AZURE_STATIC_WEB_APP_NAME string = web.outputs.name
output AZURE_STATIC_WEB_APP_URI string = web.outputs.uri
output AZURE_COSMOS_ENDPOINT string = cosmosDb.outputs.endpoint
output AZURE_COSMOS_DATABASE_NAME string = cosmosDb.outputs.databaseName
