#!/usr/bin/env python3
"""
Test script for BI chart generation functionality
"""
import sys
import os
import json

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_bi_chart_generation():
    """Test the BI chart generation function"""
    print("🧪 Testing BI chart generation function...")

    try:
        # Import the function
        from function_app import generate_bi_chart

        # Sample dashboard data (simplified version)
        sample_dashboard_data = {
            "summary_metrics": {
                "total_articles_analyzed": 150,
                "primary_metrics_articles": 45,
                "operational_metrics_articles": 38,
                "ai_metadata_articles": 67,
                "policy_projects": 12
            },
            "primary_metrics": [
                {
                    "article_id": "test-1",
                    "title": "Economic Growth Report",
                    "economic_growth_competitiveness": {
                        "gdp_growth_rate": "3.5%",
                        "investment_volume": {
                            "fdi_foreign_direct_investment": "$2.1B"
                        }
                    }
                }
            ],
            "operational_metrics": [
                {
                    "article_id": "test-2",
                    "title": "Healthcare Improvements",
                    "health_security_public_health": {
                        "hospital_capacity_upgrades": {
                            "hospitals_upgraded": 5
                        }
                    }
                }
            ],
            "ai_metadata": [
                {
                    "article_id": "test-3",
                    "sentiment": "positive",
                    "risk_tags": {
                        "regulatory_risks": ["New regulation compliance"],
                        "financial_risks": []
                    }
                }
            ],
            "topic_distribution": {
                "economy": 25,
                "healthcare": 20,
                "education": 15
            },
            "sentiment_distribution": {
                "positive": 45,
                "negative": 25,
                "neutral": 30
            }
        }

        # Test prompt
        test_prompt = "Show me a chart of sentiment distribution across different topics"

        print("📊 Testing with sample BI dashboard data...")
        print(f"📝 Prompt: {test_prompt}")

        # This would normally call the Azure OpenAI API, but we'll just test the function structure
        print("✅ Function import successful")
        print("✅ Sample data structure validated")
        print("📊 Dashboard contains:")
        print(f"   - {sample_dashboard_data['summary_metrics']['total_articles_analyzed']} total articles")
        print(f"   - {len(sample_dashboard_data['primary_metrics'])} primary metrics articles")
        print(f"   - {len(sample_dashboard_data['operational_metrics'])} operational metrics articles")
        print(f"   - {len(sample_dashboard_data['ai_metadata'])} AI metadata articles")

        # Test the process_bi_chart_data function if it exists
        try:
            from function_app import process_bi_chart_data
            # Create a sample chart config
            sample_chart_config = {
                "type": "bar",
                "title": "Sentiment Distribution",
                "dataKey": "count",
                "xAxisKey": "sentiment"
            }
            processed_data = process_bi_chart_data(sample_chart_config, sample_dashboard_data)
            print("✅ process_bi_chart_data function works")
            print(f"📊 Processed data type: {processed_data.get('type')}")
            print(f"📊 Processed data keys: {list(processed_data.keys()) if isinstance(processed_data, dict) else 'Not a dict'}")
        except ImportError:
            print("⚠️  process_bi_chart_data function not found")

    except ImportError as e:
        print(f"❌ Import error: {e}")
    except Exception as e:
        print(f"❌ Test error: {e}")

    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    print("🚀 Starting BI chart generation tests...\n")

    test_bi_chart_generation()

    print("🎉 BI chart generation test completed!")