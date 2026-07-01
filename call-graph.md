# Call Graph — music-app

Generated from static analysis of `src/` using `madge`.

- **146 modules** analyzed
- **0 circular dependencies** found

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                             │
│   main.tsx → App.tsx                                            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PAGES (17)                               │
│   HomePage, LoginPage, RegisterPage, NotificationsPage, etc.    │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────┐  ┌────────────────────┐  ┌─────────────┐
│   COMPONENTS (53)    │  │    ROUTING (2)     │  │  LAYOUT (7) │
│  auth/ player/ home/ │  │ ProtectedRoute     │  │  AppLayout  │
│  albums/ playlists/  │  │ GuestOnlyRoute     │  │  TopNav     │
│  profile/ settings/  │  └────────────────────┘  │  Sidebar    │
│  subscription/ ui/   │                          └─────────────┘
│  notifications/      │
│  artist/             │
│  artist-dashboard/   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐  ┌────────────────────┐  ┌─────────────┐
│   HOOKS (3)          │  │  CONTEXT (2)       │  │ VALIDATION  │
│  useAuth             │  │  AuthContext        │  │  authSchema │
│  usePlayer           │  │  PlayerContext      │  │  profileSch │
│  useSubscriptionLim  │  └────────────────────┘  └─────────────┘
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICES (15)                               │
│  authService → password, storage, notificationService           │
│  userService → storage, subscriptionService                     │
│  subscriptionService → storage                                  │
│  playlistService → storage, plans                               │
│  streamService → storage                                        │
│  settingsService → userService                                  │
│  notificationService → storage, users                           │
│  artistService → storage, types/artist, types/music, users      │
│  artistWorkService → storage, types/music, users (CRUD)         │
│  adminService → storage, notificationService, password          │
│  ticketService → storage, types/ticket                          │
│  auditService → storage, types/audit, users, songs              │
│  musicService → storage (read-only wrapper)  ← NEW              │
│  storage → mockData (users, plans, music)                       │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────┐  ┌────────────────────┐
│   TYPES (5)          │  │  CONSTANTS (3)     │
│  user.ts             │  │  routes.ts         │
│  music.ts            │  │  plans.ts          │
│  subscription.ts     │  │  roles.ts          │
│  notification.ts     │  └────────────────────┘
│  artist.ts           │  ← NEW
└──────────────────────┘
```

---

## Module Dependency Map

### Entry Flow
```
main.tsx
  ├─→ ErrorBoundary → ErrorFallback (catches render errors)
  └─→ App.tsx
       ├─→ AuthContext (provider)
       ├─→ PlayerContext (provider)
       ├─→ routes (constants)
       ├─→ AppLayout, AuthLayout
       ├─→ ProtectedRoute, GuestOnlyRoute
       └─→ 17 page components
```

### Context & Hooks
```
AuthContext
  ├─→ authService.login(), .registerListener(), .logout()
  ├─→ userService.getCurrentUser()
  ├─→ notificationService.notifySubscriptionExpiry()  ← NEW
  └─→ types/user.User

PlayerContext
  ├─→ useAuth (hook)
  ├─→ storage.getPlayerPrefs(), .savePlayerPrefs()
  ├─→ streamService.canStream(), .recordStream()
  └─→ types/music.Song

useAuth ──→ AuthContext
usePlayer ──→ PlayerContext
useSubscriptionLimits ──→ constants/plans, types/user
```

### Service Layer
```
authService
  ├─→ password.mockHashPassword(), .verifyMockPassword()
  ├─→ storage.getUsers(), .saveUsers(), .setSessionUserId()
  └─→ notificationService.notifyArtistVerification()  ← NEW

userService
  ├─→ storage.getUsers(), .saveUsers(), .getSessionUserId()
  └─→ subscriptionService.getPlanByTier()

subscriptionService
  └─→ storage.getPlans(), .savePlans(), .getUsers(), .saveUsers()

