#!/usr/bin/env python3
"""
Test script to verify companies database and container creation
"""
import os
import sys
import json
from datetime import datetime, timezone
from text_extraction import get_companies_container, extract_companies_and_locations

def load_local_settings():
    """Load environment variables from local.settings.json"""
    settings_file = os.path.join(os.path.dirname(__file__), 'local.settings.json')
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            settings = json.load(f)
            values = settings.get('Values', {})
            for key, value in values.items():
                if value and not os.getenv(key):  # Only set if not already set
                    os.environ[key] = value
        print("✅ Loaded local.settings.json")
    else:
        print("⚠️  local.settings.json not found")

def test_companies_database():
    """Test companies database creation and basic operations"""

    print("🔍 Testing Companies Database connection...")

    try:
        # Load settings first
        load_local_settings()

        # Test container creation
        print("📦 Getting companies container...")
        container = get_companies_container()

        if not container:
            print("❌ Failed to get companies container")
            print("   Make sure AZURE_COSMOS_CONNECTION_STRING or AZURE_COSMOS_ENDPOINT is set")
            return False

        print("✅ Companies container obtained successfully")

        # Test extraction and saving
        print("\n🤖 Testing entity extraction and saving...")

        test_text = """
        บริษัท ABC จำกัด เป็นบริษัทที่ตั้งอยู่ในกรุงเทพฯ มีมูลค่า 500 ล้านบาท
        และบริษัท XYZ Co., Ltd. ในเชียงใหม่ มูลค่า 200 ล้านบาท
        """

        result = extract_companies_and_locations(test_text)

        if result["success"]:
            print(f"✅ Extraction successful: {result['total_companies']} companies found")

            # The extraction function now saves individual company documents
            print("💾 Companies should be saved as individual documents to CosmosDB...")

            # Verify retrieval - query for companies from this extraction
            print("🔍 Verifying data retrieval...")
            # Query for companies created recently (within last minute)
            import time
            time_threshold = datetime.now(timezone.utc).timestamp() - 60  # 1 minute ago
            
            query = f"SELECT * FROM c WHERE c.created_at >= '{datetime.fromtimestamp(time_threshold, timezone.utc).isoformat()}'"
            items = list(container.query_items(query, enable_cross_partition_query=True))

            if items:
                print(f"✅ Data retrieved successfully: {len(items)} company documents found")
                print("   Retrieved companies:")
                for company_doc in items:
                    print(f"   - {company_doc['company_name']} ({company_doc['location']}) - Value: {company_doc.get('asset_valuation', 'N/A')}")
                return True
            else:
                print("❌ Failed to retrieve saved company data")
                return False

        else:
            print(f"❌ Extraction failed: {result['error']}")
            return False

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_companies_database()
    sys.exit(0 if success else 1)