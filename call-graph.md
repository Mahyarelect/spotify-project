# Call Graph — music-app

Generated from static analysis of `src/` using `madge`.

- **121 modules** analyzed
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
│                     SERVICES (10)                               │
│  authService → password, storage, notificationService           │
│  userService → storage, subscriptionService                     │
│  subscriptionService → storage                                  │
│  playlistService → storage, plans                               │
│  streamService → storage                                        │
│  settingsService → userService                                  │
│  notificationService → storage, users                           │
│  artistService → storage, types/artist, types/music, users      │  ← NEW
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
  ├─→ routes, useAuth, storage

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
  ├─→ useAuth, playlistService, storage

AlbumsPage
  ├─→ PageHeader
  ├─→ AlbumCardArchive, SingleCard, SearchBar, FilterSortBar
  ├─→ useAuth, playlistService, storage

NotificationsPage  ← NEW
  ├─→ PageHeader, PageShell, Button
  ├─→ NotificationList, EmptyNotificationsState
  ├─→ useAuth, notificationService
  └─→ (no direct storage import — proper architecture)

AlbumDetailPage → routes, usePlayer, storage
PlayerPage → routes, usePlayer, storage
ArtistPage  ← REPLACED
  ├─→ ArtistHeader → VerifiedBadge, types/user
  ├─→ ArtistWorksList → routes, usePlayer, types/music (albums + singles + play buttons)
  ├─→ ArtistStatsPanel (Gold-only: total streams, followers, songs, albums)
  ├─→ artistService.getArtistByDisplayName(), .getArtistAlbums(), .getArtistSingles(), .getArtistTotalStreams()
  ├─→ userService.followUser(), .unfollowUser()
  ├─→ useAuth, plans, routes
  └─→ (no direct storage import — proper architecture)
ArtistDashboardPlaceholder → routes (placeholder)
AdminDashboardPlaceholder → routes (placeholder)
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
| Types | 5 | `types/user.ts` (25 importers) |
| Constants | 3 | `lib/constants/routes.ts` (15 importers) |
| Services | 10 | `lib/services/storage.ts` (13 importers) |
| Context | 2 | `AuthContext` (via useAuth: 14 importers) |
| Hooks | 3 | `useAuth` (14 importers), `usePlayer` (8 importers) |
| Components | 53 | `Button` (9 importers), `Modal` (4 importers) |
| Pages | 17 | All import from hooks/services/components |

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
