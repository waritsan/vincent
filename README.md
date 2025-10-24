
# Vincent: AI-Powered News, Chat, and Admin Platform

Vincent is a multi-service platform for news aggregation, AI chat, and content management, built with Azure Functions (Python), Next.js (frontend), and Cosmos DB. It features:

- **Automated news aggregation** from official sources (e.g., DBD)
- **AI-powered chat** with Azure OpenAI integration
- **Admin dashboard** for managing posts and triggering news fetches
- **Manual and auto-fetched post support**
- **Full-text search, tagging, and analytics**
- **Modern frontend** (Next.js/React)

---


## 🛠️ Main Features

- **Automated News Fetching**: Scheduled and manual fetch from DBD and other sources, with duplicate detection and tagging
- **AI Chat API**: `/api/chat` endpoint for OpenAI-powered conversations
- **Posts API**: `/api/posts` for listing and creating posts (manual or auto-fetched)
- **Admin Tools**: Admin dashboard for post management, news fetch, and analytics
- **Health Check**: `/api/health` endpoint
- **Full Documentation**: See [`docs/`](./docs/) for guides on setup, deployment, and features

---


## 🚀 Quickstart


1. **Clone the repo**
2. **Backend setup**:
    - `cd src/api`
    - `python -m venv .venv && source .venv/bin/activate`
    - `pip install -r requirements.txt`
    - Configure `local.settings.json` (see [docs/AUTOMATED_NEWS_SETUP.md](./docs/AUTOMATED_NEWS_SETUP.md))
    - `func start` (API at `http://localhost:7071/api/`)
3. **Frontend setup**:
    - `cd src/web`
    - `npm install && npm run dev` (Frontend at `http://localhost:3000/`)
4. **Docs**: See [`docs/`](./docs/) for full guides

---


## ☁️ Deployment

Deploy to Azure with Azure Developer CLI:

```bash
azd up
```

---


## 🧑‍💻 Tech Stack

- **Backend**: Azure Functions (Python 3.9+), Cosmos DB
- **Frontend**: Next.js (React, TypeScript)
- **AI**: Azure OpenAI (Foundry)
- **Infra as Code**: Bicep, Azure CLI

---


## 📚 Documentation

See [`docs/`](./docs/) for:
- **Documentation Index**: [docs/INDEX.md](./docs/INDEX.md)
- **Automated News Setup**: [docs/AUTOMATED_NEWS_SETUP.md](./docs/AUTOMATED_NEWS_SETUP.md)
- **Testing Guide**: [docs/TESTING.md](./docs/TESTING.md)
- **Feature guides**: CRUD, search, migration, performance, and more

---


## 📝 Next Steps

1. Configure Azure AI/OpenAI connection
2. Set up automated news fetching ([docs/AUTOMATED_NEWS_SETUP.md](./docs/AUTOMATED_NEWS_SETUP.md))
3. Run the frontend and admin dashboard
4. Explore all features in the [docs/](./docs/) folder
5. Add new features or integrations as needed
