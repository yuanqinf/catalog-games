# DissGame.click

**Hall of Shame for Bad Games** — Vote, roast, and bury the worst games of all time. No corporate BS, just raw opinions from real players.

## Tech Stack

- **Framework**: Next.js 15 (App Router, SSR/ISR)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + styled-components
- **Animations**: Framer Motion
- **Data Fetching**: SWR
- **Internationalization**: i18next

## Features

- 🎮 **Top Disliked Games** — Vote and track the most hated games
- ⚰️ **Gaming Graveyard** — Memorial for dead/abandoned games
- ⭐ **Detailed Rating System** — Rate games across 5 categories (story, music, graphics, gameplay, longevity)
- 📊 **Trend Analysis** — Google Trends integration for game popularity
- 🌐 **Multi-language Support** — i18n ready
- 🔄 **Real-time Updates** — SWR polling with optimistic updates
- 🎨 **Dynamic Animations** — Smooth number transitions and interactive effects

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account
- Clerk account

### Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# IGDB API (for game metadata)
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── (root)/              # Main pages (home, detail, explore)
│   ├── admin/               # Admin dashboard
│   └── api/                 # API routes
├── components/              # React components
│   ├── pages/               # Page-specific components
│   └── shared/              # Reusable components
├── lib/                     # Utilities and services
│   ├── supabase/           # Supabase client/server services
│   └── i18n/               # Internationalization
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript types
└── constants/              # App constants
```

## Key Features Implementation

### ISR (Incremental Static Regeneration)
Pages use `export const revalidate = 60` for automatic cache revalidation.

### Optimistic Updates
User interactions update instantly with SWR optimistic updates, syncing with server data in the background.

### Smart Caching
Implements conflict resolution to prevent stale data from overwriting fresh optimistic updates.

## Scripts

```bash
npm run dev        # Start development server (Turbopack)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run prettier   # Format code
```

## License

Private project
