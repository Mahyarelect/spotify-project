import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/authSchemas";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: { email: string; password: string }) => {
    setServerError("");
    try {
      const { role } = await login(data.email, data.password);
      if (role === "listener") navigate("/");
      else if (role === "artist") navigate("/artist-dashboard");
      else navigate("/admin-dashboard");
    } catch {
      setServerError("Invalid email or password");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {serverError}
        </div>
      )}
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
      <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
      <div className="text-right">
        <Link to="/forgot-password" className="text-sm text-green-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-green-600 hover:underline">Register</Link>
      </p>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Want to{" "}
        <Link to="/register-artist" className="text-green-600 hover:underline">register as an artist</Link>?
      </p>
    </form>
  );
}
