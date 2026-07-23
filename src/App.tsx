import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/context/AuthContext";
import { PlayerProvider } from "@/lib/context/PlayerContext";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ROUTES } from "@/lib/constants/routes";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { GuestOnlyRoute } from "@/components/routing/GuestOnlyRoute";
import { RoleRoute } from "@/components/routing/RoleRoute";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import RegisterArtistPage from "@/pages/RegisterArtistPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import ArtistDashboardPage from "@/pages/ArtistDashboardPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import PlaylistsPage from "@/pages/PlaylistsPage";
import AlbumsPage from "@/pages/AlbumsPage";
import AlbumDetailPage from "@/pages/AlbumDetailPage";
import ArtistPage from "@/pages/ArtistPage";
import PlayerPage from "@/pages/PlayerPage";
import NotificationsPage from "@/pages/NotificationsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LanguageProvider>
          <PlayerProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={ROUTES.HOME} element={<HomePage />} />

              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path={ROUTES.PROFILE_BY_USERNAME} element={<ProfilePage />} />
                <Route path={ROUTES.EDIT_PROFILE} element={<EditProfilePage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                <Route path={ROUTES.SUBSCRIPTION} element={<SubscriptionPage />} />
                <Route path={ROUTES.PLAYLISTS} element={<PlaylistsPage />} />
                <Route path={ROUTES.ALBUMS} element={<AlbumsPage />} />
                <Route path={ROUTES.ALBUM_DETAIL} element={<AlbumDetailPage />} />
                <Route path={ROUTES.ARTIST} element={<ArtistPage />} />
                <Route path={ROUTES.PLAYER} element={<PlayerPage />} />
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                <Route element={<RoleRoute allow={["artist"]} />}>
                  <Route path={ROUTES.ARTIST_DASHBOARD} element={<ArtistDashboardPage />} />
                </Route>
                <Route element={<RoleRoute allow={["support"]} />}>
                  <Route path={ROUTES.SUPPORT_DASHBOARD} element={<AdminDashboardPage />} />
                </Route>
                <Route element={<RoleRoute allow={["admin"]} />}>
                  <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<GuestOnlyRoute />}>
              <Route element={<AuthLayout />}>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTES.REGISTER_ARTIST} element={<RegisterArtistPage />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
          </PlayerProvider>
        </LanguageProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