playlistService
  ├─→ storage.getPlaylists(), .savePlaylists()
  └─→ plans.getPlanLimits()

streamService
  └─→ storage.getStreamCount(), .incrementStreamCount()

settingsService
  └─→ userService.updateProfile()

notificationService  ← NEW
  ├─→ storage.getNotifications(), .saveNotifications(), .getUsers()
  ├─→ getNotifications(), getUnreadCount(), markAsRead(), markAllAsRead(), deleteNotification()
  ├─→ createNotification()
  └─→ Triggers: notifySubscriptionExpiry, notifyNewRelease, notifyArtistApproved,
      notifyArtistRejected, notifyMonthlyFinancial, notifyNewTicket,
      notifyArtistVerification, notifyAdminAnnouncement

artistService  ← NEW
  ├─→ storage.getUsers(), .getSongs(), .getAlbums()
  ├─→ getArtistByDisplayName(), getArtistSongs(), getArtistAlbums(), getArtistSingles()
  ├─→ getArtistTotalStreams(), isArtistVerified(), getArtistProfile()
  └─→ types/artist, types/user, types/music

storage (foundation — no upstream deps except mock data)
  ├─→ mockData/users
  ├─→ mockData/plans
  └─→ mockData/music
```

### Page → Component Dependencies
```
HomePage
  ├─→ SectionHeading, HorizontalCardScroller
  ├─→ AlbumCard, PlaylistCard, SongRow, EarlyAccessBanner
  ├─→ routes, useAuth, musicService

LoginPage → LoginForm
RegisterPage → RegisterForm
RegisterArtistPage → ArtistRegisterForm
ForgotPasswordPage → ForgotPasswordForm

ProfilePage
  ├─→ ProfileCard
  ├─→ routes, useAuth, userService

EditProfilePage
  ├─→ PageHeader, PageShell, EditProfileForm
  ├─→ routes, useAuth, userService

SettingsPage
  ├─→ PageHeader, PageShell
  ├─→ NotificationSettings, SoundSettings, LanguageSettings, DeleteAccountDialog
  ├─→ routes, useAuth, settingsService, userService

SubscriptionPage
  ├─→ PageHeader, PageShell
  ├─→ PlanCard, PlanComparisonTable, UpgradeModal
  ├─→ useAuth, subscriptionService, userService

PlaylistsPage
  ├─→ PageHeader, Button
  ├─→ CreatePlaylistModal, EmptyPlaylistState, PlaylistCardExpandable
  ├─→ useAuth, playlistService, musicService

AlbumsPage
  ├─→ PageHeader
  ├─→ AlbumCardArchive, SingleCard, SearchBar, FilterSortBar
  ├─→ useAuth, playlistService, musicService

NotificationsPage  ← NEW
  ├─→ PageHeader, PageShell, Button
  ├─→ NotificationList, EmptyNotificationsState
  ├─→ useAuth, notificationService
  └─→ (no direct storage import — proper architecture)

AlbumDetailPage → routes, usePlayer, musicService
PlayerPage → routes, usePlayer, musicService
ArtistPage  ← REPLACED
  ├─→ ArtistHeader → VerifiedBadge, types/user
  ├─→ ArtistWorksList → routes, usePlayer, types/music (albums + singles + play buttons)
  ├─→ ArtistStatsPanel (Gold-only: total streams, followers, songs, albums)
  ├─→ artistService.getArtistByDisplayName(), .getArtistAlbums(), .getArtistSingles(), .getArtistTotalStreams()
  ├─→ userService.followUser(), .unfollowUser()
  ├─→ useAuth, plans, routes
  └─→ (no direct storage import — proper architecture)
