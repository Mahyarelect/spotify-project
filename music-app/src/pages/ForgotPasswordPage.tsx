import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Forgot Password</h1>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
