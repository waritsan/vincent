metadata description = 'Creates an Azure Storage blob container.'
param name string
param storageAccountName string

resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${storageAccountName}/default/${name}'
  properties: {
    publicAccess: 'None'
  }
}

output id string = blobContainer.id
output name string = blobContainer.name