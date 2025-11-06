"""
Text extraction utilities using Azure OpenAI
"""
import os
import json
import logging
from typing import List, Dict, Optional
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.cosmos import CosmosClient, exceptions
from datetime import datetime, timezone


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


def get_companies_container():
    """
    Initialize and return Cosmos DB container client for company extractions in blogdb
    """
    connection_string = os.environ.get("AZURE_COSMOS_CONNECTION_STRING")
    endpoint = os.environ.get("AZURE_COSMOS_ENDPOINT")
    database_name = os.environ.get("AZURE_COSMOS_DATABASE_NAME", "blogdb")
    container_name = "company_extractions"
    
    # Prefer connection string for local development, endpoint for production
    if connection_string:
        logging.info("Using Cosmos DB connection string for company extractions")
        try:
            client = CosmosClient.from_connection_string(connection_string)
            database = client.get_database_client(database_name)
            
            # Create container if it doesn't exist
            try:
                container = database.create_container_if_not_exists(
                    id=container_name,
                    partition_key={'paths': ['/id'], 'kind': 'Hash'}
                )
                logging.info(f"Created/accessed container: {container_name}")
            except exceptions.CosmosHttpResponseError as e:
                if e.status_code == 409:  # Conflict - container already exists
                    container = database.get_container_client(container_name)
                else:
                    raise
            
            return container
        except Exception as e:
            logging.error(f"Failed to create Cosmos DB client from connection string: {e}")
            return None
    elif endpoint:
        logging.info("Using Cosmos DB endpoint with Managed Identity for company extractions")
        try:
            # Use Managed Identity for authentication
            credential = DefaultAzureCredential()
            client = CosmosClient(endpoint, credential=credential)
            database = client.get_database_client(database_name)
            
            # Create container if it doesn't exist
            try:
                container = database.create_container_if_not_exists(
                    id=container_name,
                    partition_key={'paths': ['/id'], 'kind': 'Hash'}
                )
                logging.info(f"Created/accessed container: {container_name}")
            except exceptions.CosmosHttpResponseError as e:
                if e.status_code == 409:  # Conflict - container already exists
                    container = database.get_container_client(container_name)
                else:
                    raise
            
            return container
        except Exception as e:
            logging.error(f"Failed to create Cosmos DB client with Managed Identity: {e}")
            return None
    else:
        logging.warning("Neither AZURE_COSMOS_CONNECTION_STRING nor AZURE_COSMOS_ENDPOINT configured")
        return None


def extract_companies_and_locations(text: str) -> Dict:
    """
    Extract company names, their locations, and asset valuations from text using Azure OpenAI.

    Args:
        text: The text content to analyze

    Returns:
        Dictionary containing extraction results with the following structure:
        {
            "success": bool,
            "companies": [{"name": str, "location": str, "asset_valuation": str}, ...],
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
        model_name = os.environ.get("AZURE_OPENAI_MODEL", "gpt-4o-mini")
        deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are an AI assistant that extracts company names, locations, and asset valuations from text.
Provide a list of unique company names along with their associated locations and asset valuations.
Return the results in JSON format with the following structure:
{"companies": [{"name": "Company Name", "location": "Location", "asset_valuation": "Asset Valuation"}]}

Guidelines:
- Only extract PRIVATE companies and business entities (exclude government agencies, ministries, departments, bureaus, police, task forces, etc.)
- Focus on corporations, businesses, companies, and commercial entities
- If a location is not explicitly mentioned for a company, use an empty string for location
- If an asset valuation is not explicitly mentioned for a company, use an empty string for asset_valuation
- Remove duplicates and normalize company names
- Ignore government organizations, public agencies, and official bodies
- Only include for-profit business entities and commercial companies
- Extract asset valuations in their original format (e.g., "152 ล้านบาท", "$1.5 million")""",
                },
                {
                    "role": "user",
                    "content": f"Extract all company names, their locations, and asset valuations from the following text:\n\n{text}",
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
                                    "location": company.get("location", "").strip() if company.get("location") else "",
                                    "asset_valuation": company.get("asset_valuation", "").strip() if company.get("asset_valuation") else ""
                                })

                    # Save results to CosmosDB - one document per company
                    try:
                        container = get_companies_container()
                        if container:
                            extraction_timestamp = datetime.now(timezone.utc).isoformat()
                            extraction_id = f"extraction_{int(datetime.now(timezone.utc).timestamp() * 1000000)}"
                            
                            # Save each company as a separate document
                            saved_companies = []
                            for company in cleaned_companies:
                                company_doc = {
                                    "id": f"{extraction_id}_{len(saved_companies)}",
                                    "extraction_id": extraction_id,
                                    "extraction_timestamp": extraction_timestamp,
                                    "source_text": text[:1000] + "..." if len(text) > 1000 else text,
                                    "company_name": company["name"],
                                    "location": company["location"],
                                    "asset_valuation": company["asset_valuation"],
                                    "model_used": model_name,
                                    "text_length": len(text),
                                    "created_at": extraction_timestamp
                                }
                                container.create_item(body=company_doc)
                                saved_companies.append(company_doc)
                            
                            logging.info(f"Saved {len(saved_companies)} companies to CosmosDB: {extraction_id}")
                        else:
                            logging.warning("CosmosDB not configured - extraction results not saved")
                    except Exception as db_error:
                        logging.error(f"Failed to save extraction results to CosmosDB: {db_error}")
                        # Don't fail the extraction if DB save fails

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


