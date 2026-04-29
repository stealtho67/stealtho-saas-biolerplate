/**
 * MobileHeader — persistent iOS-style header for mobile.
 * Shows app logo on root tabs, or back button + page title on sub-routes.
 */
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Scissors } from "lucide-react";

// Map pathname patterns → human-readable titles
const PAGE_TITLES = {
  "/": "NextCut",
  "/explore": "Explore",
  "/barbershops": "Barbershops",
  "/my-bookings": "My Bookings",
  "/profile": "Profile",
  "/dashboard": "Dashboard",
  "/apply": "Apply as Barber",
};

// Root tab paths — these show the logo, not a back button
const ROOT_TABS = new Set(["/", "/explore", "/barbershops", "/my-bookings", "/profile", "/dashboard"]);

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/barber/")) return "Barber Profile";
  if (pathname.startsWith("/barbershop/")) return "Barbershop";
  return "NextCut";
}

export default function MobileHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isRootTab = ROOT_TABS.has(pathname);
  const title = getTitle(pathname);
  const canGoBack = !isRootTab && window.history.length > 1;

  return (
    <header className="md:hidden flex items-center h-14 px-4 bg-card/90 border-b border-border sticky top-0 z-50 backdrop-blur-xl">
      {/* Left: back button or logo */}
      <div className="w-10">
        {canGoBack ? (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-primary active:bg-accent transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <Link to="/" className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </Link>
        )}
      </div>

      {/* Center: title */}
      <div className="flex-1 text-center">
        <span className="font-heading font-bold text-base">{title}</span>
      </div>

      {/* Right: spacer to balance layout */}
      <div className="w-10" />
    </header>
  );
}