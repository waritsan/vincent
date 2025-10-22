metadata description = 'Creates an Azure Container App for the chat API with serverless configuration.'
param name string
param location string = resourceGroup().location
param tags object = {}

param containerAppsEnvironmentName string
param containerRegistryName string
param imageName string = ''
param serviceName string = 'chat-api'

@description('Azure AI endpoint')
param azureAiEndpoint string

@description('Azure AI project name')
param azureAiProjectName string

@description('Azure AI agent ID')
param azureAiAgentId string

@description('Managed identity name for the container app')
param identityName string

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: identityName
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvironmentName
}

resource app 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  tags: union(tags, { 'azd-service-name': serviceName })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: identity.id
        }
      ]
    }
    template: {
      containers: [
        {
          image: !empty(imageName) ? imageName : 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          name: 'chat-api'
          env: [
            {
              name: 'AZURE_AI_ENDPOINT'
              value: azureAiEndpoint
            }
            {
              name: 'AZURE_AI_PROJECT_NAME'
              value: azureAiProjectName
            }
            {
              name: 'AZURE_AI_AGENT_ID'
              value: azureAiAgentId
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: identity.properties.clientId
            }
            {
              name: 'AZURE_SUBSCRIPTION_ID'
              value: subscription().subscriptionId
            }
            {
              name: 'AZURE_RESOURCE_GROUP_NAME'
              value: resourceGroup().name
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0  // SERVERLESS: Scale to zero!
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

output uri string = 'https://${app.properties.configuration.ingress.fqdn}'
output name string = app.name
output serviceName string = serviceName
output identityPrincipalId string = identity.properties.principalId
