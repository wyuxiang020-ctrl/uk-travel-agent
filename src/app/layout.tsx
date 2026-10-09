import type { Metadata } from "next";
import "./globals.css";
import { PlannerProvider } from "@/components/planner-context";

export const metadata: Metadata = {
  title: "英伦慢游 Slowtrail · 旅行，自有节奏",
  description:
    "从一种旅行心情开始，在伦敦、牛津与巴斯发现地点的故事。用地图认识城市，构想属于自己的英国旅行，查阅来源与安排参考。",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <PlannerProvider>{children}</PlannerProvider>
      </body>
    </html>
  );
}
