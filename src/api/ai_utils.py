"""
AI utility functions for content analysis and tag generation
"""
import logging
import json
import os
import re
from typing import List
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider


# Predefined tag list for Thai business news articles - General categories
PREDEFINED_TAGS = [
    # Business and Finance
    "ธุรกิจ",

    # Technology and Digital
    "เทคโนโลยี",

    # Nomination and Ownership
    "นอมินี",

    # Legal and Compliance
    "กฎหมาย",

    # Benefits and Welfare
    "สวัสดิการ",
]


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
    Select relevant tags from predefined list based on content analysis

    Args:
        content: The article content to analyze
        title: The article title (optional)
        max_tags: Maximum number of tags to select

    Returns:
        List of relevant tags from predefined list
    """
    ai_client = get_ai_client()
    if not ai_client:
        logging.warning("AI client not available for tag generation, using fallback logic")
        # Fallback logic when AI is not available
        return _generate_fallback_tags(content, title, max_tags)

    try:
        # Prepare content for analysis (limit to avoid token limits)
        analysis_text = f"Title: {title}\n\nContent: {content[:2000]}"  # Limit content length

        system_prompt = """You are an expert at analyzing Thai business news articles and selecting relevant categories from a predefined list.

Your task: Analyze the given article and select the most relevant categories from the provided predefined list.

Requirements:
- Return ONLY a JSON array of selected category strings, nothing else
- Select 2-4 most relevant categories from the predefined list
- Focus on the main topics and themes of the article
- Prioritize nomination-related categories when articles discuss nominees, nominations, or ownership issues

Predefined category list:
""" + ", ".join(f'"{tag}"' for tag in PREDEFINED_TAGS) + """

Return only a JSON array of selected category strings from the predefined list."""

        user_prompt = f"""Analyze this Thai business news article and select the most relevant categories from the predefined list:

Title: {title}
Content: {content[:2000]}

Select 2-4 categories that best describe this article's main topics and themes.

