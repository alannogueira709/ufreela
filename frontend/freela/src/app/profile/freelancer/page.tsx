"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function FreelancerProfileRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user?.id) {
        router.push(`/profile/freelancer/${user.id}`);
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return null;
}
