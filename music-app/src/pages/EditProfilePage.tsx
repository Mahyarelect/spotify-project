import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import * as userService from "@/lib/services/userService";

export default function EditProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleSave = async (data: { displayName: string; bio?: string; avatarUrl?: string }) => {
    await userService.updateProfile(user.id, data);
    await refreshUser();
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="max-w-xl mx-auto py-4 px-4 flex items-center gap-4 border-b dark:border-zinc-800">
        <Link to="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Home</Link>
        <Link to="/profile" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Profile</Link>
        <Link to="/subscription" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Subscription</Link>
        <Link to="/settings" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Settings</Link>
      </nav>
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Edit Profile</h1>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
          <EditProfileForm user={user} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
