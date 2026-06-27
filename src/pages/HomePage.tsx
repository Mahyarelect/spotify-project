import { useAuth } from "@/lib/hooks/useAuth";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants/routes";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <>
      {loading ? (
        <p className="text-center text-zinc-400">Loading...</p>
      ) : user ? (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.displayName}</h1>
          <p className="text-zinc-400">
            Your plan: <span className="font-medium text-zinc-200">{user.planTier}</span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={ROUTES.PROFILE}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700 sm:w-auto"
            >
              My Profile
            </Link>
            <Link
              to={ROUTES.SUBSCRIPTION}
              className="w-full rounded-lg bg-zinc-700 px-4 py-2 text-center text-zinc-200 hover:bg-zinc-600 sm:w-auto"
            >
              Subscription
            </Link>
            <Link
              to={ROUTES.SETTINGS}
              className="w-full rounded-lg bg-zinc-700 px-4 py-2 text-center text-zinc-200 hover:bg-zinc-600 sm:w-auto"
            >
              Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Music App</h1>
          <p className="text-zinc-400">Stream your favorite music anywhere.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={ROUTES.LOGIN}
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
            >
              Sign In
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="rounded-lg bg-zinc-700 px-6 py-3 font-medium text-zinc-200 hover:bg-zinc-600"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
