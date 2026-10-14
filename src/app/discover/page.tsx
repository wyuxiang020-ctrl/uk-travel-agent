import { Suspense } from "react";
import type { Metadata } from "next";
import TravelDiscovery from "@/components/travel-discovery";
import JourneyLoading from "@/components/journey-loading";

export const metadata: Metadata = {
  title: "发现英国故事 · Slowtrail 欧洲慢游",
  description: "从一个故事开始，在伦敦、牛津与巴斯寻找值得停下的地方。",
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<JourneyLoading />}>
      <TravelDiscovery />
    </Suspense>
  );
}
