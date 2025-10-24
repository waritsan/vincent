#!/bin/bash
# Run SSO scraper with environment variables from local.settings.json

# Read connection string from local.settings.json using jq or grep
if command -v jq &> /dev/null; then
    CONNECTION_STRING=$(jq -r '.Values.AZURE_COSMOS_CONNECTION_STRING' local.settings.json)
    DATABASE_NAME=$(jq -r '.Values.AZURE_COSMOS_DATABASE_NAME' local.settings.json)
else
    # Fallback to grep if jq is not available
    CONNECTION_STRING=$(grep -o '"AZURE_COSMOS_CONNECTION_STRING"[[:space:]]*:[[:space:]]*"[^"]*"' local.settings.json | cut -d'"' -f4)
    DATABASE_NAME=$(grep -o '"AZURE_COSMOS_DATABASE_NAME"[[:space:]]*:[[:space:]]*"[^"]*"' local.settings.json | cut -d'"' -f4)
fi

# Check if connection string was found
if [ -z "$CONNECTION_STRING" ]; then
    echo "Error: Could not read AZURE_COSMOS_CONNECTION_STRING from local.settings.json"
    exit 1
fi

# Export environment variables
export COSMOS_CONNECTION_STRING="$CONNECTION_STRING"
export COSMOS_DATABASE_ID="$DATABASE_NAME"
export COSMOS_CONTAINER_ID="posts"

echo "Running SSO Posts Scraper..."
echo "Database: $COSMOS_DATABASE_ID"
echo "Container: $COSMOS_CONTAINER_ID"
echo ""

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run the Python script
python3 scripts/scrape-sso-posts.py
