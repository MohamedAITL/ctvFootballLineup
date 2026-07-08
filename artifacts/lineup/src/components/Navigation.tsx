import { Link, useLocation } from "wouter";
import { Users, LayoutPanelLeft } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-1 py-1 rounded-full border border-white/10 shadow-lg">
      <Link href="/">
        <button
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
            location === "/"
              ? "bg-primary text-primary-foreground"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <LayoutPanelLeft className="w-3 h-3" />
          <span>Lineup</span>
        </button>
      </Link>
      <Link href="/teams">
        <button
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
            location.startsWith("/teams")
              ? "bg-primary text-primary-foreground"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Teams</span>
        </button>
      </Link>
    </nav>
  );
}
