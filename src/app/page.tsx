"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePlannerDraft } from "@/components/planner-context";
import PhotoCredits from "@/components/photo-credits";
import type { TripDraft } from "@/lib/demo-trip";
import "@/components/editorial-home.css";

type TravelMood = {
  title: string;
  description: string;
  itinerary: string;
  draft: Pick<
    TripDraft,
    "idea" | "cities" | "days" | "startCity" | "endCity" | "interests" | "pace"
  >;
};

const moods: TravelMood[] = [
  {
    title: "随心漫游",
    description: "给河畔散步和街角咖啡，留一个下午。",
    itinerary: "伦敦，3 天，舒缓",
    draft: {
      idea: "想在伦敦待 3 天，沿河散步，逛街区和咖啡馆，给每个下午留一点自由时间。",
      cities: ["london"],
      days: 3,
      startCity: "london",
      endCity: "london",
      interests: ["街区漫步", "美食与咖啡"],
      pace: "relaxed",
    },
  },
  {
    title: "书页与艺术",
    description: "循着画作、书店与学院，走进两座城。",
    itinerary: "伦敦、牛津，5 天，均衡",
    draft: {
      idea: "用 5 天看看伦敦和牛津，喜欢艺术与博物馆、书店和学院建筑，按自己的兴趣慢慢逛。",
      cities: ["london", "oxford"],
      days: 5,
      startCity: "london",
      endCity: "oxford",
      interests: ["艺术与博物馆", "书店与学院"],
      pace: "balanced",
    },
  },
  {
    title: "经典与从容",
    description: "从伦敦到巴斯，让一周的风景慢慢展开。",
    itinerary: "伦敦、牛津、巴斯，7 天，舒缓",
    draft: {
      idea: "想用 7 天游览伦敦、牛津和巴斯，看看历史建筑与街巷，节奏舒缓，不想把每一天排满。",
      cities: ["london", "oxford", "bath"],
      days: 7,
      startCity: "london",
      endCity: "bath",
      interests: ["历史建筑", "街区漫步"],
      pace: "relaxed",
    },
  },
];

const stories = [
  {
    id: "london-south-bank",
    city: "伦敦",
    title: "把一座城，交给一条河",
    image: "/images/london.jpg",
    alt: "伦敦城市印象：泰晤士河畔的威斯敏斯特宫与大本钟",
  },
  {
    id: "oxford-bodleian",
    city: "牛津",
    title: "在书页之外，读一座城",
    image: "/images/oxford.jpg",
    alt: "牛津城市印象：拉德克利夫书馆的建筑外观",
  },
  {
    id: "bath-roman-baths",
    city: "巴斯",
    title: "在温泉旁，与往昔相遇",
    image: "/images/bath.jpg",
    alt: "巴斯城市印象：罗马浴场的水池与周围建筑",
  },
];