ArtistDashboardPage  ← REPLACED
  ├─→ RoleGuard (artist only)
  ├─→ ArtistStatsCards (total streams, listeners, revenue, published works)
  ├─→ ArtistWorksTable (songs/albums tabs, edit/delete actions)
  ├─→ WorkForm (title, genre, release year, collaborators, lyrics, cover, audio mock)
  │   ├─→ UploadAudioMock (mock file upload with random duration)
  │   └─→ CoverUploader (color picker for cover art)
  ├─→ artistWorkService (CRUD: createSong, updateSong, deleteSong, createAlbum, updateAlbum, deleteAlbum)
  ├─→ useAuth, PageHeader, PageShell, Button
  └─→ (no direct storage import — proper architecture)
AdminDashboardPage  ← IMPLEMENTED
  ├─→ RoleGuard (admin + support), AdminSidebar (5 sections)
  ├─→ ArtistVerificationTable, SupportTicketsTable, TicketChatBox
  ├─→ AuditPaymentsTable, SubscriptionPriceForm, RevenueCharts
  ├─→ adminService, ticketService, auditService, subscriptionService
  └─→ (no direct storage import — proper architecture)
```

### Layout Components
```
AppLayout
  ├─→ TopNav → navItems, routes, useAuth, notificationService  ← NEW
  ├─→ Sidebar → routes
  ├─→ PlayerBar → 6 control components, usePlayer
  ├─→ PlayerOverlay → QueuePanel, 6 controls, plans, useAuth, usePlayer, streamService
  ├─→ useAuth
  └─→ usePlayer

AuthLayout → routes
```

### Player System
```
PlayerBar
  ├─→ PlayPauseButton, ProgressBar, RepeatButton
  ├─→ ShuffleButton, SkipButton, VolumeControl
  └─→ usePlayer

PlayerOverlay
  ├─→ QueuePanel → QueueItem → types/music
  ├─→ (same 6 controls as PlayerBar)
  ├─→ plans, useAuth, usePlayer, streamService
  └─→ usePlayer

RepeatButton → PlayerContext (direct context import)
```

### Notification System  ← NEW
```
types/notification.ts
  └─→ NotificationType (8 types), Notification interface

notificationService.ts
  ├─→ storage.getNotifications(), .saveNotifications(), .getUsers()
  ├─→ types/notification.Notification
  ├─→ CRUD: getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createNotification
  └─→ Triggers:
      ├─→ notifySubscriptionExpiry (listener: plan expiring ≤7 days)
      ├─→ notifyNewRelease (listener: followed artist published)
      ├─→ notifyArtistApproved (artist: application approved)
      ├─→ notifyArtistRejected (artist: application rejected)
      ├─→ notifyMonthlyFinancial (artist: monthly report)
      ├─→ notifyNewTicket (support/admin: new ticket)
      ├─→ notifyArtistVerification (support/admin: new artist request)
      └─→ notifyAdminAnnouncement (all: admin broadcast)

NotificationCard.tsx
  ├─→ types/notification (Notification, NotificationType)
  ├─→ Icon by type: CreditCard, Music, CheckCircle, XCircle, DollarSign, MessageSquare, UserCheck, Megaphone
  └─→ Unread styling, relative time, delete button, click-to-navigate

NotificationList.tsx → NotificationCard
EmptyNotificationsState.tsx → Bell icon placeholder

NotificationsPage.tsx
  ├─→ PageHeader, PageShell, Button
  ├─→ NotificationList, EmptyNotificationsState
  ├─→ useAuth, notificationService
  └─→ mark-as-read, mark-all-as-read, delete

TopNav.tsx
  ├─→ Bell icon with unread count badge
  └─→ notificationService.getUnreadCount()

AuthContext.tsx
  └─→ notificationService.notifySubscriptionExpiry() on login/load

authService.ts
  └─→ notificationService.notifyArtistVerification() after artist registration
```

### Artist System  ← NEW
```
types/artist.ts
  └─→ ArtistProfile { user, albums, singles, totalStreams, isVerified }

