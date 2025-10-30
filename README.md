<img width="1024" height="1024" alt="logo 2" src="https://github.com/user-attachments/assets/57c65417-0265-419d-a3ad-0be406b714a0" />

# DissGame.click

**Hall of Shame for Bad Games** — Vote, roast, and bury the worst games of all time. No corporate BS, just raw opinions from real players.

## Tech Stack

- **Framework**: Next.js 15 (App Router, SSR/ISR)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + styled-components
- **Animations**: Framer Motion
- **Data Fetching**: SWR

## Features

- 🎮 **Top Disliked Games** — Vote and track the most hated games
- ⚰️ **Gaming Graveyard** — Memorial for dead/abandoned games
- ⭐ **Detailed Rating System** — Rate games across 5 categories
- 📊 **Trend Analysis** — Google Trends integration for game popularity
- 🔄 **Real-time Updates** — SWR polling with optimistic updates
- 🎨 **Dynamic Animations** — Smooth number transitions and interactive effects

Required environment variables:

- **Clerk**: Sign up at [clerk.com](https://clerk.com) for authentication
- **Supabase**: Create a project at [supabase.com](https://supabase.com) for database
- **IGDB API**: Get credentials from [IGDB API Docs](https://api-docs.igdb.com/#account-creation)

Optional:

- **Discord Webhook**: For feedback notifications
- **Sentry**: For error tracking

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
npm run test       # Run tests in watch mode
npm run test:run   # Run tests once
npm run test:coverage  # Run tests with coverage report
```

## Database Setup

This project uses Supabase as the database. You'll need to set up the following tables:

1. **games** - Main games table with metadata from IGDB
2. **dead_games** - Table for shutdown/abandoned games
3. **user_reactions** - User dislikes and reactions
4. **game_ratings** - 5-category rating system

See the [Supabase documentation](https://supabase.com/docs) for table schema setup.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
