"""
AI utility functions for content analysis and tag generation
"""
import logging
import json
import os
from typing import List
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider


def get_ai_client():
    """Initialize and return Azure OpenAI client"""
    try:
        endpoint = os.environ.get("AZURE_AI_ENDPOINT")
        if not endpoint:
            logging.warning("AZURE_AI_ENDPOINT not configured")
            return None

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


def generate_ai_tags(content: str, title: str = "", max_tags: int = 8) -> List[str]:
    """
    Generate relevant tags for news content using AI analysis

    Args:
        content: The article content to analyze
        title: The article title (optional)
        max_tags: Maximum number of tags to generate

    Returns:
        List of relevant tags
    """
    ai_client = get_ai_client()
    if not ai_client:
        logging.warning("AI client not available for tag generation")
        return []

    try:
        # Prepare content for analysis (limit to avoid token limits)
        analysis_text = f"Title: {title}\n\nContent: {content[:2000]}"  # Limit content length

        system_prompt = """You are an expert at analyzing Thai business news articles and generating relevant tags.

Your task: Analyze the given article and return a JSON array of 3-8 relevant tags.

Requirements:
- Return ONLY a JSON array, nothing else
- Include both Thai and English tags when appropriate  
- Focus on business sectors, regions, industries, and key topics
- Consider DBD (Department of Business Development) context
- Include nomination-related tags when articles discuss nominees, nominations, or selection processes
- Use "นอมินี" (nominee) tag for articles about nominated individuals or entities

Example output: ["ธุรกิจ SME", "SME", "ภาครัฐ", "government", "เศรษฐกิจ", "economy", "นอมินี", "nominee"]"""

        user_prompt = f"""Analyze this Thai business news article and generate 3-8 relevant tags:

Title: {title}
Content: {content[:2000]}

Pay special attention to:
- Business sectors and industries
- Geographic regions and locations
- Nomination and selection processes (use "นอมินี" for nominees)
- Government and regulatory topics
- Economic and market developments

Return only a JSON array of tag strings."""

        response = ai_client.chat.completions.create(
            model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=200,
            temperature=0.3  # Lower temperature for more consistent results
        )

        # Extract tags from response
        tags_text = response.choices[0].message.content.strip()

        # Parse JSON array
        try:
            tags = json.loads(tags_text)
            if isinstance(tags, list):
                # Clean and limit tags
                cleaned_tags = []
                for tag in tags[:max_tags]:
                    if isinstance(tag, str) and tag.strip():
                        cleaned_tags.append(tag.strip())
                return cleaned_tags
            else:
                logging.warning(f"AI returned non-array response: {tags_text}")
                return []
        except json.JSONDecodeError as e:
            # Try to extract JSON from markdown code blocks as fallback
            import re
            json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', tags_text, re.DOTALL)
            if json_match:
                try:
                    tags = json.loads(json_match.group(1))
                    if isinstance(tags, list):
                        cleaned_tags = []
                        for tag in tags[:max_tags]:
                            if isinstance(tag, str) and tag.strip():
                                cleaned_tags.append(tag.strip())
                        return cleaned_tags
                except json.JSONDecodeError:
                    pass
            
            logging.warning(f"Failed to parse AI tag response: {tags_text}, error: {e}")
            return []

    except Exception as e:
        logging.error(f"Error generating AI tags: {e}")
        return []