artistService.ts
  ├─→ storage.getUsers(), .getSongs(), .getAlbums()
  ├─→ getArtistByDisplayName(name): User | null (matches by displayName, role=artist)
  ├─→ getArtistSongs(name): Song[]
  ├─→ getArtistAlbums(name): Album[]  (songIds.length > 1)
  ├─→ getArtistSingles(name): { song, album }[]  (songIds.length === 1)
  ├─→ getArtistTotalStreams(name): number  (sum of playCount)
  ├─→ isArtistVerified(user): boolean  (role === "artist")
  └─→ getArtistProfile(name): ArtistProfile | null

VerifiedBadge.tsx → BadgeCheck icon + "Verified" text
ArtistHeader.tsx → VerifiedBadge, types/user, follow/unfollow buttons
ArtistWorksList.tsx → Album cards (play all), Singles list (play per track), usePlayer
ArtistStatsPanel.tsx → Total streams, followers, songs, albums (Gold-only)

ArtistPage.tsx
  ├─→ ArtistHeader (avatar, name, bio, verified badge, follow/unfollow)
  ├─→ ArtistWorksList (albums grid + singles list)
  ├─→ ArtistStatsPanel (Gold users only, gated by getPlanLimits().viewStats)
  ├─→ artistService (all data fetching)
  ├─→ userService.followUser(), .unfollowUser()
  ├─→ useAuth, plans, routes
  └─→ (no direct storage import — proper architecture)
```

### Artist Dashboard System  ← NEW
```
artistWorkService.ts
  ├─→ storage.getSongs(), .saveSongs(), .getAlbums(), .saveAlbums(), .getUsers()
  ├─→ getWorksByArtist(name): { songs, albums }
  ├─→ getArtistListenerCount(name): number  (from artist followers)
  ├─→ getArtistRevenue(name): number  (totalStreams × $0.003)
  ├─→ createSong(data): Song  (with genre, releaseYear, collaborators, lyrics)
  ├─→ updateSong(id, patch): Song
  ├─→ deleteSong(id): void  (also removes from album)
  ├─→ createAlbum(data): Album  (with genre, releaseDate, isEarlyAccess)
  ├─→ updateAlbum(id, patch): Album
  ├─→ deleteAlbum(id): void  (also deletes album songs)
  └─→ addSongToAlbum(songId, albumId): void

ArtistStatsCards.tsx → Total streams, listeners, revenue, published works
ArtistWorksTable.tsx → Songs/Albums tabs, expandable rows, edit/delete actions
WorkForm.tsx → Title, genre dropdown, release year, collaborators, lyrics, cover picker, audio mock
UploadAudioMock.tsx → Mock file upload button, generates random duration
CoverUploader.tsx → Color grid picker for cover art

ArtistDashboardPage.tsx
  ├─→ RoleGuard (allow=["artist"])
  ├─→ ArtistStatsCards (live data from artistWorkService)
  ├─→ ArtistWorksTable (songs + albums with edit/delete)
  ├─→ WorkForm (create/edit single or album)
  ├─→ artistWorkService (all CRUD operations)
  ├─→ useAuth, PageHeader, PageShell, Button
  └─→ (no direct storage import — proper architecture)
```

### Component Dependencies
```
LoginForm → Button, Input, routes, useAuth, authSchemas
RegisterForm → Button, Input, Modal, routes, useAuth, authSchemas
ArtistRegisterForm → Button, Input, authService, authSchemas
ForgotPasswordForm → Button, Input, authService, authSchemas

EditProfileForm → AvatarUploader, Button, Input, useSubscriptionLimits, profileSchemas, types/user
ProfileCard → types/user
FollowButton → Button

SingleCard → AddToPlaylistMenu, usePlayer, types/music
AlbumCardArchive → types/music
AddToPlaylistMenu → types/music

PlaylistCardExpandable → usePlayer, types/music
CreatePlaylistModal → Button, Modal

NotificationSettings → types/user
DeleteAccountDialog → Button, Modal

PlanCard → types/subscription
PlanComparisonTable → types/subscription
UpgradeModal → Button, Modal, plans, types/subscription

