import { ArtistRegisterForm } from "@/components/auth/ArtistRegisterForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function RegisterArtistPage() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">{t.registerArtist.title}</h1>
      <ArtistRegisterForm />
    </>
  );
}
