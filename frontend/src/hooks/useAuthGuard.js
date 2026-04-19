"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function useAuthGuard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      setIsAuthorized(false);
      setIsChecking(false);
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, [router]);

  return { isChecking, isAuthorized };
}