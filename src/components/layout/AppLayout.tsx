import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/hooks/useAuth";

export function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <TopNav />
      <div className="flex flex-1">
        {user ? <Sidebar /> : null}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
