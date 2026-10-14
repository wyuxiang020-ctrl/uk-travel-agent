import Image from "next/image";
import Link from "next/link";
import { journeyBudget, type Journey } from "@/data/journeys";
export default function JourneyCard({journey:j}:{journey:Journey}){const b=journeyBudget(j);return <Link className="st-trip-card" href={`/journeys/${j.slug}`}><div className="st-trip-photo"><Image src={j.image} alt={j.imageAlt} fill sizes="(max-width:700px) 90vw, 33vw"/><span className="st-trip-days">{j.days} 天 / {j.days-1} 晚</span><div><span>{j.theme}</span><h3>{j.title}</h3><p>{j.subtitle}</p><strong>探索这段旅程 ↗</strong></div></div><p className="st-card-budget">预算参考 £{b.low.toLocaleString("en-GB")}–{b.high.toLocaleString("en-GB")} / 人<span>编辑估算 · 不含往返国际交通</span></p></Link>}
