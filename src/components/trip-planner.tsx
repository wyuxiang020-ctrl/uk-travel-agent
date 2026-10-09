"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Info,
  List,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Pencil,
  Send,
  SlidersHorizontal,
  TrainFront,
  X,
} from "lucide-react";
import {
  CITIES,
  PLACES,
  DEFAULT_DRAFT,
  buildDemoDays,
  validateDraft,
  type CityId,
  type TripDraft,
  type Place,
} from "@/lib/demo-trip";
import { usePlannerDraft } from "./planner-context";
import ItineraryMap from "./itinerary-map";
import PhotoCredits from "./photo-credits";
import { PlaceEvidence } from "./place-evidence";
import { TRAVEL_PLACES, TRANSFER_REFERENCES } from "@/data/travel-catalog";
import { PLACE_STORIES } from "@/data/place-stories";
import "./planner.css";
import "./journey-refinements.css";

const INTERESTS = [
  "历史建筑",
  "艺术与博物馆",
  "书店与学院",
  "街区漫步",
  "美食与咖啡",
  "自然风景",
];
const PACES = [
  { value: "relaxed", label: "慢慢来", hint: "希望多些自由时间" },
  { value: "balanced", label: "刚刚好", hint: "游览与休息兼顾" },
  { value: "full", label: "多看看", hint: "希望行程丰富一点" },
] as const;
const EXAMPLE_DRAFT: TripDraft = {
  ...DEFAULT_DRAFT,
  idea: "第一次去英国，想用 7 天看看伦敦、牛津和巴斯，喜欢建筑和散步。",
  cities: ["london", "oxford", "bath"],
  interests: ["历史建筑", "街区漫步"],
  days: 7,
  startCity: "london",
  endCity: "bath",
  datesFlexible: true,
};
const cityName = (id: CityId) =>
  CITIES.find((city) => city.id === id)?.name ?? id;
const cityImage = (id: CityId) =>
  CITIES.find((city) => city.id === id)?.image ?? "/images/london.jpg";
const paceName = (value: string) =>
  PACES.find((pace) => pace.value === value)?.label ?? value;

