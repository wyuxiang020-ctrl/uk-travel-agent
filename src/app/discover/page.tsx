import { Suspense } from "react";
import type { Metadata } from "next";
import TravelDiscovery from "@/components/travel-discovery";

export const metadata: Metadata = {
  title: "发现我的旅行 · 英伦慢游 Slowtrail",
  description: "从一个故事开始，在伦敦、牛津与巴斯寻找值得停下的地方。",
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<main className="discovery-loading">正在展开旅行故事…</main>}>
      <TravelDiscovery />
    </Suspense>
  );
}
