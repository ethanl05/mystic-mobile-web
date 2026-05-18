"use client";

import { usePathname, useRouter } from "next/navigation";

const topLevelPaths = new Set(["/", "/records", "/me"]);

export function PageBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (topLevelPaths.has(pathname)) return null;

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    if (pathname.startsWith("/bazi")) {
      router.push("/bazi");
      return;
    }

    if (pathname.startsWith("/yijing")) {
      router.push("/yijing");
      return;
    }

    router.push("/");
  }

  return (
    <button aria-label="返回上一页" className="page-back-button" onClick={goBack} type="button">
      <span aria-hidden="true">‹</span>
      返回
    </button>
  );
}
