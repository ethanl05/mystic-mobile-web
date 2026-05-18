import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { PageBackButton } from "@/components/page-back-button";

export const metadata: Metadata = {
  title: "玄枢",
  description: "传统文化视角下的八字排盘与易经数字卦"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="mobile-frame">
          <PageBackButton />
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
