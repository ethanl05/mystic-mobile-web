"use client";

import { useRef, useState } from "react";
import { buildSharePosterTitle, createSharePoster, type SharePosterInput } from "@/features/share/share-poster";

type ShareStatus = "idle" | "loading" | "done" | "error";

export function SharePosterButton({ data }: { data: SharePosterInput }) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const timerRef = useRef<number | null>(null);

  async function sharePoster() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage("");
    if (timerRef.current) window.clearTimeout(timerRef.current);

    try {
      const posterData = { ...data, url: data.url || window.location.href } as SharePosterInput;
      const file = await createSharePoster(posterData);
      const title = buildSharePosterTitle(data);

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, files: [file] });
      } else {
        downloadFile(file);
      }

      setStatus("done");
      timerRef.current = window.setTimeout(() => setStatus("idle"), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
      setErrorMessage("分享图生成失败");
      timerRef.current = window.setTimeout(() => {
        setStatus("idle");
        setErrorMessage("");
      }, 2600);
    }
  }

  const label = status === "loading" ? "生成中..." : status === "done" ? "已生成" : "一键分享";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.25rem] z-30 px-4">
      <div className="mx-auto flex max-w-[430px] flex-col items-center">
        {errorMessage ? (
          <div className="mb-2 w-full max-w-[18rem] rounded-full border border-[#eadfce] bg-[#fffaf1] px-4 py-2 text-center text-xs font-black text-[#8f2f24] shadow-[0_10px_24px_rgba(75,48,27,0.10)]">
            {errorMessage}
          </div>
        ) : null}
        <button
          className="pointer-events-auto flex min-h-12 w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-full border border-[#d2a36e] bg-gradient-to-b from-[#a43a30] to-[#7c241e] px-5 text-base font-black text-[#fffaf1] shadow-[0_14px_30px_rgba(143,47,36,0.28)] transition active:scale-[0.985] disabled:opacity-70"
          disabled={status === "loading"}
          onClick={sharePoster}
        >
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fffaf1]/16">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M5.8 17.2C7.7 11.1 12.2 8.3 18.4 8.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
              <path d="M15.2 4.9 19.4 8.3 15.2 11.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
            </svg>
          </span>
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
