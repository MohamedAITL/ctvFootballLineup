import { Link, useLocation } from "wouter";
import { Users, LayoutPanelLeft } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center gap-2 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl">
      <Link href="/">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            location === "/"
              ? "bg-primary text-primary-foreground"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <LayoutPanelLeft className="w-4 h-4" />
          <span>Lineup</span>
        </button>
      </Link>
      <Link href="/teams">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
            location.startsWith("/teams")
              ? "bg-primary text-primary-foreground"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teams</span>
        </button>
      </Link>
    </nav>
  );
}
