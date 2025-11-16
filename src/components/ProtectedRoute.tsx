import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const session = authClient.useSession();

  // Show loading state while checking authentication
  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  // Save the attempted location so we can redirect back after sign-in
  if (!session.data?.user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

