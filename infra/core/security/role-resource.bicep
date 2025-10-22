metadata description = 'Creates a role assignment at the AI Services resource scope.'

param principalId string
param roleDefinitionId string
param principalType string = 'ServicePrincipal'
param cognitiveServicesName string

// Reference the existing AI Services account
resource cognitiveServices 'Microsoft.CognitiveServices/accounts@2023-05-01' existing = {
  name: cognitiveServicesName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(cognitiveServices.id, principalId, roleDefinitionId)
  scope: cognitiveServices
  properties: {
    principalId: principalId
    principalType: principalType
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
  }
}

output roleAssignmentId string = roleAssignment.id
