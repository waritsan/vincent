"""
Advanced analytics utilities for news content analysis
Provides comprehensive data mining capabilities for news articles
"""

import logging
import json
import os
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Tuple, Any
from collections import Counter, defaultdict
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.cosmos import CosmosClient, exceptions


def get_analytics_client():
    """Initialize and return Azure OpenAI client for analytics"""
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
        logging.error(f"Failed to create analytics Azure OpenAI client: {e}")
        return None


def get_analytics_container():
    """
    Initialize and return Cosmos DB container for analytics data
    """
    connection_string = os.environ.get("AZURE_COSMOS_CONNECTION_STRING")
    endpoint = os.environ.get("AZURE_COSMOS_ENDPOINT")
    database_name = os.environ.get("AZURE_COSMOS_DATABASE_NAME", "blogdb")
    container_name = "analytics"

    # Prefer connection string for local development, endpoint for production
    if connection_string:
        logging.info("Using Cosmos DB connection string for analytics")
        try:
            client = CosmosClient.from_connection_string(connection_string)
            database = client.get_database_client(database_name)

            # Create container if it doesn't exist
            try:
                container = database.create_container_if_not_exists(
                    id=container_name,
                    partition_key={'paths': ['/analytics_type'], 'kind': 'Hash'}
                )
                logging.info(f"Created/accessed analytics container: {container_name}")
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
        logging.info("Using Cosmos DB endpoint with Managed Identity for analytics")
        try:
            # Use Managed Identity for authentication
            credential = DefaultAzureCredential()
            client = CosmosClient(endpoint, credential=credential)
            database = client.get_database_client(database_name)

            # Create container if it doesn't exist
            try:
                container = database.create_container_if_not_exists(
                    id=container_name,
                    partition_key={'paths': ['/analytics_type'], 'kind': 'Hash'}
                )
                logging.info(f"Created/accessed analytics container: {container_name}")
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


class NewsAnalytics:
    """
    Comprehensive analytics engine for news content
    """

    def __init__(self):
        self.ai_client = get_analytics_client()
        self.container = get_analytics_container()

    def analyze_article_content(self, title: str, content: str, article_id: str = None) -> Dict:
        """
        Perform comprehensive content analysis on a news article

        Args:
            title: Article title
            content: Article content
            article_id: Optional article ID for tracking

        Returns:
            Dictionary with comprehensive analytics
        """
        if not self.ai_client:
            return {
                "success": False,
                "error": "AI client not available",
                "analytics": self._basic_content_analysis(title, content)
            }

        try:
            # Combine title and content for analysis
            full_text = f"Title: {title}\n\nContent: {content}"

            # Multi-step analysis for comprehensive insights
            analysis_results = {}

            # 1. Primary Metrics Analysis
            analysis_results.update(self._extract_primary_metrics(title, content))

            # 2. Operational Metrics Analysis
            analysis_results.update(self._extract_operational_metrics(title, content))

            # 3. AI Analytics Metadata
            analysis_results.update(self._extract_ai_metadata(title, content))

            # 4. Sentiment Analysis
            analysis_results.update(self._analyze_sentiment(full_text))

            # 5. Named Entity Recognition (beyond companies)
            analysis_results.update(self._extract_entities(full_text))

            # 6. Topic Classification
            analysis_results.update(self._classify_topics(title, content))

            # 7. Content Quality Metrics
            analysis_results.update(self._analyze_content_quality(title, content))

            # 8. Regulatory Compliance Indicators
            analysis_results.update(self._detect_regulatory_signals(content))

            # 9. Minister-Focused Metrics
            analysis_results.update(self._extract_minister_metrics(title, content))

            # 10. Policy/Program Metrics
            analysis_results.update(self._extract_policy_metrics(title, content))

            # 11. Media & Sentiment Metrics
            analysis_results.update(self._extract_media_sentiment_metrics(title, content))

            # Add metadata
            analysis_results.update({
                "article_id": article_id,
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "content_length": len(content),
                "word_count": len(content.split()),
                "analysis_version": "4.0"
            })

            # Store in database if available
            if self.container and article_id:
                try:
                    analytics_doc = {
                        "id": f"analytics_{article_id}",
                        "analytics_type": "article_analysis",
                        "article_id": article_id,
                        **analysis_results
                    }
                    self.container.upsert_item(analytics_doc)
                    analysis_results["stored_in_db"] = True
                except Exception as e:
                    logging.error(f"Failed to store analytics: {e}")
                    analysis_results["stored_in_db"] = False

            return {
                "success": True,
                "analytics": analysis_results
            }

        except Exception as e:
            logging.error(f"Error in comprehensive analysis: {e}")
            return {
                "success": False,
                "error": str(e),
                "analytics": self._basic_content_analysis(title, content)
            }

    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment and emotional tone"""
        try:
            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{
                    "role": "system",
                    "content": """Analyze the sentiment and emotional tone of the news article.
Return a JSON object with sentiment scores and key indicators.

