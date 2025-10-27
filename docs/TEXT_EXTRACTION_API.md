# Text Extraction API

This document describes the text extraction functionality that extracts company names and their locations from text using Azure OpenAI.

## Overview

The text extraction feature provides both programmatic utilities and a REST API endpoint for extracting company names and locations from text content. It uses Azure OpenAI's GPT models to intelligently identify and extract business entities.

## Features

- **Company Name Extraction**: Identifies business entities, organizations, and corporations mentioned in text
- **Location Extraction**: Associates locations with companies when mentioned
- **Duplicate Removal**: Eliminates duplicate company names
- **JSON Response Format**: Structured output for easy integration
- **Error Handling**: Comprehensive error handling and validation
- **Azure Integration**: Uses Azure OpenAI with managed identity authentication

## API Endpoint

### POST `/api/extract/entities`

Extract company names and locations from text.

**Request Body:**
```json
{
  "text": "Apple Inc. is headquartered in Cupertino, California. Microsoft Corporation is based in Redmond, Washington."
}
```

**Response:**
```json
{
  "success": true,
  "companies": [
    {
      "name": "Apple Inc.",
      "location": "Cupertino, California"
    },
    {
      "name": "Microsoft Corporation",
      "location": "Redmond, Washington"
    }
  ],
  "total_companies": 2,
  "text_length": 123,
  "model_used": "gpt-4o-mini"
}
```

**Error Response:**
```json
{
  "error": "Text content is required"
}
```

## Programmatic Usage

### Import the Module

```python
from text_extraction import extract_companies_and_locations, extract_from_file
```

### Extract from Text

```python
from text_extraction import extract_companies_and_locations

text = "Apple Inc. is based in Cupertino, California."
result = extract_companies_and_locations(text)

if result["success"]:
    for company in result["companies"]:
        print(f"{company['name']} - {company['location'] or 'Location not specified'}")
else:
    print(f"Error: {result['error']}")
```

### Extract from File

```python
from text_extraction import extract_from_file

result = extract_from_file("/path/to/document.txt")
if result["success"]:
    print(f"Found {result['total_companies']} companies")
```

## Configuration

The following environment variables control the behavior:

- `AZURE_AI_ENDPOINT`: Azure OpenAI endpoint URL
- `AZURE_OPENAI_MODEL`: Model name (default: "gpt-5-mini")
- `AZURE_OPENAI_DEPLOYMENT`: Deployment name (default: "gpt-5-mini")

## Testing

Run the test script to verify functionality:

```bash
cd src/api
python3 test_text_extraction.py
```

## Error Handling

The extraction functions handle various error conditions:

- **Missing Configuration**: Returns error when Azure OpenAI is not configured
- **Empty Text**: Validates that text content is provided
- **API Errors**: Handles Azure OpenAI service errors gracefully
- **JSON Parsing**: Validates AI model responses
- **File Operations**: Handles file reading errors

## Response Format

All responses follow a consistent structure:

```json
{
  "success": boolean,
  "companies": [
    {
      "name": string,
      "location": string
    }
  ],
  "total_companies": number,
  "text_length": number,
  "model_used": string,
  "error": string (only present if success is false)
}
```

## Examples

### Example 1: News Article
```
Input: "Tesla announced a new factory in Berlin, Germany. The company joins BMW and Volkswagen in the European market."

Output:
- Tesla (Berlin, Germany)
- BMW (European market)
- Volkswagen (European market)
```

### Example 2: Business Report
```
Input: "Microsoft Corporation, headquartered in Redmond, Washington, acquired GitHub Inc. for $7.5 billion."

Output:
- Microsoft Corporation (Redmond, Washington)
- GitHub Inc. (Location not specified)
```

## Limitations

- Requires Azure OpenAI configuration
- Extraction accuracy depends on text clarity and AI model performance
- Location extraction only works when explicitly mentioned in text
- May not identify very obscure or newly formed companies