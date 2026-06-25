import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validation/authSchemas";
import * as authService from "@/lib/services/authService";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: { email: string }) => {
    const res = await authService.forgotPassword(data.email);
    setMessage(res.message);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-semibold">Check Your Email</h2>
        <p className="text-zinc-500">{message}</p>
        <Link to="/login" className="inline-block text-green-600 hover:underline">Back to Login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-zinc-500">Enter your email address and we&apos;ll send you a link to reset your password.</p>
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Remember your password?{" "}
        <Link to="/login" className="text-green-600 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