def extract_nominee_companies(text: str, source_url: str = "", article_title: str = "") -> Dict:
    """
    Extract company information from nominee-tagged news articles and store in CosmosDB.
    
    Args:
        text: The article text to extract companies from
        source_url: URL of the source article
        article_title: Title of the article
        
    Returns:
        Dict with extraction results and storage status
    """
    client = create_azure_client()
    if not client:
        logging.warning("Azure OpenAI client not available for nominee company extraction")
        return {
            "success": False,
            "error": "Azure OpenAI client not available",
            "companies_extracted": 0
        }

    try:
        # Use the configured model/deployment from environment or defaults
        model_name = os.environ.get("AZURE_OPENAI_MODEL", "gpt-4o-mini")
        deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are an AI assistant that extracts company information from Thai news articles about nominees and nominee shareholders.
Extract companies mentioned in the context of nominations, nominee shareholders, or nominee arrangements.

Return the results in JSON format with the following structure:
{"companies": [{"name": "Company Name", "location": "Location", "asset_valuation": "Asset Valuation", "nominee_context": "Context description"}]}

Guidelines:
- Only extract companies mentioned in nominee contexts (nominations, nominee shareholders, nominee arrangements)
- Focus on companies that are subjects of nominee arrangements or nominations
- Include location if mentioned, otherwise use empty string
- Include asset valuation if mentioned, otherwise use empty string
- Add nominee_context field describing the nominee relationship or situation
- Remove duplicates and normalize company names
- Only include for-profit business entities and commercial companies
- Extract asset valuations in their original format (e.g., "152 ล้านบาท", "$1.5 million")""",
                },
                {
                    "role": "user",
                    "content": f"Extract companies from this nominee-related news article:\n\nTitle: {article_title}\n\nContent: {text}",
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
                                    "location": company.get("location", "").strip(),
                                    "asset_valuation": company.get("asset_valuation", "").strip(),
                                    "nominee_context": company.get("nominee_context", "").strip(),
                                    "source_url": source_url,
                                    "article_title": article_title,
                                    "extraction_date": datetime.now(timezone.utc).isoformat(),
                                    "id": f"{name.lower().replace(' ', '_')}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
                                })

                    # Store in CosmosDB if we have companies
                    if cleaned_companies:
                        container = get_companies_container()
                        if container:
                            stored_count = 0
                            for company in cleaned_companies:
                                try:
                                    container.upsert_item(company)
                                    stored_count += 1
                                    logging.info(f"Stored nominee company: {company['name']}")
                                except Exception as e:
                                    logging.error(f"Failed to store company {company['name']}: {e}")
                            
                            return {
                                "success": True,
                                "companies_extracted": len(cleaned_companies),
                                "companies_stored": stored_count,
                                "companies": cleaned_companies
                            }
                        else:
                            logging.error("Could not get companies container for storage")
                            return {
                                "success": False,
                                "error": "Could not access companies container",
                                "companies_extracted": len(cleaned_companies),
                                "companies": cleaned_companies
                            }
                    else:
                        return {
                            "success": True,
                            "companies_extracted": 0,
                            "companies_stored": 0,
                            "companies": []
                        }
                else:
                    return {
                        "success": False,
                        "error": "Invalid response structure from AI",
                        "companies_extracted": 0
                    }
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse JSON response: {e}")
                return {
                    "success": False,
                    "error": f"JSON parsing error: {e}",
                    "companies_extracted": 0
                }
        else:
            return {
                "success": False,
                "error": "Empty response from AI",
                "companies_extracted": 0
            }
    except Exception as e:
        logging.error(f"Error in nominee company extraction: {e}")
        return {
            "success": False,
            "error": f"Extraction error: {str(e)}",
            "companies_extracted": 0
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