export default function Home() {
  const router = useRouter();
  const { draft, setDraft } = usePlannerDraft();
  const [idea, setIdea] = useState(draft.idea);
  const [inputError, setInputError] = useState(false);
  const [dialog, setDialog] = useState<"plan" | "credits" | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && element && !element.open) element.showModal();
    if (!dialog && element?.open) element.close();
    if (!dialog) return;
    if (dialog === "plan") inputRef.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [dialog]);

  function openPlan() {
    setInputError(false);
    setDialog("plan");
  }

  function submitIdea(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idea.trim()) {
      setInputError(true);
      inputRef.current?.focus();
      return;
    }
    setInputError(false);
    setDraft((previous) => ({ ...previous, idea: idea.trim() }));
    setDialog(null);
    router.push("/plan");
  }

  function chooseMood(mood: TravelMood) {
    setDraft((previous) => ({
      ...previous,
      ...mood.draft,
      cities: [...mood.draft.cities],
      interests: [...mood.draft.interests],
    }));
    router.push("/plan");
  }

  return (
    <div className="editorial-home">
      <a className="skip-link" href="#main">跳到主要内容</a>
      <header className="ed-header">
        <Link href="/" className="ed-brand" aria-label="英伦慢游首页">
          英伦慢游<small>SLOWTRAIL</small>
        </Link>
        <nav className="ed-navigation" aria-label="主导航">
          <Link href="/discover">发现旅行</Link>
          <button type="button" onClick={openPlan}>计划旅行</button>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="ed-hero" aria-labelledby="ed-hero-title">
          <Image
            className="ed-hero-image"
            src="/images/london.jpg"
            alt="泰晤士河、威斯敏斯特宫与大本钟构成的伦敦河畔风景"
            fill
            sizes="100vw"
            priority
          />
          <div className="ed-hero-shade" aria-hidden="true" />
          <div className="ed-hero-content">
            <h1 id="ed-hero-title">旅行，<wbr />自有节奏。</h1>
            <p>在英国，给喜欢的生活留一点时间。</p>
            <div className="ed-hero-actions">
              <button className="ed-button ed-button-paper" type="button" onClick={openPlan}>
                计划我的旅行
              </button>
              <Link className="ed-button ed-button-outline" href="/discover">
                发现我的旅行
              </Link>
            </div>
          </div>
          <span className="ed-hero-caption">伦敦 · 泰晤士河畔</span>
        </section>

        <section className="ed-moods ed-shell" aria-labelledby="ed-mood-title">
          <h2 id="ed-mood-title">你想怎样度过？</h2>
          <div className="ed-mood-grid">
            {moods.map((mood) => (
              <button
                className="ed-mood"
                type="button"
                key={mood.title}
                onClick={() => chooseMood(mood)}
                aria-label={`${mood.title}，${mood.itinerary}，带入偏好并开始计划`}
              >
                <span className="ed-mood-title">{mood.title}</span>
                <span className="ed-mood-description">{mood.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ed-stories ed-shell" aria-labelledby="ed-story-title">
          <div className="ed-section-heading">
            <h2 id="ed-story-title">值得停留的地方</h2>
            <Link href="/discover">发现更多</Link>
          </div>
          <div className="ed-story-grid">
            {stories.map((story) => (
              <Link className="ed-story" href={`/discover?story=${story.id}`} key={story.id}>
                <div className="ed-story-photo">
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="(max-width: 640px) 90vw, 30vw"
                  />
                </div>
                <p className="ed-story-city">{story.city} · 城市印象</p>
                <h3>{story.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="ed-footer ed-shell">
        <p>当前行程为示例，尚未接入 AI。</p>
        <nav aria-label="页脚导航">
          <Link href="/plan/example">示例地图</Link>
          <Link href="/explore">资料与检查</Link>
          <button type="button" onClick={() => setDialog("credits")}>照片署名</button>
        </nav>
      </footer>

      <dialog
        ref={dialogRef}
        className="ed-dialog"
        onCancel={() => setDialog(null)}
        onClose={() => setDialog(null)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom
          ) setDialog(null);
        }}
        aria-labelledby="ed-dialog-title"
      >
        <button className="ed-dialog-close" type="button" onClick={() => setDialog(null)} aria-label="关闭对话框">
          <X size={21} aria-hidden="true" />
        </button>
        {dialog === "plan" && (
          <div className="ed-dialog-content">
            <h2 id="ed-dialog-title">从一个想法开始。</h2>
            <p className="ed-dialog-intro">伦敦、牛津与巴斯，3–7 天，按你的心意。</p>
            <form onSubmit={submitIdea}>
              <label htmlFor="travel-idea">我的旅行想法</label>
              <textarea
                ref={inputRef}
                id="travel-idea"
                maxLength={500}
                value={idea}
                onChange={(event) => {
                  setIdea(event.target.value);
                  setInputError(false);
                }}
                placeholder="比如：想去伦敦和牛津，喜欢艺术，也想留点时间散步。"
                aria-invalid={inputError}
                aria-describedby={inputError ? "ed-idea-error ed-input-note" : "ed-input-note"}
                rows={4}
              />
              {inputError && (
                <p className="ed-input-error" id="ed-idea-error" role="alert">先写一点旅行想法，再继续计划。</p>
              )}
              <div className="ed-form-bottom">
                <p id="ed-input-note">下一步确认城市、天数与节奏。</p>
                <button className="ed-button ed-button-dark" type="submit">继续计划</button>
              </div>
            </form>
          </div>
        )}
        {dialog === "credits" && (
          <div className="ed-dialog-content">
            <h2 id="ed-dialog-title">照片署名</h2>
            <p className="ed-dialog-intro">照片来自 Wikimedia Commons，采用裁切展示。</p>
            <PhotoCredits />
          </div>
        )}
      </dialog>
    </div>
  );
}
