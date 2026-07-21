import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import {
  getArtistByDisplayName,
  getArtistAlbums,
  getArtistSingles,
  getArtistTotalStreams,
  isArtistVerified,
  getArtistSongs,
} from "@/lib/services/artistService";
import { followUser, unfollowUser } from "@/lib/services/userService";
import type { User } from "@/types/user";
import { ArtistHeader } from "@/components/artist/ArtistHeader";
import { ArtistWorksList } from "@/components/artist/ArtistWorksList";
import { ArtistStatsPanel } from "@/components/artist/ArtistStatsPanel";

export default function ArtistPage() {
  const { t } = useTranslation();
  const { artistName } = useParams();
  const decoded = artistName ? decodeURIComponent(artistName) : "";
  const { user: currentUser, refreshUser } = useAuth();

  const [artist, setArtist] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decoded) {
      setLoading(false);
      return;
    }
    const found = getArtistByDisplayName(decoded);
    setArtist(found);
    setLoading(false);
  }, [decoded]);

  const albums = useMemo(
    () => (artist ? getArtistAlbums(artist.displayName) : []),
    [artist]
  );
  const singlesData = useMemo(
    () => (artist ? getArtistSingles(artist.displayName) : []),
    [artist]
  );
  const allSongs = useMemo(
    () => (artist ? getArtistSongs(artist.displayName) : []),
    [artist]
  );
  const totalStreams = useMemo(
    () => (artist ? getArtistTotalStreams(artist.displayName) : 0),
    [artist]
  );
  const verified = useMemo(
    () => (artist ? isArtistVerified(artist) : false),
    [artist]
  );

  const isOwnProfile = currentUser?.id === artist?.id;

  const canViewStats = currentUser
    ? currentUser.subscription.limits.statisticsAllowed
    : false;

  const handleFollow = useCallback(async () => {
    if (!currentUser || !artist) return;
    const profile = await followUser(artist.username);
    setArtist((prev) => prev ? { ...prev, followersCount: profile.followersCount } : prev);
    setIsFollowing(profile.isFollowing);
    await refreshUser();
  }, [currentUser, artist, refreshUser]);

  const handleUnfollow = useCallback(async () => {
    if (!currentUser || !artist) return;
    const profile = await unfollowUser(artist.username);
    setArtist((prev) => prev ? { ...prev, followersCount: profile.followersCount } : prev);
    setIsFollowing(profile.isFollowing);
    await refreshUser();
  }, [currentUser, artist, refreshUser]);

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

      <ArtistHeader
        artist={artist}
        isVerified={verified}
        isFollowing={isFollowing}
        isOwnProfile={!!isOwnProfile}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />

      {canViewStats && (
        <ArtistStatsPanel
          totalStreams={totalStreams}
          followerCount={artist.followersCount}
          songCount={allSongs.length}
          albumCount={albums.length}
        />
      )}

      <ArtistWorksList
        albums={albums}
        singles={singlesData.map((s) => s.song)}
        allSongs={allSongs}
      />
    </div>
  );
}
