import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import JourneyCard from "@/components/journey-card";
import {JOURNEYS} from "@/data/journeys";
import "@/components/slowtrail.css";
export default function Journeys(){return <div className="st-app"><SiteHeader/><main className="st-shell st-section"><div className="st-page-intro"><p className="st-eyebrow">DISCOVER YOUR NEXT CHAPTER</p><h1>从一段心动的旅程开始。</h1><p>三种英国旅行提案。可以照着走，也可以从这里，写出自己的版本。</p></div><div className="st-trip-grid">{JOURNEYS.map(j=><JourneyCard key={j.slug} journey={j}/>)}</div><p className="st-note">路线为编辑提案，预算依公开假设估算；日期、开放与交通需在定制时确认。</p></main><SiteFooter/></div>}
