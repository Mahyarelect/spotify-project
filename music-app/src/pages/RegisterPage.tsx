import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