function dateLabel(draft: TripDraft, offset = 0) {
  if (draft.datesFlexible || !draft.startDate) return "日期待定";
  const date = new Date(`${draft.startDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "日期待定";
  date.setUTCDate(date.getUTCDate() + offset);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function Snapshot({ draft }: { draft: TripDraft }) {
  return (
    <dl className="tp-snapshot">
      <div>
        <dt>目的地</dt>
        <dd>{draft.cities.map(cityName).join(" · ")}</dd>
      </div>
      <div>
        <dt>旅行日期</dt>
        <dd>
          {draft.datesFlexible
            ? "尚未确定"
            : `${dateLabel(draft)} — ${dateLabel(draft, draft.days - 1)}`}
        </dd>
      </div>
      <div>
        <dt>天数 / 首尾</dt>
        <dd>
          {draft.days} 天 · {cityName(draft.startCity)} →{" "}
          {cityName(draft.endCity)}
        </dd>
      </div>
      <div>
        <dt>兴趣 / 节奏</dt>
        <dd>
          {draft.interests.join("、") || "暂未选择"} / {paceName(draft.pace)}
        </dd>
      </div>
      <div>
        <dt>必去地点</dt>
        <dd>{draft.mustVisit || "暂未填写"}</dd>
      </div>
      <div>
        <dt>固定安排</dt>
        <dd>{draft.fixedPlans || "暂未填写"}</dd>
      </div>
    </dl>
  );
}

export default function TripPlanner({
  example = false,
}: {
  example?: boolean;
}) {
  const { draft, setDraft } = usePlannerDraft();
  const [step, setStep] = useState<"form" | "review" | "workspace">(
    example ? "workspace" : "form",
  );
  const [activeDraft, setActiveDraft] = useState<TripDraft>(
    example ? EXAMPLE_DRAFT : draft,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preferencesOpen, setPreferencesOpen] = useState(
    Boolean(draft.mustVisit || draft.fixedPlans),
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"itinerary" | "map" | "notes">(
    "itinerary",
  );
  const [dialog, setDialog] = useState<
    "place" | "edit" | "scope" | "credits" | null
  >(null);
  const [editTarget, setEditTarget] = useState<string>("");
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{ target: string; text: string }[]>([]);
  const [noteStatus, setNoteStatus] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const days = useMemo(() => buildDemoDays(activeDraft), [activeDraft]);
  const currentDay = days[dayIndex] ?? days[0];
  const places = currentDay
    ? currentDay.placeIds
        .map((id) => PLACES.find((place) => place.id === id))
        .filter((place): place is Place => Boolean(place))
    : [];
  const selectedPlace =
    places.find((place) => place.id === selectedId) ?? places[0];
  const sourcedPlace = TRAVEL_PLACES.find(
    (place) => place.id === selectedPlace?.id,
  );
  const selectedStory = PLACE_STORIES.find(
    (story) => story.placeId === selectedPlace?.id,
  );
  const currentTransfer = currentDay?.transferFrom
    ? TRANSFER_REFERENCES.find(
        (reference) =>
          (reference.from === currentDay.transferFrom &&
            reference.to === currentDay.city) ||
          (reference.to === currentDay.transferFrom &&
            reference.from === currentDay.city),
      )
    : undefined;
  const mapStops = places.map((place) => ({
    id: place.id,
    name: place.name,
    position:
      TRAVEL_PLACES.find((record) => record.id === place.id)?.position ??
      place.position,
  }));

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && element && !element.open) element.showModal();
    if (!dialog && element?.open) element.close();
    if (dialog) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [dialog]);

  function updateDraft<K extends keyof TripDraft>(key: K, value: TripDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setErrors({});
  }

  function toggleCity(id: CityId) {
    setDraft((previous) => {
      const cities = previous.cities.includes(id)
        ? previous.cities.filter((city) => city !== id)
        : [...previous.cities, id];
      return {
        ...previous,
        cities,
        startCity: cities.includes(previous.startCity)
          ? previous.startCity
          : (cities[0] ?? "london"),
        endCity: cities.includes(previous.endCity)
          ? previous.endCity
          : (cities.at(-1) ?? "london"),
      };
    });
    setErrors({});
  }

  function confirmDraft(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateDraft(draft);
    setErrors(validation);
    if (Object.keys(validation).length) {
      if (["interests", "pace", "mustVisit", "fixedPlans"].some((key) => validation[key]))
        setPreferencesOpen(true);
      requestAnimationFrame(() =>
        document.getElementById(`tp-${Object.keys(validation)[0]}`)?.focus(),
      );
      return;
    }
    setStep("review");
  }

  function openWorkspace() {
    setActiveDraft({
      ...draft,
      cities: [...draft.cities],
      interests: [...draft.interests],
    });
    setDayIndex(0);
    setSelectedId(null);
    setNoteStatus("");
    setMobilePanel("itinerary");
    setStep("workspace");
  }

  function editRequirements() {
    setDraft({
      ...activeDraft,
      cities: [...activeDraft.cities],
      interests: [...activeDraft.interests],
    });
    setStep("form");
  }

  function openEdit(target: string) {
    setEditTarget(target);
    setEditText("");
    setEditError("");
    setDialog("edit");
  }

  function recordNote(text: string, target: string) {
    if (!text.trim()) {
      setNoteStatus("先写下你想调整的内容。");
      return false;
    }
    setNotes((previous) => [...previous, { text: text.trim(), target }]);
    setNoteStatus("调整想法已记入本次会话便笺，示例行程未改变。刷新后清空。");
    return true;
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <span id={`tp-${key}-error`} className="tp-field-error">
        {errors[key]}
      </span>
    ) : null;

  return (
    <div
      className={`tp-app ${step === "workspace" ? "tp-workspace-mode" : ""}`}
    >
      <a className="skip-link" href="#tp-main">
        跳到主要内容
      </a>
      <header className="tp-header">
        <Link href="/" className="brand">
          <span className="brand-name">
            英伦慢游<span>SLOWTRAIL</span>
          </span>
        </Link>
        <nav aria-label="规划步骤" className="tp-steps">
          <span aria-current={step === "form" ? "step" : undefined}>
            需求
          </span>
          <span aria-current={step === "review" ? "step" : undefined}>
            确认
          </span>
          <span aria-current={step === "workspace" ? "step" : undefined}>
            示例
          </span>
        </nav>
        <div className="tp-header-actions">
          <Link href="/discover" className="tp-discover-link">
            发现旅行
          </Link>
          <button className="tp-mode-button" onClick={() => setDialog("scope")}>
            示例说明
          </button>
        </div>
      </header>
      <div className="tp-mode-strip">
        <span>
          示例规划 · 尚未接入 AI
        </span>
        <Link href="/explore" className="tp-research-link">
          资料与检查
        </Link>
      </div>

      {step === "form" && (
        <main className="tp-form-layout" id="tp-main">
          <aside className="tp-form-aside">
            <h1 ref={headingRef} tabIndex={-1}>
              计划你的旅行。
            </h1>
            <p>
              从想去的地方，和愿意停留的时间开始。
            </p>
            <div className="tp-aside-photo">
              <Image
                src="/images/oxford.jpg"
                alt="牛津拉德克利夫图书馆"
                fill
                sizes="320px"
                loading="eager"
              />
              <span>牛津</span>
            </div>
            <Link href="/" className="tp-back-link">
              <ArrowLeft size={14} />
              返回首页
            </Link>
          </aside>
          <form className="tp-form" onSubmit={confirmDraft} noValidate>
            <div className="tp-form-intro">
              <p>填写基本想法，下一步确认。刷新后清空。</p>
            </div>
            {Object.keys(errors).length > 0 && (
              <div role="alert" className="tp-errors">
                <strong>还有几处需要补充：</strong>
                <ul>
                  {Object.entries(errors).map(([key, value]) => (
                    <li key={key}>
                      <a href={`#tp-${key}`}>{value}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="tp-field">
              <label htmlFor="tp-idea">
                期待怎样的旅行？ <span>必填</span>
              </label>
              <textarea
                id="tp-idea"
                rows={3}
                maxLength={500}
                value={draft.idea}
                placeholder="比如：第一次去英国，喜欢艺术，也想有时间坐下来喝杯咖啡。"
                onChange={(event) => updateDraft("idea", event.target.value)}
                aria-invalid={Boolean(errors.idea)}
                aria-describedby={errors.idea ? "tp-idea-error" : undefined}
              />
              {fieldError("idea")}
              <small>
                想法会原样保留，城市和天数请在下方选择。
              </small>
            </div>
            <fieldset
              className="tp-fieldset"
              id="tp-cities"
              tabIndex={-1}
              aria-describedby={
                errors.cities ? "tp-cities-error" : "tp-cities-hint"
              }
            >
              <legend>
                目的地
              </legend>
              <p id="tp-cities-hint">支持以下三城，可多选。</p>
              <div className="tp-city-options">
                {CITIES.map((city) => (
                  <label
                    className={
                      draft.cities.includes(city.id) ? "is-selected" : ""
                    }
                    key={city.id}
                  >
                    <input
                      type="checkbox"
                      checked={draft.cities.includes(city.id)}
                      onChange={() => toggleCity(city.id)}
                    />
                    <span>{city.name}</span>
                    <span className="tp-option-check">
                      {draft.cities.includes(city.id) && <Check size={13} />}
                    </span>
                  </label>
                ))}
              </div>
              {fieldError("cities")}
            </fieldset>
            <fieldset className="tp-fieldset">
              <legend>
                日期与行程
              </legend>
              <div className="tp-field-grid">
                <div className="tp-field">
                  <label htmlFor="tp-days">旅行天数</label>
                  <select
                    id="tp-days"
                    value={draft.days}
                    onChange={(event) =>
                      updateDraft("days", Number(event.target.value))
                    }
                    aria-invalid={Boolean(errors.days)}
                    aria-describedby={errors.days ? "tp-days-error" : undefined}
                  >
                    {[3, 4, 5, 6, 7].map((day) => (
                      <option value={day} key={day}>
                        {day} 天
                      </option>
                    ))}
                  </select>
                  {fieldError("days")}
                </div>
                <div className="tp-field">
                  <label htmlFor="tp-startDate">出发日期</label>
                  <input
                    id="tp-startDate"
                    type="date"
                    disabled={draft.datesFlexible}
                    value={draft.startDate}
                    onChange={(event) =>
                      updateDraft("startDate", event.target.value)
                    }
                    aria-invalid={Boolean(errors.startDate)}
                    aria-describedby={
                      errors.startDate ? "tp-startDate-error" : undefined
                    }
                  />
                  {fieldError("startDate")}
                  <label className="tp-inline-check">
                    <input
                      type="checkbox"
                      checked={draft.datesFlexible}
                      onChange={(event) =>
                        updateDraft("datesFlexible", event.target.checked)
                      }
                    />
                    日期还没确定
                  </label>
                </div>
                <div className="tp-field">
                  <label htmlFor="tp-startCity">从哪座城市开始</label>
                  <select
                    id="tp-startCity"
                    value={draft.startCity}
                    onChange={(event) =>
                      updateDraft("startCity", event.target.value as CityId)
                    }
                    disabled={!draft.cities.length}
                  >
                    {draft.cities.map((id) => (
                      <option key={id} value={id}>
                        {cityName(id)}
                      </option>
                    ))}
                  </select>
                  {fieldError("startCity")}
                </div>
                <div className="tp-field">
                  <label htmlFor="tp-endCity">在哪座城市结束</label>
                  <select
                    id="tp-endCity"
                    value={draft.endCity}
                    onChange={(event) =>
                      updateDraft("endCity", event.target.value as CityId)
                    }
                    disabled={!draft.cities.length}
                  >
                    {draft.cities.map((id) => (
                      <option key={id} value={id}>
                        {cityName(id)}
                      </option>
                    ))}
                  </select>
                  {fieldError("endCity")}
                </div>
              </div>
              <p>城市首尾仅指英国境内行程。</p>
            </fieldset>
            <details
              className="tp-preferences"
              open={preferencesOpen}
              onToggle={(event) => setPreferencesOpen(event.currentTarget.open)}
            >
              <summary>偏好与特别安排 <span>选填</span></summary>
            <fieldset className="tp-fieldset">
              <legend>
                旅行方式
              </legend>
              <span className="tp-field-label">
                兴趣 <small>可多选</small>
              </span>
              <div className="tp-interest-options" id="tp-interests" tabIndex={-1}>
                {INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className={
                      draft.interests.includes(interest) ? "is-selected" : ""
                    }
                  >
                    <input
                      type="checkbox"
                      checked={draft.interests.includes(interest)}
                      onChange={() =>
                        updateDraft(
                          "interests",
                          draft.interests.includes(interest)
                            ? draft.interests.filter(
                                (item) => item !== interest,
                              )
                            : [...draft.interests, interest],
                        )
                      }
                    />
                    {interest}
                  </label>
                ))}
              </div>
              <span className="tp-field-label">行程节奏</span>
              <div className="tp-pace-options" id="tp-pace" tabIndex={-1}>
                {PACES.map((pace) => (
                  <label
                    key={pace.value}
                    className={draft.pace === pace.value ? "is-selected" : ""}
                  >
                    <input
                      type="radio"
                      name="pace"
                      value={pace.value}
                      checked={draft.pace === pace.value}
                      onChange={() => updateDraft("pace", pace.value)}
                    />
                    <span>
                      {pace.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="tp-fieldset">
              <legend>
                特别安排
              </legend>
              <div className="tp-field">
                <label htmlFor="tp-mustVisit">
                  必去地点 <span>选填</span>
                </label>
                <textarea
                  id="tp-mustVisit"
                  rows={2}
                  maxLength={1000}
                  value={draft.mustVisit}
                  onChange={(event) =>
                    updateDraft("mustVisit", event.target.value)
                  }
                  placeholder="比如：大英博物馆、牛津的书店……"
                />
              </div>
              <div className="tp-field">
                <label htmlFor="tp-fixedPlans">
                  固定安排 <span>选填</span>
                </label>
                <textarea
                  id="tp-fixedPlans"
                  rows={2}
                  maxLength={1000}
                  value={draft.fixedPlans}
                  onChange={(event) =>
                    updateDraft("fixedPlans", event.target.value)
                  }
                  placeholder="比如：第 3 天下午有一场已约好的活动。"
                />
                <small>
                  仅记录需求，不执行锁定。时间冲突可在“资料与检查”中另行检查。
                </small>
              </div>
            </fieldset>
            </details>
            <div className="tp-form-actions">
              <button type="submit" className="primary-button">
                继续，确认条件 <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </main>
      )}

      {step === "review" && (
        <main id="tp-main" className="tp-review">
          <div className="tp-review-title">
            <h1 ref={headingRef} tabIndex={-1}>
              确认你的旅行。
            </h1>
            <p>先核对你的条件，再打开交互示例。</p>
          </div>
          <div className="tp-review-card">
            <div className="tp-review-top">
              <span>
                <Check size={16} />
                条件已填写
              </span>
              <button onClick={() => setStep("form")}>
                <Pencil size={14} />
                返回修改
              </button>
            </div>
            <blockquote>{draft.idea}</blockquote>
            <Snapshot draft={draft} />
            <div className="tp-boundary">
              <Info size={19} />
              <div>
                <strong>接下来看到的是什么？</strong>
                <p>
                  接下来是按城市和天数组合的固定示例，可能重复地点。偏好与特别安排仅保留展示，尚不参与编排。
                </p>
                <p>
                  未调用 AI 或自动检查；可另行打开“资料与检查”。
                </p>
              </div>
            </div>
            <div className="tp-review-actions">
              <button className="tp-secondary" onClick={() => setStep("form")}>
                <ArrowLeft size={15} />
                再改一改
              </button>
              <button className="primary-button" onClick={openWorkspace}>
                打开 {draft.days} 天交互示例 <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </main>
      )}

      {step === "workspace" && currentDay && (
        <main id="tp-main" className="tp-workspace">
          <div className="tp-workspace-heading">
            <div>
              <h1 ref={headingRef} tabIndex={-1}>
                {activeDraft.days} 天英国旅行
              </h1>
              <p>
                <MapPin size={13} />
                {activeDraft.cities.map(cityName).join(" · ")}
                <span> / </span>
                <CalendarDays size={13} />
                {activeDraft.datesFlexible
                  ? "日期待定"
                  : `${dateLabel(activeDraft)}出发`}
                <span className="tp-outline-badge">固定示例</span>
              </p>
            </div>
            <button className="tp-secondary" onClick={editRequirements}>
              <SlidersHorizontal size={15} />
              修改需求
            </button>
          </div>
          <div className="tp-mobile-tabs" role="group" aria-label="工作区视图">
            {[
              { id: "itinerary", label: "逐日行程", icon: List },
              { id: "map", label: "地图与地点", icon: MapIcon },
              { id: "notes", label: "需求与调整", icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                aria-pressed={mobilePanel === id}
                onClick={() => {
                  setMobilePanel(id as typeof mobilePanel);
                  if (id === "notes") setNotesOpen(true);
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <div className={`tp-workspace-grid tp-show-${mobilePanel}`}>
            <aside className="tp-notes-panel">
              <details
                className="tp-notes-wrap"
                open={notesOpen}
                onToggle={(event) => setNotesOpen(event.currentTarget.open)}
              >
                <summary>
                  旅行需求与调整便笺 <ChevronRight size={15} />
                </summary>
                <p className="tp-original-idea">{activeDraft.idea}</p>
                <Snapshot draft={activeDraft} />
              <p className="tp-note-status">
                便笺仅记录想法，不改变行程；刷新后清空。
              </p>
              <div className="tp-notes-history" aria-label="本次调整便笺">
                {notes.map((note, index) => (
                  <div className="tp-user-note" key={index}>
                    <small>{note.target}</small>
                    <p>{note.text}</p>
                    <span>仅记录 · 尚未执行</span>
                  </div>
                ))}
              </div>
              <form
                className="tp-note-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (recordNote(noteText, "整体行程")) setNoteText("");
                }}
              >
                <label htmlFor="tp-note-input">写下你的调整想法</label>
                <textarea
                  id="tp-note-input"
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="比如：想给牛津多留一点时间……"
                />
                <div>
                  <span>不会调用 AI</span>
                  <button type="submit" aria-label="记录调整想法">
                    <Send size={16} />
                  </button>
                </div>
              </form>
              <p className="tp-note-status" role="status">
                {noteStatus}
              </p>
              </details>
            </aside>
            <section
              className="tp-itinerary-panel"
              aria-labelledby="tp-itinerary-title"
            >
              <div className="tp-panel-title">
                <h2 id="tp-itinerary-title">逐日行程</h2>
              </div>
              <div
                className="tp-day-tabs"
                role="group"
                aria-label="选择行程日期"
              >
                {days.map((day, index) => (
                  <button
                    key={day.day}
                    aria-pressed={index === dayIndex}
                    onClick={() => {
                      setDayIndex(index);
                      setSelectedId(null);
                    }}
                  >
                    <span>第 {day.day} 天</span>
                    <strong>{cityName(day.city)}</strong>
                  </button>
                ))}
              </div>
              <div className="tp-day-cover">
                <Image
                  src={cityImage(currentDay.city)}
                  alt={`${cityName(currentDay.city)}城市风景`}
                  fill
                  sizes="(max-width: 760px) 100vw, 480px"
                  loading="eager"
                />
                <div>
                  <span>
                    第 {currentDay.day} 天 ·{" "}
                    {dateLabel(activeDraft, currentDay.day - 1)}
                  </span>
                  <h3>{currentDay.title}</h3>
                </div>
              </div>
              <div className="tp-day-caption">
                <span>{places.length} 个地点</span>
                <button
                  onClick={() =>
                    openEdit(
                      `第 ${currentDay.day} 天 · ${cityName(currentDay.city)}`,
                    )
                  }
                >
                  <Pencil size={13} />
                  调整这一天
                </button>
              </div>
              {currentDay.transferFrom && (
                <div className="tp-transfer">
                  <TrainFront size={20} />
                  <div>
                    <strong>
                      {cityName(currentDay.transferFrom)} →{" "}
                      {cityName(currentDay.city)}
                    </strong>
                    <p>
                      {currentTransfer
                        ? `转场建议预留 ${currentTransfer.planningRideMinutes + currentTransfer.bufferMinutes} 分钟（项目估算，含缓冲 ${currentTransfer.bufferMinutes} 分钟）。示例尚未分配具体时段。`
                        : "转场参考暂缺，请单独核对。"}
                    </p>
                    <Link href="/explore">
                      查看交通依据与安排检查 <ArrowUpRight size={12} />
                    </Link>
                  </div>
                  <span>估算</span>
                </div>
              )}
              <div className="tp-place-list">
                {places.map((place, index) => (
                  <article
                    className={`tp-place-card ${selectedPlace?.id === place.id ? "is-selected" : ""}`}
                    key={place.id}
                  >
                    <button
                      className="tp-select-place"
                      onClick={() => setSelectedId(place.id)}
                      aria-pressed={selectedPlace?.id === place.id}
                    >
                      <span className="tp-place-order">{index + 1}</span>
                      <div>
                        <h3>{place.name}</h3>
                        <span className="tp-place-category">{place.category}</span>
                      </div>
                    </button>
                    <div className="tp-card-actions">
                      <button
                        onClick={() => {
                          setSelectedId(place.id);
                          setDialog("place");
                        }}
                      >
                        查看详情 <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="tp-day-nav">
                <button
                  disabled={dayIndex === 0}
                  onClick={() => {
                    setDayIndex(dayIndex - 1);
                    setSelectedId(null);
                  }}
                >
                  <ArrowLeft size={15} />
                  前一天
                </button>
                <span>
                  {dayIndex + 1} / {days.length}
                </span>
                <button
                  disabled={dayIndex === days.length - 1}
                  onClick={() => {
                    setDayIndex(dayIndex + 1);
                    setSelectedId(null);
                  }}
                >
                  后一天
                  <ArrowRight size={15} />
                </button>
              </div>
            </section>
            <aside className="tp-map-panel">
              <div className="tp-panel-title">
                <h2>重点景点</h2>
              </div>
              <div className="tp-map-frame">
                <ItineraryMap
                  stops={mapStops}
                  selectedId={selectedPlace?.id ?? null}
                  onSelect={setSelectedId}
                />
              </div>
              {selectedPlace && (
                <div className="tp-place-peek">
                  <h3>{selectedPlace.name}</h3>
                  <button
                    className="tp-story-link"
                    onClick={() => setDialog("place")}
                  >
                    查看详情
                  </button>
                </div>
              )}
            </aside>
          </div>
        </main>
      )}

      <footer className="tp-footer">
        <span>英伦慢游</span>
        <button type="button" onClick={() => setDialog("credits")}>
          影像署名 <ArrowUpRight size={12} />
        </button>
        <Link href="/">
          返回首页 <ArrowUpRight size={12} />
        </Link>
      </footer>
      <dialog
        ref={dialogRef}
        className="preview-dialog tp-dialog"
        aria-labelledby="tp-dialog-title"
        onCancel={() => setDialog(null)}
        onClose={() => setDialog(null)}
      >
        <button
          className="dialog-close"
          aria-label="关闭弹窗"
          onClick={() => setDialog(null)}
        >
          <X size={20} />
        </button>
        {dialog === "place" && selectedPlace && (
          <div className="dialog-content">
            <span className="tp-outline-badge">地点详情 · 已整理来源</span>
            <h2 id="tp-dialog-title">{selectedPlace.name}</h2>
            <p className="tp-place-english">
              {selectedPlace.english} · {cityName(selectedPlace.city)}
            </p>
            <div className="tp-detail-photo">
              <Image
                src={cityImage(selectedPlace.city)}
                alt={`${cityName(selectedPlace.city)}城市氛围图，非当前地点实景`}
                fill
                sizes="550px"
              />
              <small>城市氛围图 · 非当前地点实景</small>
            </div>
            {selectedStory ? (
              <section className="tp-place-story" aria-label="地点故事">
                <span>{selectedStory.kicker}</span>
                <h3>{selectedStory.title}</h3>
                {selectedStory.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <Link className="tp-story-link" href={`/discover?story=${selectedStory.id}`}>
                  在发现地图中阅读 <ArrowUpRight size={14} />
                </Link>
              </section>
            ) : <p>{sourcedPlace?.description ?? selectedPlace.description}</p>}
            {sourcedPlace ? (
              <PlaceEvidence place={sourcedPlace} />
            ) : (
              <p className="tp-detail-caution">该地点资料缺失，请单独核对。</p>
            )}
            <button
              className="primary-button"
              onClick={() => openEdit(selectedPlace.name)}
            >
              写下调整想法 <Pencil size={16} />
            </button>
          </div>
        )}
        {dialog === "edit" && (
          <form
            className="dialog-content"
            onSubmit={(event) => {
              event.preventDefault();
              if (!editText.trim()) {
                setEditError("先写下你想调整的内容，不能只输入空格。");
                document.getElementById("tp-edit-text")?.focus();
                return;
              }
              if (recordNote(editText, editTarget)) {
                setDialog(null);
                setMobilePanel("notes");
                setNotesOpen(true);
              }
            }}
          >
            <span className="tp-outline-badge">调整入口 · 尚未执行修改</span>
            <h2 id="tp-dialog-title">想让这里有什么不同？</h2>
            <p className="tp-edit-target">调整对象：{editTarget}</p>
            <div className="tp-edit-suggestions">
              {["换一个同类地点", "减少当天的地点", "这个安排希望保留"].map(
                (text) => (
                  <button
                    type="button"
                    key={text}
                    onClick={() => {
                      setEditText(text);
                      setEditError("");
                    }}
                  >
                    {text}
                  </button>
                ),
              )}
            </div>
            <label htmlFor="tp-edit-text">你的调整想法</label>
            <textarea
              id="tp-edit-text"
              rows={4}
              value={editText}
              onChange={(event) => {
                setEditText(event.target.value);
                setEditError("");
              }}
              maxLength={1000}
              required
              aria-invalid={Boolean(editError)}
              aria-describedby={editError ? "tp-edit-error" : undefined}
              placeholder="写下希望发生的改变……"
            />
            {editError && (
              <p id="tp-edit-error" className="tp-field-error" role="alert">
                {editError}
              </p>
            )}
            <p className="tp-detail-caution">
              提交只会写入本次会话便笺。替换、锁定、撤销和保存尚未接入，当前示例不会改变。
            </p>
            <button className="primary-button" type="submit">
              记入旅行便笺 <ArrowRight size={16} />
            </button>
          </form>
        )}
        {dialog === "credits" && (
          <div className="dialog-content">
            <span className="eyebrow">BEHIND THE VIEW</span>
            <h2 id="tp-dialog-title">影像来源与许可</h2>
            <p>
              照片来自 Wikimedia
              Commons，版面采用裁切展示。地点详情使用城市氛围图，不代表当前地点实景。
            </p>
            <PhotoCredits />
          </div>
        )}
        {dialog === "scope" && (
          <div className="dialog-content">
            <span className="eyebrow">A CLEAR PICTURE</span>
            <h2 id="tp-dialog-title">现在可以体验什么？</h2>
            <ul className="tp-scope-list">
              <li>
                <Check size={16} />
                填写并确认旅行条件
              </li>
              <li>
                <Check size={16} />
                浏览 3–7 天的固定示例组合
              </li>
              <li>
                <Check size={16} />
                选择地点、联动地图、查看详情
              </li>
              <li>
                <Check size={16} />
                记录本次会话的调整想法
              </li>
            </ul>
            <p>
              示例仅根据城市、首尾和天数组合，不会根据兴趣等条件真正生成。现在可以查询已整理的三城资料和交通参考，并在“资料与检查”中手动填写一天的安排，检查时间重叠、固定安排冲突和城际转场。没有模型调用，也不会自动解析自由文本。
            </p>
            <p className="tp-detail-caution">
              没有账号、预订、实际锁定或版本恢复。刷新后需求与便笺会清空。示例入口将重新打开预设的七天展示。
            </p>
            <button className="primary-button" onClick={() => setDialog(null)}>
              了解，继续体验 <Check size={15} />
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
