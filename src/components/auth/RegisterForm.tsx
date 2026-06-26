import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, MIN_AGE_YEARS, MAX_AGE_YEARS, dateInputValueYearsAgo } from "@/lib/validation/authSchemas";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/lib/constants/routes";
import type { z } from "zod";

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { registerListener } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: "onChange" });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError("");
    try {
      await registerListener({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        birthDate: data.birthDate,
        gender: data.gender,
      });
      navigate(ROUTES.HOME);
    } catch (error) {
      if (error instanceof Error && error.message === "Email already exists") {
        setServerError("An account with this email already exists.");
        return;
      }
      setServerError("Registration failed. Please try again.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {serverError}
          </div>
        )}
        <Input label="Display Name" placeholder="Your name" error={errors.displayName?.message} {...register("displayName")} />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        <Input label="Confirm Password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Input
          label="Birth Date"
          type="date"
          min={dateInputValueYearsAgo(MAX_AGE_YEARS)}
          max={dateInputValueYearsAgo(MIN_AGE_YEARS)}
          error={errors.birthDate?.message}
          {...register("birthDate")}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</label>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border-zinc-300"
            {...register("gender")}
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="unspecified">Prefer not to say</option>
          </select>
          {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="acceptPolicy" className="rounded border-zinc-300" {...register("acceptPolicy")} />
          <label htmlFor="acceptPolicy" className="text-sm text-zinc-600 dark:text-zinc-400">
            I accept the{" "}
            <button type="button" onClick={() => setPolicyOpen(true)} className="text-green-600 hover:underline">
              privacy policy
            </button>
          </label>
        </div>
        {errors.acceptPolicy && <p className="text-sm text-red-500">{errors.acceptPolicy.message}</p>}
        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 hover:underline">Sign in</Link>
        </p>
      </form>

      <Modal open={policyOpen} onClose={() => setPolicyOpen(false)} title="Privacy Policy">
        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3">
          <p><strong>Mock Privacy Policy</strong></p>
          <p>This is a mock privacy policy for Phase 1 of the music streaming app project. No real data is collected or processed.</p>
          <p>In the production version, user data will be handled in accordance with applicable privacy regulations and stored securely on our backend servers.</p>
          <p>By using this application, you agree to the collection and use of information as outlined in this policy.</p>
        </div>
      </Modal>
    </>
  );
}