RoleGuard → useAuth, types/user
EarlyAccessBanner → AlbumCard, routes, useAuth, types/music
```

---

## Files Generated

| File | Format | Usage |
|---|---|---|
| `call-graph.mmd` | Mermaid | GitHub Markdown, VS Code preview |
| `call-graph.dot` | Graphviz DOT | `dot -Tsvg call-graph.dot -o call-graph.svg` |
| `call-graph.json` | JSON (madge) | Raw dependency data |

### View the Graph

**Mermaid** (GitHub): Paste contents of `call-graph.mmd` into a GitHub Markdown code block.

**Graphviz** (install required):
```bash
# Install Graphviz: https://graphviz.org/download/
dot -Tsvg call-graph.dot -o call-graph.svg
# or
dot -Tpng call-graph.dot -o call-graph.png
```

**Madge** (live):
```bash
npx madge --image call-graph.svg --extensions ts,tsx src/ --ts-config tsconfig.app.json
```

---

## Dependency Statistics

| Layer | Module Count | Most-Depended-On |
|---|---|---|
| Types | 7 | `types/user.ts` (25 importers) |
| Constants | 3 | `lib/constants/routes.ts` (15 importers) |
| Services | 15 | `lib/services/storage.ts` (13 importers) |
| Context | 2 | `AuthContext` (via useAuth: 14 importers) |
| Hooks | 3 | `useAuth` (14 importers), `usePlayer` (8 importers) |
| Components | 74 | `Button` (9 importers), `Modal` (4 importers) |
| Pages | 19 | All import from hooks/services/components |
| Tests | 14 | 100 tests total, all passing |

### Most Connected Modules (by inbound edges)
1. `types/user.ts` — 25 modules depend on it
2. `lib/constants/routes.ts` — 15 modules depend on it
3. `lib/hooks/useAuth.ts` — 14 modules depend on it
4. `lib/services/storage.ts` — 13 modules depend on it
5. `types/music.ts` — 12 modules depend on it
6. `lib/hooks/usePlayer.ts` — 8 modules depend on it
7. `components/ui/Button.tsx` — 9 modules depend on it
8. `lib/services/notificationService.ts` — 5 modules depend on it
9. `types/notification.ts` — 5 modules depend on it
10. `lib/services/artistService.ts` — 2 modules depend on it (new)
11. `types/artist.ts` — 2 modules depend on it (new)

---

### Error Handling
```
main.tsx
  └─→ ErrorBoundary (class component, catches render errors)
       └─→ ErrorFallback (shows error message + "Try Again" button)
            └─→ App.tsx (entire app wrapped)
```

### Test Coverage (14 files, 100 tests)
```
__tests__/
  authSchemas.test.ts        (8 tests)  — login/register form validation
  authService.test.ts        (5 tests)  — login, logout, register, duplicate rejection
  ProtectedRoute.test.tsx    (2 tests)  — redirects guest, renders when authenticated
  GuestOnlyRoute.test.tsx    (2 tests)  — redirects authenticated, renders when guest
  RoleGuard.test.tsx         (5 tests)  — blocks role, fallback, allows role, unauthenticated
  playlistService.test.ts    (13 tests) — create, delete, rename, add/remove song, limits by tier
  notificationService.test.ts (16 tests) — CRUD, mark read, delete, triggers
  playerContext.test.tsx     (19 tests) — play/pause, next, prev, seek, volume, repeat, shuffle, queue
  streamService.test.ts      (12 tests) — stream counting, daily limits
  subscription.test.ts       (2 tests)  — plan upgrade, avatar restriction
  userService.test.ts        (4 tests)  — follow, unfollow, delete account
  storage.test.ts            (5 tests)  — JSON parsing, fallback, seeding
  password.test.ts           (5 tests)  — hashing, verification
  TopNav.test.tsx            (2 tests)  — logo, user display
```
