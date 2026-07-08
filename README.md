# Music App

A full-featured music streaming web application built with React, TypeScript, and Vite. Supports role-based access for listeners, artists, support staff, and admins.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Test Accounts

| Email | Password | Role |
|---|---|---|
| mahyar@example.com | Password123! | Listener (free) |
| ali@example.com | Password123! | Artist (silver) |
| hasan@example.com | Password123! | Admin (gold) |
| parsa@example.com | Password123! | Support (free) |

## Features

### Listener
- Browse home page with recently played, new albums, popular songs, early access
- Search and filter albums and singles
- Create, rename, delete playlists with plan-based limits
- Follow/unfollow artists
- View artist profiles with albums, singles, and verified badge
- Edit profile with avatar upload (silver+)
- Notification center with mark-as-read and delete
- Subscription management with plan upgrades

### Music Player
- Fixed bottom player bar on desktop
- Compact mini-player on mobile
- Full-screen overlay with lyrics and queue tabs
- Seekable progress bar with time display
- Volume slider with mute toggle
- Play/pause, next/previous, shuffle, repeat (off/all/one)
- Queue management with reorder and remove
- Keyboard shortcuts (Space, Arrow keys, M)
- Artist and album links in player
- Gold-only stream/listener statistics
- Free-plan daily stream limit (60/day)

### Artist Dashboard (artist role)
- Create and publish singles and albums
- Upload mock audio with duration parsing
- Cover art color picker
- Add genre, release year, collaborators, lyrics
- Edit and delete works
- Stats: total streams, listeners, revenue, published works

### Admin/Support Dashboard (admin + support roles)
- Artist verification requests with approve/reject
- Support ticket system with chat-like UI
- Monthly audit and payment management
- Subscription price management (admin only)
- Revenue overview with tier breakdown (admin only)

### Notifications
- Subscription expiry alerts
- New releases from followed artists
- Artist application status updates
- Support ticket updates
- Mark as read, mark all as read, delete

## Architecture

```
main.tsx
  └─→ ErrorBoundary
       └─→ App.tsx
            ├─→ AuthContext, PlayerContext
            ├─→ Routes (17 pages)
            └─→ AppLayout (TopNav + Sidebar + Player)
```

### Layer Rules
- Pages import from hooks/services only (no direct storage)
- Services wrap storage with business logic
- Hooks provide React integration for contexts
- Components are presentational or use hooks

### Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard components
│   ├── albums/         # Album browsing components
│   ├── artist/         # Artist profile components
│   ├── artist-dashboard/ # Artist work management
│   ├── auth/           # Login/register forms
│   ├── error/          # ErrorBoundary, ErrorFallback
│   ├── home/           # Home page sections
│   ├── layout/         # AppLayout, TopNav, Sidebar
│   ├── notifications/  # Notification components
│   ├── player/         # Player bar, overlay, controls
│   ├── playlists/      # Playlist components
│   ├── profile/        # Profile components
│   ├── routing/        # ProtectedRoute, GuestOnlyRoute
│   ├── settings/       # Settings components
│   ├── subscription/   # Plan and upgrade components
│   └── ui/             # Button, Input, Modal, RoleGuard
├── lib/
│   ├── constants/      # Routes, plans, roles
│   ├── context/        # AuthContext, PlayerContext
│   ├── hooks/          # useAuth, usePlayer, useSubscriptionLimits
│   ├── mockData/       # Users, plans, music seed data
│   ├── services/       # All business logic services
│   └── validation/     # Zod schemas
├── pages/              # 17 page components
├── types/              # TypeScript interfaces
└── __tests__/          # 14 test files, 100 tests
```

## Tech Stack

- **Framework**: React 19 + TypeScript 6
- **Build**: Vite 8
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Linting**: Oxlint

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run lint` | Run linter |

## Testing

14 test files with 100 tests covering:

- Auth: login, register, logout, form validation
- Routing: ProtectedRoute, GuestOnlyRoute redirects
- Player: play/pause, repeat cycle, shuffle, queue, stream limits
- Playlists: CRUD, subscription limits by tier
- Notifications: CRUD, mark read, delete, role-based triggers
- RoleGuard: role blocking, fallback rendering
- Storage: JSON parsing, seeding
- Subscriptions: plan upgrades, avatar restrictions
- Users: follow/unfollow, account deletion
- Passwords: hashing, verification

```bash
npm run test:run
```

## Call Graph

See `call-graph.md` for the full architecture diagram with 146 modules and dependency analysis.

```bash
npx madge --image call-graph.svg --extensions ts,tsx src/ --ts-config tsconfig.app.json
```
