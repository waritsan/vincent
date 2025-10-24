# API Documentation Index

This directory contains comprehensive documentation for the Azure Functions API.

## 📚 Documentation Files

### [AUTOMATED_NEWS_SETUP.md](./AUTOMATED_NEWS_SETUP.md)
Complete guide for the automated DBD news fetching system:
- 🎯 Features and components
- 🚀 Quick start guide (local & Azure deployment)
- ⚙️ Configuration (schedules, limits, keywords)
- 📊 Monitoring and statistics
- 🔧 Troubleshooting
- 📱 Frontend integration
- 🎉 Best practices and workflow

**Use this when**: Setting up or configuring automated news fetching

---

### [TESTING.md](./TESTING.md)
Complete testing guide for the API:
- Running tests (all, specific, with coverage)
- Test structure (unit vs integration)
- Test coverage details
- Mocking strategies
- CI/CD integration
- Common issues and solutions
- Writing new tests

**Use this when**: Running tests or adding new test coverage

---

## 🚀 Quick Links

### Getting Started
1. Read main [README.md](../README.md) for API overview
2. Follow [AUTOMATED_NEWS_SETUP.md](./AUTOMATED_NEWS_SETUP.md) for news automation
3. Use [TESTING.md](./TESTING.md) to run tests

### Common Tasks

**Setting up automated news**:
→ [AUTOMATED_NEWS_SETUP.md § Quick Start](./AUTOMATED_NEWS_SETUP.md#-quick-start)

**Running tests**:
→ [TESTING.md § Running Tests](./TESTING.md#running-tests)

**Changing fetch schedule**:
→ [AUTOMATED_NEWS_SETUP.md § Configuration](./AUTOMATED_NEWS_SETUP.md#-configuration)

**Monitoring fetches**:
→ [AUTOMATED_NEWS_SETUP.md § Monitoring](./AUTOMATED_NEWS_SETUP.md#-monitoring)

**Troubleshooting**:
→ [AUTOMATED_NEWS_SETUP.md § Troubleshooting](./AUTOMATED_NEWS_SETUP.md#-troubleshooting)

---

## 📖 Documentation Structure

```
src/api/
├── README.md                          # Main API overview & setup
└── docs/
    ├── INDEX.md                       # This file - documentation index
    ├── AUTOMATED_NEWS_SETUP.md        # Automated news fetching guide
    └── TESTING.md                     # Testing guide
```

---

## 🔄 Keeping Documentation Updated

When adding new features, please update:
1. Main [README.md](../README.md) - Add endpoint documentation
2. Create new detailed guide in `docs/` if needed
3. Update this INDEX.md with links to new documentation
4. Update [TESTING.md](./TESTING.md) if adding tests

---

## 📞 Need Help?

1. Check the relevant documentation file above
2. Look at code examples in the docs
3. Review troubleshooting sections
4. Check function comments in source code

---

**Last Updated**: January 2025
