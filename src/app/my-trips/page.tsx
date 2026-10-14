import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "@/components/slowtrail.css";
export default function MyTrips(){return <div className="st-app"><SiteHeader/><main className="st-shell st-section st-info"><p className="st-eyebrow">MY JOURNEYS</p><h1>接着写，你的下一程。</h1><p>无需登录。已保存的内容保留在当前浏览器，换设备或清除浏览器数据后不会自动同步。</p><div className="st-local-links"><Link href="/plan"><strong>我的旅行想法 ↗</strong><span>继续补充已保存的需求</span></Link><Link href="/plan/route"><strong>英国路线草案 ↗</strong><span>查看已保存的城市、停留与交通</span></Link><Link href="/plan/days"><strong>逐日安排 ↗</strong><span>继续已有路线的每日编排</span></Link><Link href="/plan/saved"><strong>以往行程 ↗</strong><span>打开旧版已保存的逐日行程</span></Link></div></main><SiteFooter/></div>}
