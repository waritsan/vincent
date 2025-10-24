# Vincent's Blog - Frontend

A Next.js static web application that displays blog posts from Azure Functions API.

## Features

- 📱 Responsive blog post grid layout
- 🎨 Modern UI with Tailwind CSS
- ⚡ Client-side data fetching from Azure Functions
- 🌙 Dark mode support
- 🔄 Refresh button to reload posts

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

Create a `.env.local` file in the `src/web` directory:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and set your Function App URL:

```env
NEXT_PUBLIC_API_URL=https://func-ja67jva7pfqfc.azurewebsites.net
```

You can get this URL by running:

```bash
azd env get-values | grep AZURE_FUNCTION_URI
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the blog.

## Deployment

The app is automatically deployed to Azure Static Web Apps when you run:

```bash
azd up
```

The deployment uses static export mode, so all pages are pre-rendered at build time.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Azure Functions API endpoint | `https://func-xxx.azurewebsites.net` |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## API Integration

The app connects to these API endpoints:

- `GET /api/posts` - Fetch all blog posts
- `POST /api/posts` - Create a new post (future feature)
- `POST /api/chat` - AI chat endpoint (future feature)

## Project Structure

```
src/web/
├── src/
│   └── app/
│       ├── components/
│       │   └── BlogPosts.tsx    # Blog posts component
│       ├── page.tsx              # Home page
│       ├── layout.tsx            # Root layout
│       └── globals.css           # Global styles
├── public/                       # Static assets
├── next.config.ts                # Next.js configuration
└── package.json
```

## Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Azure Static Web Apps** - Hosting platform

## Development Notes

- Uses `output: 'export'` for static generation
- Images are unoptimized for static hosting
- Client-side rendering for dynamic API data
- Trailing slashes enabled for Azure Static Web Apps compatibility
