"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  Plus,
  Route,
  Search,
  TrainFront,
  Trash2,
} from "lucide-react";
import { CITIES } from "@/lib/demo-trip";
import { PLACE_STORIES } from "@/data/place-stories";
import type {
  CheckDayInput,
  CheckDayResult,
  FixedArrangement,
  ScheduleVisit,
  SupportedCity,
  ToolResult,
  TransferReference,
  TravelPlace,
} from "@/lib/travel-types";
import { PlaceEvidence, TransferEvidence } from "./place-evidence";
import "./travel-research.css";
import "./journey-refinements.css";

async function callTool<T>(
  tool: string,
  input: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool, input }),
      signal,
    });
  } catch (reason) {
    if (signal?.aborted) throw reason;
    throw new Error("无法连接资料服务，请检查本地服务是否运行，然后重试。");
  }
  let result: ToolResult<T>;
  try {
    result = await response.json();
  } catch {
    throw new Error("服务未返回可识别的资料，请重试。");
  }
  if (!result.ok) throw new Error(result.error.message);
  if (!response.ok) throw new Error("资料服务暂时不可用，请稍后重试。");
  return result.data;
}

const cityName = (id: string) =>
  CITIES.find((city) => city.id === id)?.name ?? id;
const initialVisits: ScheduleVisit[] = [
  { id: "visit-1", placeId: "london-big-ben", start: "10:00", end: "11:00" },
  {
    id: "visit-2",
    placeId: "london-british-museum",
    start: "12:00",
    end: "14:00",
  },
];