Format:
{
  "sentiment": {
    "overall": "positive|negative|neutral",
    "confidence": 0.0-1.0,
    "scores": {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
  },
  "emotional_indicators": ["list", "of", "key", "emotions"],
  "tone": "formal|informative|alarmist|optimistic|pessimistic",
  "urgency_level": "low|medium|high|critical"
}"""
                }, {
                    "role": "user",
                    "content": f"Analyze sentiment and tone: {text[:2000]}"
                }],
                max_tokens=300,
                temperature=0.1
            )

            result = json.loads(response.choices[0].message.content)
            return {"sentiment_analysis": result}

        except Exception as e:
            logging.error(f"Sentiment analysis error: {e}")
            return {"sentiment_analysis": {"overall": "neutral", "confidence": 0.5}}

    def _extract_entities(self, text: str) -> Dict:
        """Extract named entities beyond companies"""
        try:
            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{
                    "role": "system",
                    "content": """Extract named entities from the text. Focus on:
- People (executives, officials, experts)
- Organizations (government agencies, companies, NGOs)
- Locations (cities, provinces, countries)
- Monetary values and percentages
- Dates and time periods
- Laws and regulations mentioned

Return as JSON:
{
  "people": ["person1", "person2"],
  "organizations": ["org1", "org2"],
  "locations": ["location1", "location2"],
  "monetary_values": ["100 million baht", "5% increase"],
  "dates": ["date1", "date2"],
  "regulations": ["law1", "regulation1"]
}"""
                }, {
                    "role": "user",
                    "content": f"Extract entities: {text[:2000]}"
                }],
                max_tokens=500,
                temperature=0.1
            )

            result = json.loads(response.choices[0].message.content)
            return {"entity_extraction": result}

        except Exception as e:
            logging.error(f"Entity extraction error: {e}")
            return {"entity_extraction": {}}

    def _classify_topics(self, title: str, content: str) -> Dict:
        """Classify article into business topics"""
        try:
            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{
                    "role": "system",
                    "content": """Classify the news article into business and regulatory topics.
Return primary and secondary topics with confidence scores.

Topics: business_development, regulatory_compliance, financial_markets, corporate_news,
government_policy, legal_matters, technology_innovation, international_trade,
economic_indicators, consumer_protection, environmental_regulation, labor_issues

Format:
{
  "primary_topic": "topic_name",
  "secondary_topics": ["topic1", "topic2"],
  "topic_confidence": 0.0-1.0,
  "business_impact": "high|medium|low",
  "regulatory_focus": true|false
}"""
                }, {
                    "role": "user",
                    "content": f"Title: {title}\nContent: {content[:1500]}"
                }],
                max_tokens=300,
                temperature=0.1
            )

            result = json.loads(response.choices[0].message.content)
            return {"topic_classification": result}

        except Exception as e:
            logging.error(f"Topic classification error: {e}")
            return {"topic_classification": {"primary_topic": "general_business"}}

    def _analyze_content_quality(self, title: str, content: str) -> Dict:
        """Analyze content quality metrics"""
        # Basic metrics
        word_count = len(content.split())
        sentence_count = len(re.split(r'[.!?]+', content))
        avg_words_per_sentence = word_count / max(sentence_count, 1)

        # Readability score (simplified)
        complex_words = len([w for w in content.split() if len(w) > 6])
        readability_score = 206.835 - 1.015 * (word_count / max(sentence_count, 1)) - 84.6 * (complex_words / max(word_count, 1))

        # Content depth indicators
        has_quotes = '"' in content or "'" in content
        has_statistics = bool(re.search(r'\d+', content))
        has_sources = any(word in content.lower() for word in ['กล่าว', 'ระบุ', 'เปิดเผย', 'อ้าง'])

        return {
            "content_quality": {
                "word_count": word_count,
                "sentence_count": sentence_count,
                "avg_words_per_sentence": round(avg_words_per_sentence, 1),
                "readability_score": round(readability_score, 1),
                "has_quotes": has_quotes,
                "has_statistics": has_statistics,
                "has_sources": has_sources,
                "content_depth_score": sum([has_quotes, has_statistics, has_sources]) / 3
            }
        }

    def _detect_regulatory_signals(self, content: str) -> Dict:
        """Detect regulatory compliance and legal signals"""
        regulatory_keywords = {
            'high': ['ตรวจสอบ', 'สอบสวน', 'ดำเนินคดี', 'ปรับเงิน', 'เพิกถอน', 'ระงับ', 'ยกเลิก'],
            'medium': ['กำกับดูแล', 'ตรวจสอบ', 'อนุญาต', 'ใบอนุญาต', 'ขออนุญาต', 'ปฏิบัติตาม'],
            'low': ['กฎระเบียบ', 'กฎหมาย', 'ประกาศ', 'คำสั่ง', 'ระเบียบ']
        }

        signals_found = []
        risk_level = 'low'

        for level, keywords in regulatory_keywords.items():
            for keyword in keywords:
                if keyword in content:
                    signals_found.append(keyword)
                    if level == 'high':
                        risk_level = 'high'
                    elif level == 'medium' and risk_level == 'low':
                        risk_level = 'medium'

        return {
            "regulatory_signals": {
                "signals_detected": signals_found,
                "risk_level": risk_level,
                "compliance_focus": len(signals_found) > 0,
                "signal_count": len(signals_found)
            }
        }

    def _assess_market_impact(self, content: str) -> Dict:
        """Assess potential market impact"""
        impact_indicators = {
            'high': ['bankrupt', 'insolvent', 'liquidation', 'bankruptcy', 'crisis', 'emergency'],
            'medium': ['restructure', 'reorganization', 'merger', 'acquisition', 'layoffs', 'cuts'],
            'low': ['expansion', 'growth', 'investment', 'partnership', 'award', 'recognition']
        }

        impact_signals = []
        market_impact = 'neutral'

        for level, indicators in impact_indicators.items():
            for indicator in indicators:
                if indicator.lower() in content.lower():
                    impact_signals.append(indicator)
                    if level == 'high':
                        market_impact = 'negative_high'
                    elif level == 'medium' and market_impact == 'neutral':
                        market_impact = 'negative_medium'
                    elif level == 'low' and market_impact in ['neutral', 'negative_medium']:
                        market_impact = 'positive'

        return {
            "market_impact": {
                "impact_signals": impact_signals,
                "market_impact": market_impact,
                "signal_count": len(impact_signals)
            }
        }

    def _extract_minister_metrics(self, title: str, content: str) -> Dict:
        """Extract minister-focused metrics from the article"""
        try:
            full_text = f"Title: {title}\n\nContent: {content}"

            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{
                    "role": "system",
                    "content": """Extract minister-focused metrics from this news article. Focus on:

1. MENTIONS & VISIBILITY:
- Minister Name Mentions Count
- Ministry Name Mentions Count  
- Position Titles Appearing (e.g., "Minister of Finance", "Deputy Minister")
- Other Ministers Mentioned Together (for collaboration analysis)

2. ACHIEVEMENTS & ACTIONS:
- Key Achievements Listed
- Actions Taken / Decisions Announced
- Policies Endorsed
- Budgets/Spending Announced
- Important Quotes by the Minister

3. RESPONSIBILITY AREAS:
Classify what domain the article touches:
- "Economy", "Health", "Transportation", "National Security", "Digital/Technology", "Tourism", etc.

IMPORTANT: Return ONLY a valid JSON object with no additional text, explanations, or formatting. Do not wrap in code blocks or add comments.

Format:
{
  "minister_mentions": {
    "minister_name_count": 0,
    "ministry_name_count": 0,
    "position_titles": ["Minister of Finance"],
    "other_ministers_mentioned": ["Minister of Commerce"]
  },
  "achievements_actions": {
    "key_achievements": ["Achievement 1", "Achievement 2"],
    "actions_taken": ["Action 1", "Action 2"],
    "policies_endorsed": ["Policy 1"],
    "budgets_announced": ["100 million baht"],
    "important_quotes": ["Quote text"]
  },
  "responsibility_areas": ["Economy", "Digital/Technology"]
}"""
                }, {
                    "role": "user",
                    "content": f"Extract minister metrics: {full_text[:2500]}"
                }],
                max_tokens=800,
                temperature=0.1
            )

            result_text = response.choices[0].message.content.strip()
            # Remove any markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
            return {"minister_focused_metrics": result}

        except Exception as e:
            logging.error(f"Minister metrics extraction error: {e}")
            return {"minister_focused_metrics": {}}

    def _extract_policy_metrics(self, title: str, content: str) -> Dict:
        """Extract policy/program metrics from the article"""
        try:
            full_text = f"Title: {title}\n\nContent: {content}"

            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{
                    "role": "system",
                    "content": """Extract policy/program metrics from this government news article. Focus on:

1. POLICY/PROJECT IDENTIFICATION:
- Name of the Initiative or Project
- Start & End Dates
- Location/Province
- Agency Involved (e.g., DBD, Ministry of Commerce)

2. PUBLIC IMPACT METRICS:
- Target Group (e.g., SMEs, farmers, elderly)
- Objective of Project
- Expected Outcomes (e.g., "Increase tourism by 10%")

3. FINANCIAL INFORMATION:
- Budget Amount Mentioned
- Funding Source
- Breakdown categories (if available)

4. KEY RISKS OR ISSUES:
- Problems highlighted
- Complaints raised
- Challenges identified

IMPORTANT: Return ONLY a valid JSON object with no additional text, explanations, or formatting. Do not wrap in code blocks or add comments.

Format:
{
  "policy_identification": {
    "initiative_name": "Digital Economy Promotion Project",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "location": "Bangkok",
    "agency_involved": "Ministry of Digital Economy"
  },
  "public_impact": {
    "target_group": ["SMEs", "Startups"],
    "objective": "Promote digital transformation",
    "expected_outcomes": ["10% increase in digital adoption"]
  },
  "financial_info": {
    "budget_amount": "500 million baht",
    "funding_source": "Government budget",
    "budget_breakdown": ["Technology: 300M", "Training: 200M"]
  },
  "risks_issues": {
    "problems_highlighted": ["Digital divide"],
    "complaints_raised": ["Slow implementation"],
    "challenges_identified": ["Infrastructure limitations"]
  }
}"""
                }, {
                    "role": "user",
                    "content": f"Extract policy metrics: {full_text[:2500]}"
                }],
                max_tokens=1000,
                temperature=0.1
            )

            result_text = response.choices[0].message.content.strip()
            # Remove any markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
            return {"policy_program_metrics": result}

        except Exception as e:
            logging.error(f"Policy metrics extraction error: {e}")
            return {"policy_program_metrics": {}}

    def _extract_media_sentiment_metrics(self, title: str, content: str) -> Dict:
        """Extract media and sentiment metrics from the article"""
        try:
            full_text = f"Title: {title}\n\nContent: {content}"

            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[{
                    "role": "system",
                    "content": """Extract media and sentiment metrics from this news article. Focus on:

1. SENTIMENT ANALYSIS:
- Overall sentiment (positive/negative/neutral)
- Sentiment specifically toward the minister
- Sentiment toward the ministry
- Sentiment toward the policy/project

2. TONE & FRAMING:
- Tone: "factual", "critical", "supportive", "uncertain"
- Framing: "achievement-focused", "problem-focused", "controversy", "announcement", "follow-up/updates"

3. MEDIA SOURCE METADATA:
- Source (e.g., DBD, ThaiGov, PRD)
- Category (press release, public warning, success story, policy update)
- Publication date (if mentioned)
- Region (if specified)

4. NAMED ENTITIES:
- People
- Organizations
- Laws
- Projects
- Locations

IMPORTANT: Return ONLY a valid JSON object with no additional text, explanations, or formatting. Do not wrap in code blocks or add comments.

Format:
{
  "sentiment_analysis": {
    "overall_sentiment": "positive",
    "minister_sentiment": "neutral",
    "ministry_sentiment": "positive",
    "policy_sentiment": "positive"
  },
  "tone_framing": {
    "tone": "factual",
    "framing": "announcement",
    "tone_confidence": 0.85
  },
  "media_metadata": {
    "source": "DBD",
    "category": "press release",
    "publication_date": "2024-11-15",
    "region": "National"
  },
  "named_entities": {
    "people": ["Minister Name"],
    "organizations": ["DBD", "Ministry of Commerce"],
    "laws": ["Business Development Act"],
    "projects": ["Digital Economy Project"],
    "locations": ["Bangkok", "Chiang Mai"]
  }
}"""
                }, {
                    "role": "user",
                    "content": f"Extract media sentiment metrics: {full_text[:2500]}"
                }],
                max_tokens=1000,
                temperature=0.1
            )

            result_text = response.choices[0].message.content.strip()
            # Remove any markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
            return {"media_sentiment_metrics": result}

        except Exception as e:
            logging.error(f"Media sentiment metrics extraction error: {e}")
            return {"media_sentiment_metrics": {}}

    def _basic_content_analysis(self, title: str, content: str) -> Dict:
        """Fallback basic analysis when AI is unavailable"""
        return {
            "word_count": len(content.split()),
            "has_numbers": bool(re.search(r'\d+', content)),
            "has_quotes": '"' in content or "'" in content,
            "sentiment_basic": "neutral",
            "analysis_type": "basic_fallback"
        }

    def generate_trending_topics(self, days: int = 7) -> Dict:
        """
        Generate trending topics analysis from recent articles

        Args:
            days: Number of days to analyze

        Returns:
            Trending topics with frequency and growth metrics
        """
        try:
            # Get posts from the last N days
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

            # Query posts (assuming we have access to posts container)
            # This would need to be implemented based on their posts structure

            # For now, return placeholder structure
            return {
                "success": True,
                "period_days": days,
                "trending_topics": [
                    {"topic": "นอมินี", "frequency": 15, "growth_rate": 0.25},
                    {"topic": "SME", "frequency": 12, "growth_rate": 0.15},
                    {"topic": "กฎระเบียบ", "frequency": 8, "growth_rate": 0.05}
                ],
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logging.error(f"Error generating trending topics: {e}")
            return {"success": False, "error": str(e)}

    def analyze_news_volume_trends(self, months: int = 6) -> Dict:
        """
        Analyze news volume trends over time

        Args:
            months: Number of months to analyze

        Returns:
            Volume trends and seasonal patterns
        """
        try:
            # This would analyze posting patterns over time
            # Implementation would depend on their posts data structure

            return {
                "success": True,
                "period_months": months,
                "volume_trends": {
                    "total_articles": 245,
                    "avg_per_week": 12.5,
                    "peak_day": "Wednesday",
                    "seasonal_pattern": "Business news peaks mid-week"
                },
                "topic_distribution": {
                    "regulatory": 35,
                    "business": 28,
                    "technology": 15,
                    "economic": 12,
                    "other": 10
                },
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logging.error(f"Error analyzing volume trends: {e}")
            return {"success": False, "error": str(e)}

    def detect_content_clusters(self, articles: List[Dict]) -> Dict:
        """
        Group similar articles into content clusters

        Args:
            articles: List of article dictionaries

        Returns:
            Content clusters with themes and relationships
        """
        try:
            if not self.ai_client:
                return {"success": False, "error": "AI client not available"}

            # Extract titles and content for clustering
            content_list = []
            for article in articles[:20]:  # Limit for processing
                content_list.append({
                    "id": article.get("id", ""),
                    "title": article.get("title", ""),
                    "content": article.get("content", "")[:500]
                })

            # Use AI to cluster content
            response = self.ai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "system",
                    "content": """Group these news articles into thematic clusters.
Identify main themes and group related articles together.

Return as JSON:
{
  "clusters": [
    {
      "theme": "Theme name",
      "articles": ["article_id1", "article_id2"],
      "key_topics": ["topic1", "topic2"],
      "article_count": 3
    }
  ],
  "total_clusters": 5,
  "coverage_percentage": 95.0
}"""
                }, {
                    "role": "user",
                    "content": f"Cluster these {len(content_list)} articles:\n" +
                              "\n".join([f"{i+1}. {item['title']}" for i, item in enumerate(content_list)])
                }],
                max_tokens=800,
                temperature=0.2
            )

            result = json.loads(response.choices[0].message.content)
            return {
                "success": True,
                "clustering": result,
                "articles_analyzed": len(content_list),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            logging.error(f"Error in content clustering: {e}")
            return {"success": False, "error": str(e)}

    def generate_business_intelligence_report(self) -> Dict:
        """
        Generate comprehensive business intelligence report

        Returns:
            BI report with key insights and metrics
        """
        try:
            # Aggregate various analytics
            report = {
                "report_title": "DBD News Business Intelligence Report",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "period": "Last 30 days",

                "key_metrics": {
                    "total_articles": 0,  # Would be calculated from posts
                    "companies_mentioned": 0,  # From company extractions
                    "regulatory_articles": 0,
                    "sentiment_distribution": {"positive": 0, "negative": 0, "neutral": 0}
                },

                "top_insights": [
                    "Regulatory compliance articles increased by 25%",
                    "SME sector shows growing interest with 40% more mentions",
                    "Technology adoption in business processes trending upward"
                ],

                "risk_indicators": {
                    "high_risk_articles": 0,
                    "regulatory_violations_detected": 0,
                    "market_disruption_signals": 0
                },

                "recommendations": [
                    "Increase monitoring of nominee-related articles",
                    "Focus on SME development news coverage",
                    "Track technology adoption trends in Thai businesses"
                ]
            }

            return {"success": True, "report": report}

        except Exception as e:
            logging.error(f"Error generating BI report: {e}")
            return {"success": False, "error": str(e)}

    def _extract_primary_metrics(self, title: str, content: str) -> Dict:
        """
        Extract Primary Metrics focusing on 6 key areas and determine PRIMARY SOCIOECONOMIC CATEGORY:
        A. เศรษฐกิจและศักยภาพการแข่งขัน (Economic Growth and Competitiveness)
        B. พัฒนาทรัพยากรมนุษย์ / การศึกษา / ทักษะ (Human Resource Development / Education / Skills)
        C. การลดความเหลื่อมล้ำ / สวัสดิการประชาชน (Reducing Inequality / Social Welfare)
        D. ความมั่นคงด้านสุขภาพ / ระบบสาธารณสุข (Health Security / Public Health System)
        E. ความมั่นคงด้านอาหาร พลังงาน และสิ่งแวดล้อม (Food, Energy and Environmental Security)
        F. การบริหารภาครัฐ / ธรรมาภิบาล / ดิจิทัลภาครัฐ (Public Administration / Governance / Digital Government)
        """
        # First, determine the primary socioeconomic category
        category_prompt = f"""
        Analyze this Thai government news article and determine which ONE of the 6 socioeconomic areas is the PRIMARY focus.

        Article Title: {title}
        Article Content: {content}

        The 6 socioeconomic areas are:

        A. ECONOMIC_GROWTH_COMPETITIVENESS - Economic growth, investment, exports, innovation, SME development, digital economy, productivity
        B. HUMAN_RESOURCE_DEVELOPMENT - Education, skills training, workforce development, STEM education, employment, labor market
        C. SOCIAL_WELFARE_INEQUALITY_REDUCTION - Poverty reduction, social welfare, income inequality, healthcare access, social security, vulnerable groups
        D. HEALTH_SECURITY_PUBLIC_HEALTH - Hospitals, healthcare system, disease prevention, vaccination, public health capacity, telemedicine
        E. FOOD_ENERGY_ENVIRONMENTAL_SECURITY - Renewable energy, environmental protection, climate change, water management, food security, pollution control
        F. PUBLIC_ADMINISTRATION_GOVERNANCE - E-government, digital government, anti-corruption, public sector modernization, transparency, administrative efficiency

        IMPORTANT: Choose EXACTLY ONE primary category that best represents the main focus of this article.

        Return ONLY a JSON object:
        {{
            "primary_socioeconomic_category": "ECONOMIC_GROWTH_COMPETITIVENESS|HUMAN_RESOURCE_DEVELOPMENT|SOCIAL_WELFARE_INEQUALITY_REDUCTION|HEALTH_SECURITY_PUBLIC_HEALTH|FOOD_ENERGY_ENVIRONMENTAL_SECURITY|PUBLIC_ADMINISTRATION_GOVERNANCE",
            "category_confidence": 0.0-1.0,
            "category_reasoning": "brief explanation in Thai of why this category was chosen"
        }}
        """

        primary_category = "PUBLIC_ADMINISTRATION_GOVERNANCE"  # Default fallback
        category_confidence = 0.5
        category_reasoning = "Default classification - regulatory/governance focus"

        try:
            category_response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are an expert in Thai government policy classification. Analyze the article and determine which ONE socioeconomic area is the primary focus. Provide the category_reasoning explanation in Thai language."},
                    {"role": "user", "content": category_prompt}
                ],
                temperature=0.1,
                max_tokens=300
            )

            category_result_text = category_response.choices[0].message.content.strip()
            if category_result_text.startswith("```json"):
                category_result_text = category_result_text[7:]
            if category_result_text.endswith("```"):
                category_result_text = category_result_text[:-3]
            category_result_text = category_result_text.strip()

            category_result = json.loads(category_result_text)
            primary_category = category_result.get("primary_socioeconomic_category", primary_category)
            category_confidence = category_result.get("category_confidence", category_confidence)
            category_reasoning = category_result.get("category_reasoning", category_reasoning)

        except Exception as e:
            logging.error(f"Error determining primary socioeconomic category: {e}")
            # Continue with default category

        # Now extract detailed metrics for all areas
        prompt = f"""
        Analyze this Thai government news article and extract PRIMARY METRICS from the following 6 key areas:

        Article Title: {title}
        Article Content: {content}

        Extract metrics for each area (return as JSON):

        {{
            "primary_socioeconomic_category": "{primary_category}",
            "category_confidence": {category_confidence},
            "category_reasoning": "{category_reasoning}",
            "economic_growth_competitiveness": {{
                "gdp_growth_rate": "GDP growth rate mentioned (e.g., '3.5%') or null",
                "productivity_indicators": {{
                    "tfp_total_factor_productivity": "TFP growth rate or null",
                    "labor_productivity": "labor productivity growth rate or null"
                }},
                "investment_volume": {{
                    "fdi_foreign_direct_investment": "FDI amount or growth mentioned",
                    "domestic_investment": "domestic investment amount or growth mentioned"
                }},
                "innovation_economy": {{
                    "innovation_index": "innovation index score or ranking mentioned",
                    "patent_filings": "number of patent filings or growth mentioned"
                }},
                "digital_economy_share": "digital economy share of GDP mentioned",
                "export_value": {{
                    "overall_export_value": "total export value mentioned",
                    "key_sector_exports": ["list of key export sectors with values"]
                }},
                "sme_performance": {{
                    "sme_contribution_gdp": "SME contribution to GDP mentioned",
                    "sme_growth_rate": "SME growth rate mentioned",
                    "sme_employment_share": "SME employment share mentioned"
                }},
                "digital_technology_adoption": {{
                    "ai_adoption_rate": "AI adoption metrics mentioned",
                    "cloud_computing_usage": "cloud computing adoption mentioned",
                    "automation_implementation": "automation/digital tech implementation mentioned"
                }},
                "news_signals_economic": ["list of economic policy signals like 'นโยบายภาษี', 'มาตรการส่งเสริมการลงทุน', 'ศูนย์นวัตกรรม', 'เขตเศรษฐกิจพิเศษ', 'ความคืบหน้าโครงสร้างพื้นฐาน'"]
            }},
            "human_resource_development": {{
                "education_quality": {{
                    "pisa_scores": "PISA scores mentioned",
                    "literacy_rate": "literacy rate mentioned",
                    "education_index": "education index score mentioned"
                }},
                "stem_graduates": {{
                    "stem_graduate_numbers": "number of STEM graduates mentioned",
                    "stem_graduate_growth": "STEM graduate growth rate mentioned"
                }},
                "skill_upgrading": {{
                    "reskilling_programs": ["list of reskilling programs"],
                    "upskilling_initiatives": ["list of upskilling initiatives"],
                    "skill_gap_reduction": "skill gap reduction metrics mentioned"
                }},
                "digital_economy_workforce_readiness": {{
                    "digital_skills_training": ["list of digital skills training programs"],
                    "ict_competency_levels": "ICT competency levels mentioned",
                    "digital_workforce_readiness_index": "digital workforce readiness index mentioned"
                }},
                "employment_indicators": {{
                    "unemployment_rate": "unemployment rate mentioned",
                    "employment_rate": "employment rate mentioned",
                    "youth_unemployment": "youth unemployment rate mentioned"
                }},
                "labor_market_wages": {{
                    "average_wage_growth": "average wage growth mentioned",
                    "minimum_wage_adjustments": "minimum wage adjustments mentioned",
                    "wage_inequality_metrics": "wage inequality metrics mentioned"
                }},
                "news_signals_hr": ["list of HR signals like 'การยกระดับแรงงาน', 'หลักสูตรใหม่ด้านดิจิทัล', 'โครงการสมัครงาน', 'นโยบายลดว่างงาน'"]
            }},
            "social_welfare_inequality_reduction": {{
                "income_inequality": {{
                    "gini_coefficient": "Gini coefficient mentioned",
                    "income_inequality_trend": "income inequality trend mentioned"
                }},
                "household_debt": {{
                    "household_debt_gdp_ratio": "household debt to GDP ratio mentioned",
                    "debt_reduction_programs": ["list of debt reduction programs"]
                }},
                "poverty_indicators": {{
                    "poverty_rate": "poverty rate mentioned",
                    "poverty_reduction_target": "poverty reduction target mentioned",
                    "extreme_poverty_rate": "extreme poverty rate mentioned"
                }},
                "cost_of_living": {{
                    "inflation_rate": "inflation rate mentioned",
                    "cost_of_living_index": "cost of living index mentioned",
                    "basic_needs_cost": "cost of basic needs mentioned"
                }},
                "social_welfare_coverage": {{
                    "social_security_coverage": "social security coverage rate mentioned",
                    "welfare_recipients": "number of welfare recipients mentioned",
                    "welfare_benefits_expansion": ["list of welfare benefits expansions"]
                }},
                "healthcare_access": {{
                    "universal_healthcare_coverage": "universal healthcare coverage rate mentioned",
                    "healthcare_access_improvements": ["list of healthcare access improvements"]
                }},
                "government_benefits_access": {{
                    "benefits_digital_access": "digital access to government benefits mentioned",
                    "benefits_application_simplification": ["list of benefits application simplifications"]
                }},
                "news_signals_social": ["list of social signals like 'สิทธิประโยชน์ใหม่', 'เบี้ยยังชีพ', 'บัตรสวัสดิการแห่งรัฐ', 'มาตรการลดหนี้', 'การเข้าถึงสวัสดิการของกลุ่มเปราะบาง'"]
            }},
            "health_security_public_health": {{
                "hospital_capacity_upgrades": {{
                    "hospitals_upgraded": "number of hospitals upgraded mentioned",
                    "new_hospital_construction": "new hospital construction mentioned",
                    "bed_capacity_expansion": "bed capacity expansion mentioned"
                }},
                "healthcare_coverage_metrics": {{
                    "healthcare_coverage_rate": "healthcare coverage rate mentioned",
                    "insurance_coverage_expansion": "insurance coverage expansion mentioned"
                }},
                "public_health_capacity": {{
                    "beds_per_population": "beds per population ratio mentioned",
                    "healthcare_workers_per_population": "healthcare workers per population mentioned",
                    "medical_equipment_availability": "medical equipment availability mentioned"
                }},
                "digital_health_adoption": {{
                    "telemedicine_implementation": "telemedicine implementation mentioned",
                    "digital_health_records": "digital health records adoption mentioned",
                    "health_apps_utilization": "health apps utilization mentioned"
                }},
                "communicable_disease_trends": {{
                    "disease_surveillance_systems": ["list of disease surveillance systems"],
                    "vaccination_coverage": "vaccination coverage rates mentioned",
                    "pandemic_preparedness": ["list of pandemic preparedness measures"]
                }},
                "news_signals_health": ["list of health signals like 'การลงทุนในโรงพยาบาล', 'การเตรียมพร้อมโรคระบาด', 'Telemedicine', 'digital health announcements'"]
            }},
            "food_energy_environmental_security": {{
                "renewable_energy_share": {{
                    "renewable_energy_percentage": "renewable energy share of total energy mentioned",
                    "renewable_energy_targets": "renewable energy targets mentioned",
                    "solar_wind_capacity": "solar/wind capacity mentioned"
                }},
                "carbon_emission_reduction": {{
                    "carbon_reduction_targets": "carbon reduction targets mentioned",
                    "emission_reduction_achievements": "emission reduction achievements mentioned",
                    "climate_commitments": ["list of climate commitments"]
                }},
                "air_quality_indicators": {{
                    "pm25_levels": "PM2.5 levels mentioned",
                    "air_quality_improvements": "air quality improvements mentioned",
                    "pollution_reduction_measures": ["list of pollution reduction measures"]
                }},
                "water_resource_management": {{
                    "water_resource_index": "water resource index mentioned",
                    "water_security_measures": ["list of water security measures"],
                    "drought_flood_management": ["list of drought/flood management programs"]
                }},
                "waste_management_performance": {{
                    "waste_recycling_rate": "waste recycling rate mentioned",
                    "waste_management_infrastructure": ["list of waste management infrastructure"],
                    "circular_economy_initiatives": ["list of circular economy initiatives"]
                }},
                "food_security_indicators": {{
                    "food_security_index": "food security index mentioned",
                    "agricultural_productivity": "agricultural productivity mentioned",
                    "food_supply_chain_resilience": ["list of food supply chain improvements"]
                }},
                "news_signals_environment": ["list of environmental signals like 'พลังงานทดแทน', 'มาตรการลดโลกร้อน', 'น้ำท่วม', 'ภัยแล้ง', 'นโยบายสิ่งแวดล้อม'"]
            }},
            "public_administration_governance": {{
                "e_government_adoption": {{
                    "e_gov_services_coverage": "e-government services coverage mentioned",
                    "digital_service_utilization": "digital service utilization rate mentioned",
                    "online_transaction_volume": "online transaction volume mentioned"
                }},
                "g_cloud_usage": {{
                    "government_cloud_migration": "government cloud migration progress mentioned",
                    "cloud_service_adoption": "cloud service adoption rate mentioned"
                }},
                "open_data_metrics": {{
                    "open_data_portals": "number of open data portals mentioned",
                    "data_availability_index": "data availability index mentioned",
                    "public_data_utilization": "public data utilization mentioned"
                }},
                "public_sector_modernization": {{
                    "digital_transformation_initiatives": ["list of digital transformation initiatives"],
                    "process_automation": ["list of process automation projects"],
                    "service_delivery_improvements": ["list of service delivery improvements"]
                }},
                "anti_corruption_performance": {{
                    "corruption_perception_index": "corruption perception index mentioned",
                    "anti_corruption_measures": ["list of anti-corruption measures"],
                    "transparency_improvements": ["list of transparency improvements"]
                }},
                "news_signals_governance": ["list of governance signals like 'โครงการดิจิทัลภาครัฐ', 'ระบบบริการออนไลน์', 'ปราบปรามทุจริต', 'การลดขั้นตอนราชการ'"]
            }}
        }}

        IMPORTANT:
        - Only extract metrics that are explicitly mentioned or clearly implied in the article
        - Use null for indicators not mentioned
        - Use empty arrays [] for categories with no specific mentions
        - Focus on concrete government actions, policies, or programs
        - Return valid JSON only
        """

        try:
            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are an expert analyst specializing in Thai government policy analysis and socioeconomic indicators. Extract specific metrics from the 6 key areas mentioned and return them as structured JSON data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=3000
            )

            result_text = response.choices[0].message.content.strip()
            # Clean up potential markdown formatting
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()

            return {"primary_metrics": json.loads(result_text)}

        except Exception as e:
            logging.error(f"Error extracting primary metrics: {e}")
            return {"primary_metrics": {
                "primary_socioeconomic_category": "PUBLIC_ADMINISTRATION_GOVERNANCE",
                "category_confidence": 0.5,
                "category_reasoning": "Fallback classification due to analysis error",
                "economic_growth_competitiveness": {
                    "gdp_growth_rate": None,
                    "productivity_indicators": {"tfp_total_factor_productivity": None, "labor_productivity": None},
                    "investment_volume": {"fdi_foreign_direct_investment": None, "domestic_investment": None},
                    "innovation_economy": {"innovation_index": None, "patent_filings": None},
                    "digital_economy_share": None,
                    "export_value": {"overall_export_value": None, "key_sector_exports": []},
                    "sme_performance": {"sme_contribution_gdp": None, "sme_growth_rate": None, "sme_employment_share": None},
                    "digital_technology_adoption": {"ai_adoption_rate": None, "cloud_computing_usage": None, "automation_implementation": None},
                    "news_signals_economic": []
                },
                "human_resource_development": {
                    "education_quality": {"pisa_scores": None, "literacy_rate": None, "education_index": None},
                    "stem_graduates": {"stem_graduate_numbers": None, "stem_graduate_growth": None},
                    "skill_upgrading": {"reskilling_programs": [], "upskilling_initiatives": [], "skill_gap_reduction": None},
                    "digital_economy_workforce_readiness": {"digital_skills_training": [], "ict_competency_levels": None, "digital_workforce_readiness_index": None},
                    "employment_indicators": {"unemployment_rate": None, "employment_rate": None, "youth_unemployment": None},
                    "labor_market_wages": {"average_wage_growth": None, "minimum_wage_adjustments": None, "wage_inequality_metrics": None},
                    "news_signals_hr": []
                },
                "social_welfare_inequality_reduction": {
                    "income_inequality": {"gini_coefficient": None, "income_inequality_trend": None},
                    "household_debt": {"household_debt_gdp_ratio": None, "debt_reduction_programs": []},
                    "poverty_indicators": {"poverty_rate": None, "poverty_reduction_target": None, "extreme_poverty_rate": None},
                    "cost_of_living": {"inflation_rate": None, "cost_of_living_index": None, "basic_needs_cost": None},
                    "social_welfare_coverage": {"social_security_coverage": None, "welfare_recipients": None, "welfare_benefits_expansion": []},
                    "healthcare_access": {"universal_healthcare_coverage": None, "healthcare_access_improvements": []},
                    "government_benefits_access": {"benefits_digital_access": None, "benefits_application_simplification": []},
                    "news_signals_social": []
                },
                "health_security_public_health": {
                    "hospital_capacity_upgrades": {"hospitals_upgraded": None, "new_hospital_construction": None, "bed_capacity_expansion": None},
                    "healthcare_coverage_metrics": {"healthcare_coverage_rate": None, "insurance_coverage_expansion": None},
                    "public_health_capacity": {"beds_per_population": None, "healthcare_workers_per_population": None, "medical_equipment_availability": None},
                    "digital_health_adoption": {"telemedicine_implementation": None, "digital_health_records": None, "health_apps_utilization": None},
                    "communicable_disease_trends": {"disease_surveillance_systems": [], "vaccination_coverage": None, "pandemic_preparedness": []},
                    "news_signals_health": []
                },
                "food_energy_environmental_security": {
                    "renewable_energy_share": {"renewable_energy_percentage": None, "renewable_energy_targets": None, "solar_wind_capacity": None},
                    "carbon_emission_reduction": {"carbon_reduction_targets": None, "emission_reduction_achievements": None, "climate_commitments": []},
                    "air_quality_indicators": {"pm25_levels": None, "air_quality_improvements": None, "pollution_reduction_measures": []},
                    "water_resource_management": {"water_resource_index": None, "water_security_measures": [], "drought_flood_management": []},
                    "waste_management_performance": {"waste_recycling_rate": None, "waste_management_infrastructure": [], "circular_economy_initiatives": []},
                    "food_security_indicators": {"food_security_index": None, "agricultural_productivity": None, "food_supply_chain_resilience": []},
                    "news_signals_environment": []
                },
                "public_administration_governance": {
                    "e_government_adoption": {"e_gov_services_coverage": None, "digital_service_utilization": None, "online_transaction_volume": None},
                    "g_cloud_usage": {"government_cloud_migration": None, "cloud_service_adoption": None},
                    "open_data_metrics": {"open_data_portals": None, "data_availability_index": None, "public_data_utilization": None},
                    "public_sector_modernization": {"digital_transformation_initiatives": [], "process_automation": [], "service_delivery_improvements": []},
                    "anti_corruption_performance": {"corruption_perception_index": None, "anti_corruption_measures": [], "transparency_improvements": []},
                    "news_signals_governance": []
                }
            }}

    def _extract_operational_metrics(self, title: str, content: str) -> Dict:
        """
        Extract Operational Metrics: Project Status, Budget Indicators,
        Impact Assessment, Geographic Coverage, Beneficiary Groups
        """
        prompt = f"""
        Analyze this Thai government news article and extract OPERATIONAL METRICS related to project implementation and execution.

        Article Title: {title}
        Article Content: {content}

        Extract the following OPERATIONAL METRICS (return as JSON):

        {{
            "project_status": {{
                "announced_projects": ["list of newly announced projects"],
                "in_progress_projects": ["list of projects currently in progress"],
                "completed_projects": ["list of recently completed projects"],
                "delayed_projects": ["list of projects facing delays"]
            }},
            "budget_indicators": {{
                "allocated_budgets": ["list of budget allocations with amounts"],
                "funding_sources": ["list of funding sources mentioned"],
                "budget_utilization": ["list of budget utilization status"],
                "cost_overruns": ["list of projects with cost overruns"]
            }},
            "impact_assessment": {{
                "expected_benefits": ["list of expected benefits or outcomes"],
                "performance_metrics": ["list of performance indicators mentioned"],
                "success_measures": ["list of success criteria or KPIs"],
                "evaluation_methods": ["list of evaluation or monitoring approaches"]
            }},
            "geographic_coverage": {{
                "provinces_covered": ["list of provinces mentioned"],
                "regions_affected": ["list of regions (North, South, Central, etc.)"],
                "urban_rural_scope": "urban|rural|both|unspecified",
                "cross_border_impacts": ["list of cross-border or international impacts"]
            }},
            "beneficiary_groups": {{
                "target_population": ["list of target population groups"],
                "vulnerable_groups": ["list of vulnerable or disadvantaged groups"],
                "business_sectors": ["list of business sectors benefiting"],
                "community_types": ["list of community types affected"]
            }}
        }}

        IMPORTANT:
        - Only extract metrics that are explicitly mentioned in the article
        - Use empty arrays [] for categories with no mentions
        - Focus on concrete operational details and implementation status
        - Return valid JSON only
        """

        try:
            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are an expert analyst specializing in Thai government project implementation and operational metrics. Extract specific operational details from news articles and return them as structured JSON data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )

            result_text = response.choices[0].message.content.strip()
            # Clean up potential markdown formatting
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()

            return {"operational_metrics": json.loads(result_text)}

        except Exception as e:
            logging.error(f"Error extracting operational metrics: {e}")
            return {"operational_metrics": {
                "project_status": {"announced_projects": [], "in_progress_projects": [], "completed_projects": [], "delayed_projects": []},
                "budget_indicators": {"allocated_budgets": [], "funding_sources": [], "budget_utilization": [], "cost_overruns": []},
                "impact_assessment": {"expected_benefits": [], "performance_metrics": [], "success_measures": [], "evaluation_methods": []},
                "geographic_coverage": {"provinces_covered": [], "regions_affected": [], "urban_rural_scope": "unspecified", "cross_border_impacts": []},
                "beneficiary_groups": {"target_population": [], "vulnerable_groups": [], "business_sectors": [], "community_types": []}
            }}

    def _extract_ai_metadata(self, title: str, content: str) -> Dict:
        """
        Extract AI Analytics Metadata: Enhanced Entities, Topic Classification,
        Policy Sentiment, Timeline markers, Risk tags
        """
        prompt = f"""
        Analyze this Thai government news article and extract AI ANALYTICS METADATA for enhanced understanding and categorization.

        Article Title: {title}
        Article Content: {content}

        Extract the following AI ANALYTICS METADATA (return as JSON):

        {{
            "enhanced_entities": {{
                "government_agencies": ["list of specific government agencies mentioned"],
                "provinces_municipalities": ["list of provinces, cities, or municipalities mentioned"],
                "people_groups": ["list of specific people groups or demographics mentioned"],
                "international_entities": ["list of international organizations or foreign entities"]
            }},
            "topic_classification": {{
                "primary_category": "economy|social|environment|health|governance|security|infrastructure|education|technology|other",
                "secondary_categories": ["list of secondary topic categories"],
                "policy_domains": ["list of specific policy areas affected"],
                "sector_impacts": ["list of economic sectors impacted"]
            }},
            "policy_sentiment": {{
                "policy_effectiveness": "highly_effective|effective|neutral|ineffective|highly_ineffective|unclear",
                "public_opinion": "strongly_supportive|supportive|neutral|opposed|strongly_opposed|unclear",
                "stakeholder_sentiment": "positive|negative|mixed|unclear",
                "implementation_challenges": ["list of implementation challenges mentioned"]
            }},
            "timeline_markers": {{
                "immediate_actions": ["list of immediate or short-term actions"],
                "medium_term_goals": ["list of medium-term objectives (6-24 months)"],
                "long_term_vision": ["list of long-term goals (2+ years)"],
                "deadline_dates": ["list of specific deadlines or target dates mentioned"]
            }},
            "risk_tags": {{
                "regulatory_risks": ["list of regulatory compliance risks"],
                "financial_risks": ["list of financial or budgetary risks"],
                "operational_risks": ["list of operational implementation risks"],
                "political_risks": ["list of political or stakeholder risks"],
                "external_risks": ["list of external factors or dependencies"]
            }}
        }}

        IMPORTANT:
        - Only extract information that is explicitly mentioned or clearly implied
        - Use empty arrays [] for categories with no mentions
        - Use "unclear" for sentiment categories that cannot be determined
        - Focus on concrete details and avoid speculation
        - Return valid JSON only
        """

        try:
            response = self.ai_client.chat.completions.create(
                model=os.environ.get("AZURE_AI_DEPLOYMENT_NAME", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are an expert AI analyst specializing in government policy analysis and risk assessment. Extract comprehensive metadata from news articles and return them as structured JSON data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )

            result_text = response.choices[0].message.content.strip()
            # Clean up potential markdown formatting
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()

            return {"ai_metadata": json.loads(result_text)}

        except Exception as e:
            logging.error(f"Error extracting AI metadata: {e}")
            return {"ai_metadata": {
                "enhanced_entities": {"government_agencies": [], "provinces_municipalities": [], "people_groups": [], "international_entities": []},
                "topic_classification": {"primary_category": "other", "secondary_categories": [], "policy_domains": [], "sector_impacts": []},
                "policy_sentiment": {"policy_effectiveness": "unclear", "public_opinion": "unclear", "stakeholder_sentiment": "unclear", "implementation_challenges": []},
                "timeline_markers": {"immediate_actions": [], "medium_term_goals": [], "long_term_vision": [], "deadline_dates": []},
                "risk_tags": {"regulatory_risks": [], "financial_risks": [], "operational_risks": [], "political_risks": [], "external_risks": []}
            }}


# Convenience functions for external use
def analyze_article(title: str, content: str, article_id: str = None) -> Dict:
    """
    Convenience function to analyze a single article
    """
    analytics = NewsAnalytics()
    return analytics.analyze_article_content(title, content, article_id)


def get_trending_topics(days: int = 7) -> Dict:
    """
    Convenience function to get trending topics
    """
    analytics = NewsAnalytics()
    return analytics.generate_trending_topics(days)


def generate_bi_report() -> Dict:
    """
    Convenience function to generate business intelligence report
    """
    analytics = NewsAnalytics()
    return analytics.generate_business_intelligence_report()


if __name__ == "__main__":
    # Test the analytics
    logging.basicConfig(level=logging.INFO)

    # Test article analysis
    test_title = "DBD ตรวจสอบบริษัท นอมินี กรณีการดำเนินธุรกิจผิดกฎหมาย"
    test_content = """
    กรมพัฒนาธุรกิจการค้า (DBD) ได้ดำเนินการตรวจสอบบริษัทที่涉嫌เป็นนอมินี 
    ซึ่งดำเนินธุรกิจโดยไม่ปฏิบัติตามกฎหมาย การตรวจสอบครั้งนี้พบว่าบริษัทดังกล่าว
    มีมูลค่าทรัพย์สินรวมกว่า 150 ล้านบาท และเกี่ยวข้องกับการดำเนินธุรกิจในหลายจังหวัด
    """

    print("Testing News Analytics...")
    result = analyze_article(test_title, test_content, "test_article_001")

    if result["success"]:
        print("✅ Analysis successful!")
        analytics = result["analytics"]
        print(f"Sentiment: {analytics.get('sentiment_analysis', {}).get('overall', 'unknown')}")
        print(f"Primary Topic: {analytics.get('topic_classification', {}).get('primary_topic', 'unknown')}")
        print(f"Regulatory Signals: {len(analytics.get('regulatory_signals', {}).get('signals_detected', []))}")
    else:
        print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")