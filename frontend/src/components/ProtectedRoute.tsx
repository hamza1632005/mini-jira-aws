"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({
  children,
  managerOnly = false,
}: {
  children: React.ReactNode;
  managerOnly?: boolean;
}) {
  const { token, user, loading, isManager } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (managerOnly && !isManager) {
      router.replace("/board");
    }
  }, [loading, token, user, managerOnly, isManager, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!token || !user) return null;
  if (managerOnly && !isManager) return null;

  return <>{children}</>;
}
