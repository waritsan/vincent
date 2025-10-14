metadata description = 'Creates an Azure Static Web Apps instance.'
param name string
param location string = resourceGroup().location
param tags object = {}
param appSettings object = {}

param sku object = {
  name: 'Free'
  tier: 'Free'
}

resource web 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  tags: tags
  sku: sku
  properties: {
    provider: 'Custom'
  }
}

resource webConfig 'Microsoft.Web/staticSites/config@2023-12-01' = if (!empty(appSettings)) {
  parent: web
  name: 'appsettings'
  properties: appSettings
}

output name string = web.name
output uri string = 'https://${web.properties.defaultHostname}'
