import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { artistRegisterSchema } from "@/lib/validation/authSchemas";
import * as authService from "@/lib/services/authService";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ArtistRegisterForm() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(artistRegisterSchema) });

  const onSubmit = async (data: {
    email: string;
    password: string;
    artistName: string;
    portfolioUrl: string;
  }) => {
    setServerError("");
    try {
      await authService.registerArtist(data);
      setSubmitted(true);
    } catch (error) {
      if (error instanceof Error && error.message === "An account with this email already exists") {
        setServerError(t.registerArtist.emailExists);
        return;
      }
      if (error instanceof Error && error.message === "An artist application with this email is already pending or approved") {
        setServerError(t.registerArtist.alreadyPending);
        return;
      }
      setServerError(t.registerArtist.failed);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-4xl">🎵</div>
        <h2 className="text-xl font-semibold dark:text-white">{t.registerArtist.submittedTitle}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">{t.registerArtist.submittedMessage}</p>
        <Link to="/login" className="inline-block text-green-600 hover:underline">{t.registerArtist.backToLogin}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{serverError}</div>
      )}
      <Input label={t.registerArtist.emailLabel} type="email" placeholder={t.registerArtist.emailPlaceholder} error={errors.email?.message} {...register("email")} />
      <Input label={t.registerArtist.passwordLabel} type="password" placeholder={t.registerArtist.passwordPlaceholder} error={errors.password?.message} {...register("password")} />
      <Input label={t.registerArtist.artistNameLabel} placeholder={t.registerArtist.artistNamePlaceholder} error={errors.artistName?.message} {...register("artistName")} />
      <Input label={t.registerArtist.portfolioUrlLabel} placeholder={t.registerArtist.portfolioUrlPlaceholder} error={errors.portfolioUrl?.message} {...register("portfolioUrl")} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.registerArtist.submitting : t.registerArtist.submit}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {t.registerArtist.hasAccount}{" "}
        <Link to="/login" className="text-green-600 hover:underline">{t.registerArtist.signIn}</Link>
      </p>
    </form>
  );
}
