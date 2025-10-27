#!/usr/bin/env python3
"""
Test script for text extraction functionality
"""
import sys
import os
import json

# Add the current directory to Python path so we can import text_extraction
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from text_extraction import extract_companies_and_locations, extract_from_file


def test_extract_companies_and_locations():
    """Test the main extraction function with sample text"""
    print("🧪 Testing extract_companies_and_locations function...")

    # Sample text with companies and locations
    sample_text = """
    Apple Inc. is headquartered in Cupertino, California. The company was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976.
    Microsoft Corporation, based in Redmond, Washington, announced a new partnership with Google LLC from Mountain View, California.
    Tesla Motors, founded by Elon Musk, has factories in Fremont, California and Austin, Texas.
    Amazon Web Services (AWS) is expanding its data centers in Northern Virginia.
    """

    result = extract_companies_and_locations(sample_text)

    print(f"✅ Success: {result['success']}")
    print(f"📊 Total companies found: {result['total_companies']}")
    print(f"📝 Text length: {result['text_length']} characters")

    if result['success'] and result['companies']:
        print("\n🏢 Extracted companies:")
        for company in result['companies']:
            location = company['location'] or "Location not specified"
            print(f"  - {company['name']} ({location})")
    else:
        print(f"❌ Error: {result.get('error', 'Unknown error')}")

    print("\n" + "="*50 + "\n")


def test_empty_text():
    """Test with empty text"""
    print("🧪 Testing with empty text...")

    result = extract_companies_and_locations("")

    print(f"✅ Success: {result['success']}")
    print(f"❌ Error: {result.get('error', 'No error')}")

    print("\n" + "="*50 + "\n")


def test_extract_from_file():
    """Test extracting from a file (if it exists)"""
    print("🧪 Testing extract_from_file function...")

    # Try to read from a sample file if it exists
    test_file_path = "/Users/waritsan/Developer/text-extraction/doc/dbd-article.txt"

    if os.path.exists(test_file_path):
        result = extract_from_file(test_file_path)
        print(f"✅ Success: {result['success']}")
        print(f"📊 Total companies found: {result['total_companies']}")

        if result['success'] and result['companies']:
            print("\n🏢 Extracted companies from file:")
            for company in result['companies']:
                location = company['location'] or "Location not specified"
                print(f"  - {company['name']} ({location})")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
    else:
        print(f"⚠️  Test file not found: {test_file_path}")
        print("   Skipping file extraction test")

    print("\n" + "="*50 + "\n")


def test_api_endpoint():
    """Test the API endpoint if the function app is running"""
    print("🧪 Testing API endpoint...")

    try:
        import requests

        # Test the API endpoint
        api_url = "http://localhost:7071/api/extract/entities"
        test_payload = {
            "text": "Apple Inc. is based in Cupertino, California, while Microsoft Corporation operates from Redmond, Washington."
        }

        print(f"📡 Making POST request to: {api_url}")
        response = requests.post(api_url, json=test_payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ API call successful")
            print(f"📊 Total companies found: {result.get('total_companies', 0)}")

            if result.get('companies'):
                print("\n🏢 Extracted companies via API:")
                for company in result['companies']:
                    location = company['location'] or "Location not specified"
                    print(f"  - {company['name']} ({location})")
        else:
            print(f"❌ API call failed with status: {response.status_code}")
            print(f"Response: {response.text}")

    except ImportError:
        print("⚠️  requests library not available, skipping API test")
    except Exception as e:
        print(f"❌ API test error: {e}")

    print("\n" + "="*50 + "\n")


if __name__ == "__main__":
    print("🚀 Starting text extraction tests...\n")

    # Run all tests
    test_extract_companies_and_locations()
    test_empty_text()
    test_extract_from_file()
    test_api_endpoint()

    print("🎉 All tests completed!")