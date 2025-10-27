"""
Text extraction utilities using Azure OpenAI
"""
import os
import json
import logging
from typing import List, Dict, Optional
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider


def create_azure_client() -> Optional[AzureOpenAI]:
    """
    Create and return an Azure OpenAI client using managed identity authentication.

    Returns:
        AzureOpenAI client if successful, None if configuration fails
    """
    endpoint = os.environ.get("AZURE_AI_ENDPOINT")

    if not endpoint:
        logging.warning("AZURE_AI_ENDPOINT not configured")
        return None

    try:
        # Use Managed Identity for authentication
        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(
            credential,
            "https://cognitiveservices.azure.com/.default"
        )

        client = AzureOpenAI(
            azure_endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version="2024-10-21"
        )
        return client
    except Exception as e:
        logging.error(f"Failed to create Azure OpenAI client: {e}")
        return None


def extract_companies_and_locations(text: str) -> Dict:
    """
    Extract company names and their locations from text using Azure OpenAI.

    Args:
        text: The text content to analyze

    Returns:
        Dictionary containing extraction results with the following structure:
        {
            "success": bool,
            "companies": [{"name": str, "location": str}, ...],
            "total_companies": int,
            "text_length": int,
            "error": str (if success is False)
        }
    """
    if not text or not text.strip():
        return {
            "success": False,
            "error": "Text content is required",
            "companies": [],
            "total_companies": 0,
            "text_length": 0
        }

    # Get Azure OpenAI client
    client = create_azure_client()
    if not client:
        return {
            "success": False,
            "error": "Azure OpenAI client not configured",
            "companies": [],
            "total_companies": 0,
            "text_length": len(text)
        }

    try:
        # Use the configured model/deployment from environment or defaults
        model_name = os.environ.get("AZURE_OPENAI_MODEL", "gpt-5-mini")
        deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-5-mini")

        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are an AI assistant that extracts company names and their locations from text.
Provide a list of unique company names along with their associated locations.
Return the results in JSON format with the following structure:
{"companies": [{"name": "Company Name", "location": "Location"}]}

Guidelines:
- Only extract companies that are clearly mentioned in the text
- If a location is not explicitly mentioned for a company, use an empty string for location
- Remove duplicates and normalize company names
- Focus on business entities, organizations, and corporations
- Ignore generic terms that aren't specific company names""",
                },
                {
                    "role": "user",
                    "content": f"Extract all company names and their locations from the following text:\n\n{text}",
                }
            ],
            max_completion_tokens=4096,
            model=deployment,
            response_format={"type": "json_object"}  # Ensure JSON response
        )

        # Parse the response
        result_text = response.choices[0].message.content
        if result_text:
            try:
                # Parse JSON response
                result_data = json.loads(result_text)

                # Validate structure
                if "companies" in result_data and isinstance(result_data["companies"], list):
                    # Clean up and validate each company entry
                    cleaned_companies = []
                    seen_names = set()  # Track unique company names

                    for company in result_data["companies"]:
                        if isinstance(company, dict) and "name" in company:
                            name = company["name"].strip()
                            # Skip duplicates
                            if name and name.lower() not in [n.lower() for n in seen_names]:
                                seen_names.add(name)
                                cleaned_companies.append({
                                    "name": name,
                                    "location": company.get("location", "").strip() if company.get("location") else ""
                                })

                    return {
                        "success": True,
                        "companies": cleaned_companies,
                        "total_companies": len(cleaned_companies),
                        "text_length": len(text),
                        "model_used": model_name
                    }
                else:
                    return {
                        "success": False,
                        "error": "Invalid response format from AI model",
                        "companies": [],
                        "total_companies": 0,
                        "text_length": len(text)
                    }

            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse AI response as JSON: {e}")
                return {
                    "success": False,
                    "error": "Failed to parse AI response",
                    "companies": [],
                    "total_companies": 0,
                    "text_length": len(text)
                }
        else:
            return {
                "success": False,
                "error": "No response from AI model",
                "companies": [],
                "total_companies": 0,
                "text_length": len(text)
            }

    except Exception as ai_error:
        logging.error(f"Azure OpenAI error: {ai_error}")
        return {
            "success": False,
            "error": f"AI service error: {str(ai_error)}",
            "companies": [],
            "total_companies": 0,
            "text_length": len(text)
        }


def extract_from_file(file_path: str) -> Dict:
    """
    Extract company names and locations from a text file.

    Args:
        file_path: Path to the text file to analyze

    Returns:
        Dictionary containing extraction results (same format as extract_companies_and_locations)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        return extract_companies_and_locations(text)
    except FileNotFoundError:
        return {
            "success": False,
            "error": f"File not found: {file_path}",
            "companies": [],
            "total_companies": 0,
            "text_length": 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error reading file: {str(e)}",
            "companies": [],
            "total_companies": 0,
            "text_length": 0
        }


# Example usage
if __name__ == "__main__":
    # Example with file path
    result = extract_from_file('/Users/waritsan/Developer/text-extraction/doc/dbd-article.txt')
    if result["success"]:
        print("Extracted companies:")
        for company in result["companies"]:
            print(f"- {company['name']} ({company['location'] or 'Location not specified'})")
    else:
        print(f"Error: {result['error']}")