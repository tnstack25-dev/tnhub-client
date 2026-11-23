"use client";

import { useQueryClient } from "@tanstack/react-query";
import { clearSessionCache } from "@/lib/auth/client-cache";
import { LoadingOutlined as LoaderCircle } from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { AuthFooter, AuthHeading } from "@/components/auth/auth-ui";

export function GoogleCompletion() {
  const router = useRouter();
  const cache = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void signIn("google-bridge", { redirect: false, callbackUrl: "/dashboard" })
      .then(async (result) => {
        if (!result?.ok || result.error) {
          router.replace("/login?google=failed");
          return;
        }
        await clearSessionCache(cache);
        window.location.replace("/dashboard");
      })
      .catch(() => router.replace("/login?google=unavailable"));
  }, [cache, router]);

  return (
    <>
      <AuthHeading icon={LoaderCircle} title="Đang đăng nhập">
        Đang hoàn tất đăng nhập bằng Google…
      </AuthHeading>
      <AuthFooter />
    </>
  );
}
