# Lead Scraper User Interface

Modern, premium web interface for ADW LeadMatrix lead scraping system.

## Features

- **Natural Language Queries** - Describe what you need in plain English
- **Real-Time Progress** - Watch leads being collected with live updates via WebSocket
- **Campaign Management** - Organize and track multiple scraping campaigns
- **Lead Enrichment** - Automatically enrich leads with emails, tech stack, and SEO data
- **Analytics Dashboard** - View performance metrics and insights
- **Export & Download** - Download results as CSV files

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **SWR** - Data fetching and caching
- **Recharts** - Data visualization
- **FastAPI Backend** - Python API for scraper integration

## Design System

The UI follows a modern DTC wellness aesthetic:

- **Colors**: Near-black text on white, soft grays, accent green (#59c43b)
- **Typography**: DM Sans font with wide tracking for labels
- **Layout**: Grid-first, card-based design with rounded corners (10px)
- **Animations**: Entrance animations, hover effects, and micro-interactions
- **Navigation**: Sticky black header/footer with slide-out drawer menu

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+ (for backend API)
- Running FastAPI backend (see `ADW-LeadMatrix/api/`)

### Installation

```bash
cd lead-scraper-user-interface
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Backend Setup

The frontend requires the FastAPI backend to be running. See `ADW-LeadMatrix/api/README.md` for backend setup instructions.

### Start Backend API

```bash
cd ADW-LeadMatrix/api
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Project Structure

```
lead-scraper-user-interface/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Homepage
│   │   ├── dashboard/         # Dashboard page
│   │   ├── campaigns/         # Campaign pages
│   │   ├── scrape/            # Scrape pages
│   │   ├── analytics/         # Analytics page
│   │   └── settings/          # Settings page
│   ├── components/
│   │   ├── layout/            # Header, Footer, Drawer, Layout
│   │   ├── ui/                # Button, Card, Input, Badge
│   │   └── scraping/          # JobCard, ProgressBar, LeadsTable
│   └── lib/
│       └── api.ts             # API client functions
└── public/
    └── logo/                  # Logo files
```

## Pages

- **Homepage** (`/`) - Hero section with quick start form
- **Dashboard** (`/dashboard`) - Overview of all jobs and campaigns
- **New Scrape** (`/scrape/new`) - Configure and start a new scraping job
- **Scrape Detail** (`/scrape/[id]`) - View job progress and results
- **Campaigns** (`/campaigns`) - List all campaigns
- **Campaign Detail** (`/campaigns/[id]`) - View campaign details and leads
- **Analytics** (`/analytics`) - Performance metrics and charts
- **Settings** (`/settings`) - Configure scraping preferences

## API Integration

The frontend communicates with the FastAPI backend via:

- **REST API** - For job management and data fetching
- **WebSocket** - For real-time progress updates

See `src/lib/api.ts` for API client implementation.

## Development Notes

- Uses SWR for data fetching with automatic caching and revalidation
- WebSocket connections are managed per job for real-time updates
- All animations use CSS classes defined in `globals.css`
- Components follow the design system with consistent styling
- TypeScript types are defined in `src/lib/api.ts`

## License

MIT
