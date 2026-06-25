import { useAuth } from "@/lib/hooks/useAuth";
import { Link } from "react-router-dom";

export default function HomePage() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="max-w-4xl mx-auto py-4 px-4 flex items-center gap-4 border-b dark:border-zinc-800">
        <Link to="/profile" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Profile</Link>
        <Link to="/subscription" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Subscription</Link>
        <Link to="/settings" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">Settings</Link>
        {user && (
          <button onClick={logout} className="ml-auto text-sm text-zinc-500 dark:text-zinc-400 hover:underline">
            Sign Out
          </button>
        )}
      </nav>
      <div className="max-w-4xl mx-auto py-10 px-4">
        {loading ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">Loading...</p>
        ) : user ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Welcome, {user.displayName}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your plan: <span className="font-medium capitalize dark:text-zinc-200">{user.planTier}</span>
            </p>
            <div className="flex gap-4">
              <Link to="/profile" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                My Profile
              </Link>
              <Link to="/subscription" className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600">
                Subscription
              </Link>
              <Link to="/settings" className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600">
                Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <h1 className="text-3xl font-bold dark:text-white">Music App</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Stream your favorite music anywhere.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Sign In
              </Link>
              <Link to="/register" className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 font-medium">
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
