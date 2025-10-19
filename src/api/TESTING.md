# API Testing Guide

## Running Tests

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run All Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=. --cov-report=html --cov-report=term-missing
```

### Run Specific Test Files
```bash
pytest tests/test_health.py
pytest tests/test_chat.py
pytest tests/test_posts.py
pytest tests/test_agent.py
pytest tests/test_utils.py
pytest tests/test_integration.py
```

### Run by Markers
```bash
pytest -m unit          # Run only unit tests
pytest -m integration   # Run only integration tests
pytest -m "not slow"    # Skip slow tests
```

### Verbose Output
```bash
pytest -v              # Verbose test names
pytest -vv             # Extra verbose with full diff
pytest -s              # Show print statements
```

## Test Structure

### Unit Tests
- `test_health.py` - Health endpoint tests
- `test_chat.py` - Chat endpoint tests
- `test_posts.py` - Posts CRUD tests
- `test_agent.py` - Agent creation tests
- `test_utils.py` - Utility function tests

### Integration Tests
- `test_integration.py` - Cross-component flow tests

## Test Coverage

The test suite covers:
- ✅ All API endpoints (/health, /chat, /chat/history, /agent/create, /posts)
- ✅ Request validation
- ✅ Response structure validation
- ✅ Error handling
- ✅ CORS headers
- ✅ Utility functions
- ✅ Cross-component workflows

## Mocking

Tests use `unittest.mock` to mock:
- Azure AI Projects client
- Cosmos DB client
- Environment variables
- Agent availability

This allows tests to run without actual Azure resources.

## CI/CD Integration

Add to your CI/CD pipeline:
```yaml
- name: Install dependencies
  run: pip install -r requirements.txt

- name: Run tests
  run: pytest --cov=. --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Common Issues

### Import Errors
If you see import errors, make sure you're running pytest from the `/src/api` directory:
```bash
cd src/api
pytest
```

### Missing Dependencies
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Environment Variables
Tests mock environment variables, so you don't need a `.env` file for testing.

## Writing New Tests

1. Create a new file `test_<feature>.py` in the `tests/` directory
2. Import pytest and necessary mocks
3. Create a test class with descriptive name
4. Write test methods starting with `test_`
5. Use assertions to validate behavior

Example:
```python
import pytest
from unittest.mock import patch, MagicMock

class TestNewFeature:
    def test_feature_works(self):
        result = my_function()
        assert result == expected_value
```
