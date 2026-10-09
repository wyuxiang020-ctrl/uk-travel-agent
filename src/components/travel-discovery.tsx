"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Map as MapIcon, Plus } from "lucide-react";
import { PLACE_STORIES } from "@/data/place-stories";
import { TRAVEL_PLACES } from "@/data/travel-catalog";
import { CITIES } from "@/lib/demo-trip";
import type { SupportedCity } from "@/lib/travel-types";
import { usePlannerDraft } from "@/components/planner-context";
import { PlaceEvidence } from "@/components/place-evidence";
import DiscoveryMap from "@/components/discovery-map";
import PhotoCredits from "@/components/photo-credits";
import "./travel-discovery.css";

const STORIES = PLACE_STORIES.flatMap((story, index) => {
  const place = TRAVEL_PLACES.find((item) => item.id === story.placeId);
  return place ? [{ ...story, place, number: index + 1 }] : [];
});

type Story = (typeof STORIES)[number];

export default function TravelDiscovery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, setDraft } = usePlannerDraft();
  const requestedStory = STORIES.find((story) => story.id === searchParams.get("story"));
  const requestedCity = searchParams.get("city");
  const city: SupportedCity | "all" = requestedCity === "all"
    ? "all"
    : requestedStory?.city ?? CITIES.find((item) => item.id === requestedCity)?.id ?? "london";
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(requestedStory?.id ?? null);
  const [mobileView, setMobileView] = useState<"stories" | "map">("stories");
  const [planningNotice, setPlanningNotice] = useState<string | null>(null);
  const storyRefs = useRef(new Map<string, HTMLElement>());
  const initialStoryHandled = useRef(false);
  const filtered = city === "all" ? STORIES : STORIES.filter((story) => story.city === city);
  const selected = filtered.find((story) => story.id === searchParams.get("story")) ?? filtered[0];
  const mapPlaces = filtered.map((story) => ({ id: story.id, name: story.place.name, number: story.number, position: story.place.position }));

  useEffect(() => {
    if (initialStoryHandled.current) return;
    const requested = searchParams.get("story");
    if (!requested || !STORIES.some((story) => story.id === requested)) {
      initialStoryHandled.current = true;
      return;
    }
    const frame = requestAnimationFrame(() => {
      storyRefs.current.get(requested)?.scrollIntoView({ behavior: "auto", block: "start" });
      initialStoryHandled.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [searchParams]);

  function selectStory(id: string, scroll = false) {
    setExpandedStoryId(id);
    router.replace(`/discover?city=${city}&story=${encodeURIComponent(id)}`, { scroll: false });
    if (scroll && window.matchMedia("(min-width: 901px)").matches) {
      storyRefs.current.get(id)?.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  }

  function filterCity(nextCity: SupportedCity | "all") {
    setExpandedStoryId(null);
    const first = nextCity === "all" ? STORIES[0] : STORIES.find((story) => story.city === nextCity);
    if (first) router.replace(`/discover?city=${nextCity}&story=${first.id}`, { scroll: false });
  }

  function readSelectedStory() {
    setMobileView("stories");
    if (!selected) return;
    setExpandedStoryId(selected.id);
    requestAnimationFrame(() => {
      const article = storyRefs.current.get(selected.id);
      article?.scrollIntoView({ behavior: "auto", block: "start" });
      article?.querySelector<HTMLButtonElement>(".discovery-story__open")?.focus({ preventScroll: true });
    });
  }

  function startPlanning(story: Story) {
    const inspiration = `${story.place.name}（${story.title}）`;
    const mustVisit = draft.mustVisit.includes(story.place.name)
      ? draft.mustVisit
      : [draft.mustVisit.trim(), inspiration].filter(Boolean).join("\n");
    if (mustVisit.length > 1000) {
      setPlanningNotice(story.id);
      return;
    }
    const cities = draft.cities.includes(story.city) ? draft.cities : [...draft.cities, story.city];
    setDraft({
      ...draft,
      cities,
      startCity: cities.includes(draft.startCity) ? draft.startCity : cities[0],
      endCity: cities.includes(draft.endCity) ? draft.endCity : cities[cities.length - 1],
      idea: draft.idea.trim() ? draft.idea : `我想从${story.place.name}开始探索。${story.summary}`,
      mustVisit,
    });
    router.push("/plan");
  }

  return (
    <div className="discovery-page">
      <a className="skip-link" href="#discovery-main">跳到旅行故事</a>
      <header className="discovery-header">
        <Link className="discovery-brand" href="/" aria-label="英伦慢游首页">
          <strong>英伦慢游</strong>
        </Link>
        <nav aria-label="主导航">
          <Link href="/plan">计划旅行</Link>
          <Link href="/discover" aria-current="page">发现旅行</Link>
        </nav>
      </header>

      <main id="discovery-main" tabIndex={-1}>
        <section className="discovery-intro">
          <h1>发现值得停留的地方</h1>
        </section>

        <div className="discovery-filterbar">
          <div className="discovery-city-filters" role="group" aria-label="按城市浏览故事">
            {CITIES.map((item) => <button key={item.id} type="button" aria-pressed={city === item.id} onClick={() => filterCity(item.id)}>{item.name}</button>)}
            <button type="button" aria-pressed={city === "all"} onClick={() => filterCity("all")}>全部</button>
          </div>
          <div className="discovery-view-switch" role="group" aria-label="浏览方式">
            <button type="button" aria-pressed={mobileView === "stories"} onClick={() => setMobileView("stories")}><BookOpen size={15} /> 故事</button>
            <button type="button" aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}><MapIcon size={15} /> 地图</button>
          </div>
        </div>

        <div className={`discovery-workspace discovery-workspace--${mobileView}`}>
          <section className="discovery-stories" aria-label="地点故事列表">
            {filtered.map((story) => {
              const isSelected = selected?.id === story.id;
              const isExpanded = expandedStoryId === story.id;
              const storySources = story.place.sources.filter((source) => story.sourceIds.includes(source.id));
              return (
                <article className={`discovery-story ${isSelected ? "discovery-story--selected" : ""}`} key={story.id} id={`story-${story.id}`} ref={(element) => { if (element) storyRefs.current.set(story.id, element); else storyRefs.current.delete(story.id); }}>
                  <button className="discovery-story__open" type="button" aria-expanded={isExpanded} aria-controls={`story-content-${story.id}`} onClick={() => { if (isExpanded) setExpandedStoryId(null); else selectStory(story.id); }}>
                    <span className="discovery-story__image">
                      <Image src={story.image.src} alt={story.image.alt} fill sizes="(max-width: 600px) 90vw, (max-width: 900px) 40vw, 25vw" />
                      <span className="discovery-story__number">{String(story.number).padStart(2, "0")}</span>
                      <span className="discovery-story__image-caption">{story.image.caption}</span>
                    </span>
                    <span className="discovery-story__copy">
                      <span className="discovery-story__title" role="heading" aria-level={2}>{story.title}</span>
                      <span className="discovery-story__read">{isExpanded ? "收起故事" : "阅读故事"}{isExpanded ? <ArrowDown size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}</span>
                    </span>
                  </button>
                  <div id={`story-content-${story.id}`} className="discovery-story__body" hidden={!isExpanded}>
                    <p className="discovery-story__place">{story.place.name}</p>
                    <div className="discovery-story__prose">{story.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                    <button className="discovery-plan-button" type="button" onClick={() => startPlanning(story)}>带入旅行需求 <ArrowUpRight size={16} aria-hidden="true" /></button>
                    {planningNotice === story.id && <p className="discovery-story__notice" role="status">已有必去地点接近 1000 字，本次灵感尚未带入。<Link href="/plan">先整理旅行需求 <ArrowUpRight size={12} /></Link></p>}
                    <details className="discovery-evidence">
                      <summary>参观资料与来源 <Plus size={17} aria-hidden="true" /></summary>
                      {storySources.length > 0 && <p className="discovery-story__basis">故事依据：{storySources.map((source, index) => <span key={source.id}>{index > 0 ? " · " : ""}<a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={12} aria-hidden="true" /></a></span>)}</p>}
                      <PlaceEvidence place={story.place} />
                    </details>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="discovery-map-panel" aria-label="在地图上发现地点">
            <div className="discovery-map-panel__sticky">
              <DiscoveryMap places={mapPlaces} selectedId={selected?.id ?? null} onSelect={(id) => selectStory(id, true)} />
              {selected && <div className="discovery-map-selection" aria-live="polite">
                <span>{selected.place.name}</span>
                <button type="button" onClick={readSelectedStory}>阅读故事 <ArrowRight size={14} aria-hidden="true" /></button>
              </div>}
              <p className="discovery-map-note">近似位置，仅供浏览。</p>
            </div>
          </aside>
        </div>
      </main>
      <footer className="discovery-footer"><Link href="/">英伦慢游</Link><Link href="/explore">地点资料 <ArrowUpRight size={12} aria-hidden="true" /></Link><details className="discovery-photo-credits"><summary>照片署名</summary><PhotoCredits /></details></footer>
    </div>
  );
}
