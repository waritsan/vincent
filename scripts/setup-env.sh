#!/bin/bash
# Script to automatically configure environment variables from Azure deployment

set -e

echo "🔧 Setting up environment variables from Azure..."
echo ""

# Check if azd is installed
if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI (azd) not found. Please install it first."
    exit 1
fi

# Check if in azd environment
if [ ! -d ".azure" ]; then
    echo "❌ Not in an Azure Developer CLI environment."
    echo "   Run 'azd init' or 'azd up' first."
    exit 1
fi

# Get Function App URL from Azure
echo "📡 Fetching Azure Function App URL..."
FUNCTION_URI=$(azd env get-values | grep AZURE_FUNCTION_URI | cut -d'=' -f2 | tr -d '"')

if [ -z "$FUNCTION_URI" ]; then
    echo "❌ Could not retrieve Function App URL from Azure."
    echo "   Make sure you've run 'azd up' or 'azd provision' first."
    exit 1
fi

echo "✅ Found Function App URL: $FUNCTION_URI"
echo ""

# Create or update .env.local for Next.js
echo "📝 Updating src/web/.env.local..."
cat > src/web/.env.local << EOF
# Azure Functions API URL
# Auto-generated from Azure deployment
# Last updated: $(date)
NEXT_PUBLIC_API_URL=${FUNCTION_URI}
EOF

echo "✅ Environment file updated!"
echo ""

# Display the configuration
echo "📋 Current configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat src/web/.env.local
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: cd src/web && npm run dev"
echo "2. Your app will connect to: $FUNCTION_URI"
echo ""
echo "To reset to local development:"
echo "  cp src/web/.env.local.example src/web/.env.local"
