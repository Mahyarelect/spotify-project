import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants/routes";

export default function ArtistDashboardPlaceholder() {
  return (
    <div className="text-center py-20 space-y-4">
      <h1 className="text-2xl font-bold">Artist Dashboard</h1>
      <p className="text-zinc-400">This dashboard is owned by a teammate and will be available in a future phase.</p>
      <Link to={ROUTES.HOME} className="inline-block text-green-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
