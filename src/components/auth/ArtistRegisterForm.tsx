import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { artistRegisterSchema } from "@/lib/validation/authSchemas";
import * as authService from "@/lib/services/authService";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function ArtistRegisterForm() {
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
        setServerError("An account with this email already exists.");
        return;
      }
      if (error instanceof Error && error.message === "An artist application with this email is already pending or approved") {
        setServerError("An artist application with this email is already pending or approved.");
        return;
      }
      setServerError("Registration failed. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-4xl">🎵</div>
        <h2 className="text-xl font-semibold dark:text-white">Application Submitted</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Your artist application is pending review. We&apos;ll notify you once a decision has been made.</p>
        <Link to="/login" className="inline-block text-green-600 hover:underline">Back to Login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{serverError}</div>
      )}
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
      <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
      <Input label="Artist / Stage Name" placeholder="Your stage name" error={errors.artistName?.message} {...register("artistName")} />
      <Input label="Portfolio URL" placeholder="https://your-portfolio.com" error={errors.portfolioUrl?.message} {...register("portfolioUrl")} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link to="/login" className="text-green-600 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
