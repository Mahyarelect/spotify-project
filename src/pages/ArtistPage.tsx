import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import { getArtistProfile } from "@/lib/services/artistService";
import { followUser, unfollowUser } from "@/lib/services/userService";
import type { User } from "@/types/user";
import type { Song, Album } from "@/types/music";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { ArtistWorksList } from "@/components/artist/ArtistWorksList";
import { ArtistStatsPanel } from "@/components/artist/ArtistStatsPanel";

export default function ArtistPage() {
  const { t } = useTranslation();
  const { artistName } = useParams();
  const decoded = artistName ? decodeURIComponent(artistName) : "";
  const { user: currentUser, refreshUser } = useAuth();

  const [artist, setArtist] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [singles, setSingles] = useState<Song[]>([]);
  const [totalStreams, setTotalStreams] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followPending, setFollowPending] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const followPendingRef = useRef(false);

  useEffect(() => {
    if (!decoded) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadArtist() {
      setLoading(true);
      const profile = await getArtistProfile(decoded);
      if (cancelled) return;

      if (profile) {
        setArtist(profile.user);
        setSongs(profile.songs);
        setAlbums(profile.albums);
        setSingles(profile.singles);
        setTotalStreams(profile.totalStreams);
        setIsFollowing(profile.isFollowing);
      } else {
        setArtist(null);
      }
      setLoading(false);
    }

    loadArtist();
    return () => { cancelled = true; };
  }, [decoded]);

  const isOwnProfile = currentUser?.id === artist?.id;

  const canViewStats = currentUser
    ? currentUser.subscription.limits.statisticsAllowed
    : false;

  const handleFollow = useCallback(async () => {
    if (!currentUser || !artist || followPendingRef.current) return;
    followPendingRef.current = true;
    setFollowPending(true);
    setFollowError(null);
    try {
      const profile = await followUser(artist.username);
      setArtist((prev) => prev ? { ...prev, followersCount: profile.followersCount } : prev);
      setIsFollowing(profile.isFollowing);
      try {
        await refreshUser();
      } catch {
        setFollowError(t.profile.followSyncError);
      }
    } catch (caught) {
      setFollowError(caught instanceof Error ? caught.message : t.profile.followError);
    } finally {
      followPendingRef.current = false;
      setFollowPending(false);
    }
  }, [currentUser, artist, refreshUser, t.profile.followError, t.profile.followSyncError]);

  const handleUnfollow = useCallback(async () => {
    if (!currentUser || !artist || followPendingRef.current) return;
    followPendingRef.current = true;
    setFollowPending(true);
    setFollowError(null);
    try {
      const profile = await unfollowUser(artist.username);
      setArtist((prev) => prev ? { ...prev, followersCount: profile.followersCount } : prev);
      setIsFollowing(profile.isFollowing);
      try {
        await refreshUser();
      } catch {
        setFollowError(t.profile.followSyncError);
      }
    } catch (caught) {
      setFollowError(caught instanceof Error ? caught.message : t.profile.unfollowError);
    } finally {
      followPendingRef.current = false;
      setFollowPending(false);
    }
  }, [currentUser, artist, refreshUser, t.profile.followSyncError, t.profile.unfollowError]);

  if (loading) {
    return <p className="p-8 text-center text-zinc-400">{t.artist.loading}</p>;
  }

  if (!artist) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-zinc-400">{t.artist.notFound}</p>
        <Link
          to={ROUTES.ALBUMS}
          className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
        >
          <ArrowLeft size={16} />
          {t.artist.backToAlbums}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        to={ROUTES.ALBUMS}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft size={16} />
        {t.artist.backToAlbums}
      </Link>

      {followError && (
        <p role="alert" className="rounded-lg bg-red-950/30 p-3 text-sm text-red-400">
          {followError}
        </p>
      )}

      <ArtistHeader
        artist={artist}
        isVerified={artist.artistVerified}
        isFollowing={isFollowing}
        isOwnProfile={!!isOwnProfile}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        followPending={followPending}
      />

      {canViewStats && (
        <ArtistStatsPanel
          totalStreams={totalStreams}
          followerCount={artist.followersCount}
          songCount={songs.length}
          albumCount={albums.length}
        />
      )}

      <ArtistWorksList
        albums={albums}
        singles={singles}
        allSongs={songs}
      />
    </div>
  );
}
