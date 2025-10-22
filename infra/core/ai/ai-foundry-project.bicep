metadata description = 'Creates an Azure AI Foundry project with model deployment'

param aiFoundryName string
param aiProjectName string
param location string = resourceGroup().location
param tags object = {}

param deployGPT4o bool = true
param modelDeploymentName string = 'gpt-4o'
param modelCapacity int = 10

/*
  An AI Foundry resource is a variant of a CognitiveServices/account resource type
*/
resource aiFoundry 'Microsoft.CognitiveServices/accounts@2025-06-01' = {
  name: aiFoundryName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'S0'
  }
  kind: 'AIServices'
  tags: tags
  properties: {
    customSubDomainName: aiFoundryName
    publicNetworkAccess: 'Enabled'
    allowProjectManagement: true
  }
}

// create project for AI Foundry
resource aiProject 'Microsoft.CognitiveServices/accounts/projects@2025-06-01' = {
  parent: aiFoundry
  name: aiProjectName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {}
}
/*
  Model deployment for GPT-4o
*/
resource modelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-06-01' = if (deployGPT4o) {
  parent: aiFoundry
  name: modelDeploymentName
  sku: {
    capacity: modelCapacity
    name: 'Standard'
  }
  properties: {
    model: {
      name: 'gpt-4o'
      format: 'OpenAI'
      version: '2024-08-06'
    }
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
  }
}

output aiFoundryId string = aiFoundry.id
output aiFoundryName string = aiFoundry.name
output aiFoundryEndpoint string = aiFoundry.properties.endpoint
output aiFoundryPrincipalId string = aiFoundry.identity.principalId
output modelDeploymentName string = deployGPT4o ? modelDeployment.name : ''
output cognitiveServicesName string = aiFoundry.name
