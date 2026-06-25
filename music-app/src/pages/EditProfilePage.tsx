import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Edit Profile</h1>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
          <EditProfileForm user={user} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