Return only a JSON array of category strings from the predefined list."""

        response = ai_client.chat.completions.create(
            model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=300,
            temperature=0.2  # Lower temperature for more consistent results
        )

        # Extract tags from response
        tags_text = response.choices[0].message.content.strip()

        # Parse JSON array
        try:
            selected_tags = json.loads(tags_text)
            if isinstance(selected_tags, list):
                # Validate that all selected tags are in the predefined list
                validated_tags = []
                for tag in selected_tags[:max_tags]:
                    if isinstance(tag, str) and tag.strip() in PREDEFINED_TAGS:
                        validated_tags.append(tag.strip())

                # If no valid tags found, return some default relevant tags
                if not validated_tags:
                    # Basic fallback based on content analysis
                    fallback_tags = []
                    content_lower = (title + " " + content).lower()

                    # Check for nomination-related content
                    if any(word in content_lower for word in ['นอมินี', 'nominee', 'กรรมสิทธิ์', 'beneficial']):
                        fallback_tags.extend(['นอมินี', 'nominee'])
                        if any(word in content_lower for word in ['หุ้น', 'shareholder', 'ผิดกฎหมาย', 'illegal']):
                            fallback_tags.extend(['นอมินีหุ้น', 'nominee shareholder'])
                            if any(word in content_lower for word in ['ผิดกฎหมาย', 'illegal', 'ทุจริต', 'fraud']):
                                fallback_tags.append('นอมินีผิดกฎหมาย')

                    # Add business/general tags if needed
                    if len(fallback_tags) < 3:
                        fallback_tags.extend(['ธุรกิจ SME', 'SME', 'ภาครัฐ'])

                    return fallback_tags[:max_tags]

                return validated_tags
            else:
                logging.warning(f"AI returned non-array response: {tags_text}")
                return ['ธุรกิจ SME', 'SME', 'ภาครัฐ']  # Basic fallback
        except json.JSONDecodeError as e:
            # Try to extract JSON from markdown code blocks as fallback
            json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', tags_text, re.DOTALL)
            if json_match:
                try:
                    selected_tags = json.loads(json_match.group(1))
                    if isinstance(selected_tags, list):
                        validated_tags = []
                        for tag in selected_tags[:max_tags]:
                            if isinstance(tag, str) and tag.strip() in PREDEFINED_TAGS:
                                validated_tags.append(tag.strip())
                        return validated_tags if validated_tags else ['ธุรกิจ SME', 'SME', 'ภาครัฐ']
                except json.JSONDecodeError:
                    pass

            logging.warning(f"Failed to parse AI tag response: {tags_text}, error: {e}")
            return ['ธุรกิจ SME', 'SME', 'ภาครัฐ']  # Basic fallback

    except Exception as e:
        logging.error(f"Error generating AI tags: {e}")
        return ['ธุรกิจ SME', 'SME', 'ภาครัฐ']  # Basic fallback
def get_available_tags() -> List[str]:
    """
    Get the complete list of predefined tags available for selection

    Returns:
        List of all available predefined tags
    """
    return PREDEFINED_TAGS.copy()


def _generate_fallback_tags(content: str, title: str = "", max_tags: int = 8) -> List[str]:
    """
    Generate tags using basic keyword matching when AI is not available

    Args:
        content: The article content to analyze
        title: The article title (optional)
        max_tags: Maximum number of tags to select

    Returns:
        List of relevant tags from predefined list based on keyword matching
    """
    content_lower = (title + " " + content).lower()
    selected_tags = []

    # Priority 1: Nomination-related tags
    if any(word in content_lower for word in ['นอมินี', 'nominee', 'กรรมสิทธิ์', 'beneficial', 'ผู้ถือหุ้น', 'shareholder']):
        selected_tags.extend(['นอมินี', 'nominee', 'กรรมสิทธิ์', 'ownership'])

    # Priority 2: Technology and Digital
    if any(word in content_lower for word in ['เทคโนโลยี', 'technology', 'ดิจิทัล', 'digital', 'ฟินเทค', 'fintech', 'สตาร์ทอัพ', 'startup', 'อีคอมเมิร์ซ', 'e-commerce']):
        selected_tags.extend(['เทคโนโลยี', 'technology', 'ดิจิทัล', 'digital'])

    # Priority 3: Government and Regulatory
    if any(word in content_lower for word in ['ภาครัฐ', 'government', 'dbd', 'กรมพัฒนาธุรกิจการค้า', 'กฎระเบียบ', 'regulations', 'ใบอนุญาต', 'licenses', 'ภาษี', 'tax']):
        selected_tags.extend(['ภาครัฐ', 'government', 'กฎระเบียบ', 'regulations'])

    # Priority 4: Legal and Compliance
    if any(word in content_lower for word in ['กฎหมาย', 'law', 'สอบสวน', 'investigation', 'ฟ้องร้อง', 'lawsuit', 'ดำเนินคดี', 'prosecution', 'ปรับเงิน', 'fine']):
        selected_tags.extend(['กฎหมาย', 'law', 'การสอบสวน', 'investigation'])

    # Priority 5: Business and Finance
    if any(word in content_lower for word in ['ธุรกิจ', 'business', 'การเงิน', 'finance', 'ธนาคาร', 'banking', 'ประกันภัย', 'insurance', 'ลงทุน', 'investment']):
        selected_tags.extend(['ธุรกิจ', 'business', 'การเงิน', 'finance'])

    # Priority 6: Economy and Market
    if any(word in content_lower for word in ['เศรษฐกิจ', 'economy', 'ตลาด', 'market', 'ส่งออก', 'export', 'นำเข้า', 'import', 'เงินเฟ้อ', 'inflation']):
        selected_tags.extend(['เศรษฐกิจ', 'economy', 'ตลาด', 'market'])

    # Priority 7: International
    if any(word in content_lower for word in ['ต่างประเทศ', 'international', 'เอเชีย', 'asia', 'ยุโรป', 'europe', 'ต่างชาติ', 'foreign']):
        selected_tags.extend(['ต่างประเทศ', 'international'])

    # Priority 8: Regional/Local
    if any(word in content_lower for word in ['กรุงเทพ', 'bangkok', 'ภาค', 'region', 'ท้องถิ่น', 'local']):
        selected_tags.extend(['กรุงเทพฯ', 'Bangkok', 'ภาคภูมิภาค', 'regional'])

    # Ensure we have at least some basic tags
    if not selected_tags:
        selected_tags = ['ธุรกิจ', 'business', 'ภาครัฐ', 'government']

    # Remove duplicates and limit to max_tags
    unique_tags = []
    for tag in selected_tags:
        if tag not in unique_tags and len(unique_tags) < max_tags:
            unique_tags.append(tag)

    return unique_tags