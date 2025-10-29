"""
Tests for chart filtering utilities
"""
import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from function_app import apply_filters, _company_matches_valuation_filter, _company_matches_date_filter


class TestChartFilters:
    """Test cases for chart filtering functions"""

    def test_apply_filters_no_filters(self):
        """Test apply_filters with no filters"""
        companies = [
            {"company_name": "Company A", "asset_valuation": "100 million baht"},
            {"company_name": "Company B", "asset_valuation": "200 million baht"}
        ]

        result = apply_filters(companies, {})
        assert len(result) == 2
        assert result == companies

    def test_apply_filters_location_filter(self):
        """Test apply_filters with location filter"""
        companies = [
            {"company_name": "Company A", "location": "Bangkok", "asset_valuation": "100 million baht"},
            {"company_name": "Company B", "location": "Chiang Mai", "asset_valuation": "200 million baht"},
            {"company_name": "Company C", "location": "Bangkok", "asset_valuation": "150 million baht"}
        ]

        filters = {"location": ["Bangkok"]}
        result = apply_filters(companies, filters)

        assert len(result) == 2
        assert all(company["location"] == "Bangkok" for company in result)

    def test_apply_filters_valuation_filter(self):
        """Test apply_filters with valuation filter"""
        companies = [
            {"company_name": "Company A", "asset_valuation": "50 million baht"},
            {"company_name": "Company B", "asset_valuation": "150 million baht"},
            {"company_name": "Company C", "asset_valuation": "250 million baht"}
        ]

        filters = {"valuation_min": 100, "valuation_max": 200}
        result = apply_filters(companies, filters)

        assert len(result) == 1
        assert result[0]["company_name"] == "Company B"

    def test_apply_filters_date_filter(self):
        """Test apply_filters with date filter"""
        companies = [
            {"company_name": "Company A", "created_at": "2025-01-01T00:00:00Z"},
            {"company_name": "Company B", "created_at": "2025-06-01T00:00:00Z"},
            {"company_name": "Company C", "created_at": "2025-12-01T00:00:00Z"}
        ]

        filters = {"date_from": "2025-03-01", "date_to": "2025-09-01"}
        result = apply_filters(companies, filters)

        assert len(result) == 1
        assert result[0]["company_name"] == "Company B"

    def test_company_matches_valuation_filter(self):
        """Test _company_matches_valuation_filter function"""
        company = {"asset_valuation": "150 million baht"}

        assert _company_matches_valuation_filter(company, 100, 200) is True
        assert _company_matches_valuation_filter(company, 200, 300) is False
        assert _company_matches_valuation_filter(company, 50, 100) is False

    def test_company_matches_date_filter(self):
        """Test _company_matches_date_filter function"""
        company = {"created_at": "2025-06-15T00:00:00Z"}

        assert _company_matches_date_filter(company, "2025-06-01", "2025-06-30") is True
        assert _company_matches_date_filter(company, "2025-07-01", "2025-07-31") is False
        assert _company_matches_date_filter(company, "2025-01-01", "2025-05-31") is False

    def test_company_matches_date_filter_invalid_date(self):
        """Test _company_matches_date_filter with invalid date format"""
        company = {"created_at": "invalid-date-format"}

        result = _company_matches_date_filter(company, "2025-10-26", "2025-10-27")
        assert result is False