function CitySelect({
  value,
  onChange,
  id,
  all = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  all?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {all && <option value="">全部城市</option>}
      {CITIES.map((city) => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  );
}

export default function TravelResearch() {
  const [view, setView] = useState<"places" | "transfers" | "check">("places");
  const [catalog, setCatalog] = useState<TravelPlace[]>([]);
  const [results, setResults] = useState<TravelPlace[]>([]);
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TravelPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [reload, setReload] = useState(0);
  const querySequence = useRef(0);
  const detailSequence = useRef(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const [fromCity, setFromCity] = useState<SupportedCity>("london");
  const [toCity, setToCity] = useState<SupportedCity>("oxford");
  const [transfer, setTransfer] = useState<TransferReference | null>(null);
  const [transferError, setTransferError] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [checkedPair, setCheckedPair] = useState("");
  const selectedStory = PLACE_STORIES.find((story) => story.placeId === selected?.id);

  useEffect(() => {
    const controller = new AbortController();
    callTool<TravelPlace[]>("list_places", {}, controller.signal)
      .then((places) => {
        setCatalog(places);
        setResults(places);
        setLoading(false);
        setError("");
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "资料未能载入。");
        setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  async function searchPlaces(event: React.FormEvent) {
    event.preventDefault();
    const sequence = ++querySequence.current;
    setLoading(true);
    setError("");
    setSelected(null);
    setDetailError("");
    setDetailLoading(false);
    ++detailSequence.current;
    try {
      const places = await callTool<TravelPlace[]>("list_places", {
        ...(city ? { city } : {}),
        ...(query.trim() ? { query: query.trim() } : {}),
      });
      if (sequence === querySequence.current) setResults(places);
    } catch (reason) {
      if (sequence === querySequence.current)
        setError(
          reason instanceof Error ? reason.message : "查询失败，请重试。",
        );
    } finally {
      if (sequence === querySequence.current) setLoading(false);
    }
  }

  async function selectPlace(id: string) {
    const sequence = ++detailSequence.current;
    setDetailLoading(true);
    setDetailError("");
    setSelected(null);
    try {
      const place = await callTool<TravelPlace>("get_place", { id });
      if (sequence !== detailSequence.current) return;
      setSelected(place);
      requestAnimationFrame(() => detailHeading.current?.focus());
    } catch (reason) {
      if (sequence === detailSequence.current)
        setDetailError(
          reason instanceof Error ? reason.message : "地点资料查询失败。",
        );
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false);
    }
  }

  async function lookupTransfer(event: React.FormEvent) {
    event.preventDefault();
    setTransferLoading(true);
    setTransferError("");
    setTransfer(null);
    const label = `${cityName(fromCity)} → ${cityName(toCity)}`;
    try {
      const data = await callTool<TransferReference>("get_transfer", {
        from: fromCity,
        to: toCity,
      });
      setTransfer(data);
      setCheckedPair(label);
    } catch (reason) {
      setTransferError(
        reason instanceof Error ? reason.message : "交通资料查询失败。",
      );
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="tr-app">
      <a className="skip-link" href="#research-main">
        跳到主要内容
      </a>
      <header className="tr-header">
        <Link href="/" className="brand">
          <Route size={27} />
          <span className="brand-name">
            英伦慢游<span>SLOWTRAIL</span>
          </span>
        </Link>
        <nav className="tr-header-nav" aria-label="旅行导航">
          <Link href="/discover">发现我的旅行</Link>
          <Link href="/plan">计划我的旅行 <ArrowRight size={15} /></Link>
        </nav>
      </header>
      <main id="research-main" className="tr-main">
        <div className="tr-intro">
          <p className="eyebrow">DETAILS MAKE ROOM FOR DISCOVERY</p>
          <h1>先了解，再出发。</h1>
          <p>查阅有来源的地点资料，为转场留出时间，提前发现安排中的冲突。</p>
          <div className="tr-chips">
            <span>伦敦 · 牛津 · 巴斯</span>
            <span>{catalog.length || "30"} 个精选地点</span>
            <span>资料核对 · 2026.10.09</span>
          </div>
        </div>
        <nav className="tr-tabs" aria-label="资料与检查">
          <button
            aria-pressed={view === "places"}
            onClick={() => setView("places")}
          >
            <BookOpen size={17} />
            地点资料
          </button>
          <button
            aria-pressed={view === "transfers"}
            onClick={() => setView("transfers")}
          >
            <TrainFront size={17} />
            城市交通
          </button>
          <button
            aria-pressed={view === "check"}
            onClick={() => setView("check")}
          >
            <CheckCircle2 size={17} />
            安排检查
          </button>
        </nav>

        {view === "places" && (
          <section aria-label="地点资料查询">
            <form className="tr-search" onSubmit={searchPlaces}>
              <div>
                <label htmlFor="research-city">选择城市</label>
                <CitySelect
                  id="research-city"
                  value={city}
                  onChange={setCity}
                  all
                />
              </div>
              <div className="tr-search-input">
                <label htmlFor="research-query">地点名称或关键词</label>
                <input
                  id="research-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  maxLength={100}
                  placeholder="比如：博物馆、Bodleian、建筑"
                />
              </div>
              <button className="tr-primary" disabled={loading}>
                <Search size={16} />
                {loading ? "正在查询…" : "查询资料"}
              </button>
            </form>
            <p className="tr-note">
              查询项目内整理的资料，不是实时旅行搜索。开放、门票与预约可能变化，请在出发前查看所附官网。
            </p>
            {error && (
              <div role="alert" className="tr-error">
                {error}
                <button
                  onClick={() => {
                    setCity("");
                    setQuery("");
                    setSelected(null);
                    setLoading(true);
                    setReload((value) => value + 1);
                  }}
                >
                  清空筛选并重新载入
                </button>
              </div>
            )}
            <div className="tr-library-grid">
              <div>
                <p className="tr-result-count" role="status">
                  {loading
                    ? "正在读取资料…"
                    : error
                      ? "查询未完成"
                      : `找到 ${results.length} 个地点`}
                </p>
                {!loading && !error && results.length === 0 && (
                  <div className="tr-empty">
                    没有找到匹配地点。试试其他关键词或切换城市。
                  </div>
                )}
                <div className="tr-place-grid">
                  {!loading &&
                    !error &&
                    results.map((place) => (
                      <button
                        key={place.id}
                        className={`tr-place-card ${selected?.id === place.id ? "is-selected" : ""}`}
                        onClick={() => selectPlace(place.id)}
                        aria-pressed={selected?.id === place.id}
                      >
                        <span>
                          {cityName(place.city)} <span>· {place.category}</span>
                        </span>
                        <h2>{place.name}</h2>
                        <p className="tr-english">{place.english}</p>
                        <p>{place.description}</p>
                        <div>
                          <span>
                            <BookOpen size={12} />
                            {place.sources.length} 个来源
                          </span>
                          <ArrowRight size={17} />
                        </div>
                      </button>
                    ))}
                </div>
              </div>
              <aside className="tr-place-details" aria-label="所选地点资料">
                {detailLoading ? (
                  <p role="status">正在读取地点详情…</p>
                ) : detailError ? (
                  <p role="alert" className="tr-error">
                    {detailError} 请重新选择地点。
                  </p>
                ) : selected ? (
                  <>
                    <p className="eyebrow">
                      {cityName(selected.city)} · {selected.category}
                    </p>
                    <h2 ref={detailHeading} tabIndex={-1}>
                      {selected.name}
                    </h2>
                    <p className="tr-english">{selected.english}</p>
                    <p>{selectedStory?.summary ?? selected.description}</p>
                    {selectedStory && (
                      <Link className="tr-story-link" href={`/discover?story=${selectedStory.id}`}>
                        阅读地点故事，在地图上找到它 <ArrowRight size={14} />
                      </Link>
                    )}
                    <PlaceEvidence place={selected} />
                  </>
                ) : (
                  <div className="tr-detail-placeholder">
                    <MapPin size={32} />
                    <h2>看看一个地方的细节</h2>
                    <p>
                      选择地点，查看参观方式、开放参考、预约说明和原始来源。
                    </p>
                    <span>有来源 ≠ 已确认旅行当天可入内</span>
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        {view === "transfers" && (
          <section
            className="tr-transfer-page"
            aria-labelledby="transfer-title"
          >
            <div className="tr-section-copy">
              <span className="eyebrow">BETWEEN THE CITIES</span>
              <h2 id="transfer-title">把路上的时间，也放进计划。</h2>
              <p>
                官方公布的旅时与项目检查使用的预留时间分开展示。这里不提供实时班次、余票或价格。
              </p>
            </div>
            <form onSubmit={lookupTransfer} className="tr-transfer-form">
              <div>
                <label htmlFor="transfer-from">出发城市</label>
                <CitySelect
                  id="transfer-from"
                  value={fromCity}
                  disabled={transferLoading}
                  onChange={(value) => {
                    setFromCity(value as SupportedCity);
                    setTransfer(null);
                    setTransferError("");
                  }}
                />
              </div>
              <ArrowRight size={19} />
              <div>
                <label htmlFor="transfer-to">到达城市</label>
                <CitySelect
                  id="transfer-to"
                  value={toCity}
                  disabled={transferLoading}
                  onChange={(value) => {
                    setToCity(value as SupportedCity);
                    setTransfer(null);
                    setTransferError("");
                  }}
                />
              </div>
              <button className="tr-primary" disabled={transferLoading}>
                {transferLoading ? "正在查询…" : "查看交通参考"}
              </button>
            </form>
            {transferError && (
              <p role="alert" className="tr-error">
                {transferError}
              </p>
            )}
            {transfer && (
              <article className="tr-transfer-result">
                <h3>
                  <TrainFront size={21} />
                  {checkedPair}
                </h3>
                <TransferEvidence reference={transfer} />
              </article>
            )}
            {!transfer && !transferError && (
              <div className="tr-empty">
                <Clock3 size={25} />
                <p>选择两座城市，了解旅时、换乘与需要预留的缓冲。</p>
              </div>
            )}
          </section>
        )}

        <div hidden={view !== "check"}>
          <ScheduleChecker
            places={catalog}
            onRetryCatalog={() => {
              setCity("");
              setQuery("");
              setLoading(true);
              setReload((value) => value + 1);
            }}
          />
        </div>
      </main>
      <footer className="tr-footer">
        <span>资料与基础检查 · 尚未接入 AI 生成</span>
        <Link href="/plan/example">
          <ArrowLeft size={14} />
          返回示例工作区
        </Link>
      </footer>
    </div>
  );
}

function ScheduleChecker({
  places,
  onRetryCatalog,
}: {
  places: TravelPlace[];
  onRetryCatalog: () => void;
}) {
  const [date, setDate] = useState("2026-11-10");
  const [startCity, setStartCity] = useState<SupportedCity>("london");
  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableUntil, setAvailableUntil] = useState("19:00");
  const [visits, setVisits] = useState<ScheduleVisit[]>(initialVisits);
  const [fixedEnabled, setFixedEnabled] = useState(false);
  const [fixed, setFixed] = useState<FixedArrangement>({
    id: "fixed-1",
    title: "已预约的活动",
    city: "london",
    start: "10:30",
    end: "11:30",
  });
  const [result, setResult] = useState<CheckDayResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const nextId = useRef(3);
  const [checkedDate, setCheckedDate] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);

  function changed() {
    revision.current += 1;
    setResult(null);
    setError("");
  }
  function updateVisit(id: string, patch: Partial<ScheduleVisit>) {
    changed();
    setVisits((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }
  function example() {
    changed();
    setStartCity("london");
    setAvailableFrom("09:00");
    setAvailableUntil("19:00");
    setVisits([
      {
        id: "visit-1",
        placeId: "london-big-ben",
        start: "10:00",
        end: "11:00",
      },
      {
        id: "visit-2",
        placeId: "oxford-bodleian-library",
        start: "11:30",
        end: "12:30",
      },
    ]);
    setFixedEnabled(true);
    setFixed({
      id: "fixed-1",
      title: "已预约的活动（测试）",
      city: "london",
      start: "10:30",
      end: "11:30",
    });
    nextId.current = 3;
  }
  async function run(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const version = revision.current;
    const input: CheckDayInput = {
      date,
      startCity,
      availableFrom,
      availableUntil,
      visits,
      fixedArrangements: fixedEnabled ? [fixed] : [],
    };
    try {
      const data = await callTool<CheckDayResult>("check_day", input);
      if (revision.current !== version) return;
      setResult(data);
      setCheckedDate(date);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : "检查服务未能完成，请重试。",
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="check-title" className="tr-check-page">
      <div className="tr-section-copy">
        <span className="eyebrow">A LITTLE ROOM BETWEEN PLANS</span>
        <h2 id="check-title">先检查一天的安排。</h2>
        <p>
          填写明确的地点和时间，检查重叠、固定活动冲突及城际转场时间。所有时间按英国当地日期与钟面填写，暂不支持跨午夜。
        </p>
      </div>
      <p className="tr-note">
        这里的预填内容用于试用检查。原行程与自由文本需求不会被自动导入或修改；没有
        AI 解析。检查结果也不会保存。
      </p>
      {places.length === 0 ? (
        <div className="tr-error" role="alert">
          地点资料尚未载入。
          <button onClick={onRetryCatalog}>重新载入资料</button>
        </div>
      ) : (
        <div className="tr-check-grid">
          <form className="tr-check-form" onSubmit={run}>
            <div className="tr-form-heading">
              <h3>当天计划</h3>
              <button
                type="button"
                className="tr-text-button"
                onClick={example}
              >
                载入冲突示例
              </button>
            </div>
            <div className="tr-field-grid">
              <div>
                <label htmlFor="check-date">旅行日期</label>
                <input
                  id="check-date"
                  type="date"
                  required
                  value={date}
                  onChange={(event) => {
                    changed();
                    setDate(event.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="check-start-city">当天出发城市</label>
                <CitySelect
                  id="check-start-city"
                  value={startCity}
                  onChange={(value) => {
                    changed();
                    setStartCity(value as SupportedCity);
                  }}
                />
              </div>
              <div>
                <label htmlFor="check-from">开始活动时间</label>
                <input
                  id="check-from"
                  type="time"
                  required
                  value={availableFrom}
                  onChange={(event) => {
                    changed();
                    setAvailableFrom(event.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="check-until">结束活动时间</label>
                <input
                  id="check-until"
                  type="time"
                  required
                  value={availableUntil}
                  onChange={(event) => {
                    changed();
                    setAvailableUntil(event.target.value);
                  }}
                />
              </div>
            </div>
            <h4>想去的地点</h4>
            {visits.map((visit, index) => (
              <fieldset className="tr-visit-row" key={visit.id}>
                <legend>第 {index + 1} 个安排</legend>
                <div>
                  <label htmlFor={`${visit.id}-place`}>地点</label>
                  <select
                    id={`${visit.id}-place`}
                    value={visit.placeId}
                    onChange={(event) =>
                      updateVisit(visit.id, { placeId: event.target.value })
                    }
                  >
                    {CITIES.map((city) => (
                      <optgroup label={city.name} key={city.id}>
                        {places
                          .filter((place) => place.city === city.id)
                          .map((place) => (
                            <option value={place.id} key={place.id}>
                              {place.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="tr-time-row">
                  <div>
                    <label htmlFor={`${visit.id}-start`}>开始</label>
                    <input
                      id={`${visit.id}-start`}
                      type="time"
                      required
                      value={visit.start}
                      onChange={(event) =>
                        updateVisit(visit.id, { start: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`${visit.id}-end`}>结束</label>
                    <input
                      id={`${visit.id}-end`}
                      type="time"
                      required
                      value={visit.end}
                      onChange={(event) =>
                        updateVisit(visit.id, { end: event.target.value })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="tr-remove"
                    aria-label={`删除第 ${index + 1} 个安排`}
                    disabled={visits.length === 1}
                    onClick={() => {
                      changed();
                      setVisits((rows) =>
                        rows.filter((row) => row.id !== visit.id),
                      );
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              className="tr-add"
              disabled={visits.length >= 10}
              onClick={() => {
                changed();
                setVisits((rows) => [
                  ...rows,
                  {
                    id: `visit-${nextId.current++}`,
                    placeId: places[0].id,
                    start: "15:00",
                    end: "16:00",
                  },
                ]);
              }}
            >
              <Plus size={16} />
              增加一个地点
            </button>
            <label className="tr-checkbox">
              <input
                type="checkbox"
                checked={fixedEnabled}
                onChange={(event) => {
                  changed();
                  setFixedEnabled(event.target.checked);
                }}
              />
              <span>当天有一个固定安排</span>
            </label>
            {fixedEnabled && (
              <fieldset className="tr-fixed">
                <legend>已确定的活动 · 仅检查冲突</legend>
                <div>
                  <label htmlFor="fixed-title">活动名称</label>
                  <input
                    id="fixed-title"
                    maxLength={120}
                    required
                    value={fixed.title}
                    onChange={(event) => {
                      changed();
                      setFixed({ ...fixed, title: event.target.value });
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="fixed-city">活动城市</label>
                  <CitySelect
                    id="fixed-city"
                    value={fixed.city}
                    onChange={(value) => {
                      changed();
                      setFixed({ ...fixed, city: value as SupportedCity });
                    }}
                  />
                </div>
                <div className="tr-field-grid">
                  <div>
                    <label htmlFor="fixed-start">活动开始</label>
                    <input
                      id="fixed-start"
                      type="time"
                      required
                      value={fixed.start}
                      onChange={(event) => {
                        changed();
                        setFixed({ ...fixed, start: event.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="fixed-end">活动结束</label>
                    <input
                      id="fixed-end"
                      type="time"
                      required
                      value={fixed.end}
                      onChange={(event) => {
                        changed();
                        setFixed({ ...fixed, end: event.target.value });
                      }}
                    />
                  </div>
                </div>
              </fieldset>
            )}
            <button className="tr-primary tr-check-submit" disabled={busy}>
              {busy ? "正在检查安排…" : "检查这一天"}
              <ArrowRight size={16} />
            </button>
          </form>
          <aside className="tr-check-result" aria-label="安排检查结果">
            {error && (
              <p role="alert" className="tr-error">
                {error} 请修改后重试。
              </p>
            )}
            {busy && <p role="status">正在检查填写的时间和资料…</p>}
            {result ? (
              <>
                <span
                  className={`tr-result-badge ${result.status === "conflicts" ? "has-conflict" : "needs-review"}`}
                >
                  {result.status === "conflicts" ? "发现冲突" : "仍需确认"}
                </span>
                <h3 ref={resultHeading} tabIndex={-1}>
                  {checkedDate} 的检查结果
                </h3>
                <p>{result.summary}</p>
                <ul className="tr-issue-list">
                  {result.issues.map((issue, index) => (
                    <li
                      key={`${issue.code}-${index}`}
                      className={`tr-issue-${issue.severity}`}
                    >
                      <CircleAlert size={17} />
                      <div>
                        <strong>
                          {issue.severity === "conflict"
                            ? "冲突"
                            : issue.severity === "unknown"
                              ? "待确认"
                              : "提醒"}
                        </strong>
                        <p>{issue.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {result.transfers.length > 0 && (
                  <div className="tr-transfer-check">
                    <h4>城际转场占用</h4>
                    {result.transfers.map((item, index) => (
                      <p key={index}>
                        <strong>
                          {cityName(item.from)} → {cityName(item.to)}
                        </strong>
                        <span>
                          间隔 {item.availableMinutes} 分钟 /{" "}
                          {item.neededMinutes === null
                            ? "所需时间待确认"
                            : `建议至少预留 ${item.neededMinutes} 分钟`}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
                <details className="tr-check-scope">
                  <summary>本次检查了哪些内容</summary>
                  <ul>
                    {result.checkedScope.map((scope) => (
                      <li key={scope}>{scope}</li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              !busy &&
              !error && (
                <div className="tr-detail-placeholder">
                  <Clock3 size={32} />
                  <h3>给安排留一点余地</h3>
                  <p>检查会指出需要调整或确认的地方，不会自动改动行程。</p>
                </div>
              )
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
