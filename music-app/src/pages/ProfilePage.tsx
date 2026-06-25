import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [streamsToday] = useState(12);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="max-w-2xl mx-auto py-4 px-4 flex items-center gap-4 border-b dark:border-zinc-800">
        <Link to="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Home</Link>
        <Link to="/subscription" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Subscription</Link>
        <Link to="/settings" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Settings</Link>
      </nav>
      <div className="max-w-2xl mx-auto py-10 px-4">
        <ProfileCard
          user={user}
          viewerIsOwner={true}
          onEdit={() => navigate("/profile/edit")}
          streamsToday={streamsToday}
        />
      </div>
    </div>
  );
}
