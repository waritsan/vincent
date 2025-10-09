metadata description = 'Creates an Azure storage account.'
param name string
param location string = resourceGroup().location
param tags object = {}

@allowed(['Premium_LRS', 'Premium_ZRS', 'Standard_GRS', 'Standard_GZRS', 'Standard_LRS', 'Standard_RAGRS', 'Standard_RAGZRS', 'Standard_ZRS'])
param sku string = 'Standard_LRS'

@allowed(['BlobStorage', 'BlockBlobStorage', 'FileStorage', 'Storage', 'StorageV2'])
param kind string = 'StorageV2'

@allowed(['Hot', 'Cool'])
param accessTier string = 'Hot'

param allowBlobPublicAccess bool = false
param allowSharedKeyAccess bool = true
param defaultToOAuthAuthentication bool = false
param minimumTlsVersion string = 'TLS1_2'
param supportsHttpsTrafficOnly bool = true
param networkAcls object = {
  bypass: 'AzureServices'
  defaultAction: 'Allow'
}

resource storage 'Microsoft.Storage/storageAccounts@2022-05-01' = {
  name: name
  location: location
  tags: tags
  kind: kind
  sku: {
    name: sku
  }
  properties: {
    accessTier: accessTier
    allowBlobPublicAccess: allowBlobPublicAccess
    allowSharedKeyAccess: allowSharedKeyAccess
    defaultToOAuthAuthentication: defaultToOAuthAuthentication
    minimumTlsVersion: minimumTlsVersion
    networkAcls: networkAcls
    supportsHttpsTrafficOnly: supportsHttpsTrafficOnly
  }
}

output id string = storage.id
output name string = storage.name
output primaryEndpoints object = storage.properties.primaryEndpoints
