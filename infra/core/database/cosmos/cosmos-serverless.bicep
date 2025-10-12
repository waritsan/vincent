metadata description = 'Creates a serverless Azure Cosmos DB account (cheapest option - pay per use)'
param name string
param location string = resourceGroup().location
param tags object = {}

@allowed(['GlobalDocumentDB', 'MongoDB'])
param kind string = 'GlobalDocumentDB'

@description('The name of the database to create')
param databaseName string = 'defaultdb'

@description('Array of container configurations')
param containers array = []

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-08-15' = {
  name: name
  kind: kind
  location: location
  tags: tags
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    enableFreeTier: false
    apiProperties: (kind == 'MongoDB') ? { serverVersion: '4.2' } : {}
    capabilities: [
      {
        name: 'EnableServerless' // Serverless = cheapest option, pay only for what you use
      }
    ]
    minimalTlsVersion: 'Tls12'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false // Allow key-based auth for development
  }
}

// Create SQL Database (for GlobalDocumentDB kind)
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-08-15' = if (kind == 'GlobalDocumentDB') {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Create containers if specified
resource sqlContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-08-15' = [
  for container in containers: if (kind == 'GlobalDocumentDB') {
    parent: database
    name: container.name
    properties: {
      resource: {
        id: container.name
        partitionKey: {
          paths: [container.partitionKeyPath]
          kind: 'Hash'
        }
      }
    }
  }
]

output endpoint string = cosmosAccount.properties.documentEndpoint
output id string = cosmosAccount.id
output name string = cosmosAccount.name
output databaseName string = databaseName
