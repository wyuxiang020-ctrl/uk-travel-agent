import type { Metadata } from "next";
import "./globals.css";
import { PlannerProvider } from "@/components/planner-context";

export const metadata: Metadata = {
  title: "Slowtrail · 心随远方",
  description:
    "面向欧洲的旅行灵感与规划体验。当前从英国出发，串联城市和小镇，安排住宿、机场接驳与城际交通查询；逐日景点资料持续完善。",
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
