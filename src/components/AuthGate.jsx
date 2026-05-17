import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Lock, Scissors, Calendar, User } from "lucide-react";

const COPY = {
  "/my-bookings": {
    icon: Calendar,
    title: "Sign in to view your bookings",
    body: "Keep track of all your upcoming and past appointments in one place.",
  },
  "/profile": {
    icon: User,
    title: "Sign in to manage your profile",
    body: "Update your preferences, payment info, and account settings.",
  },
  "/dashboard": {
    icon: Scissors,
    title: "Sign in to access your barber dashboard",
    body: "Manage your bookings, services, payouts, and barber profile.",
  },
};

export default function AuthGate({ pathname, children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const config = COPY[pathname] || {
      icon: Lock,
      title: "Sign in to continue",
      body: "You need to be signed in to view this page.",
    };
    const Icon = config.icon;

    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4 pb-24 md:pb-8">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-xl mb-2">{config.title}</h2>
          <p className="text-muted-foreground text-sm mb-6">{config.body}</p>
          <Button
            className="w-full h-11 rounded-xl"
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return children;
}