"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
    } else if (user.role === "manager") {
      router.replace("/dashboard");
    } else {
      router.replace("/board");
    }
  }, [loading, token, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
