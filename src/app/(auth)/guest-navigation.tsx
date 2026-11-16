"use client";

import { getSession } from "next-auth/react";
import { useEffect } from "react";

export function GuestNavigation() {
  useEffect(() => {
    let active = true;

    async function checkSession() {
      const session = await getSession({ broadcast: false });
      if (active && session?.user) window.location.replace("/dashboard");
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) void checkSession();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void checkSession();
    }

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
