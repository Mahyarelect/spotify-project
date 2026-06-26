import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import * as userService from "@/lib/services/userService";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { ROUTES } from "@/lib/constants/routes";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSave = async (data: { displayName: string; bio?: string; avatarUrl?: string }) => {
    await userService.updateProfile(user.id, data);
    await refreshUser();
    navigate(ROUTES.PROFILE);
  };

  return (
    <>
      <PageHeader title="Edit Profile" />
      <PageShell>
        <EditProfileForm user={user} onSave={handleSave} />
      </PageShell>
    </>
  );
}
