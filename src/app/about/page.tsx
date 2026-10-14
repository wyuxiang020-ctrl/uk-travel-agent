import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "@/components/slowtrail.css";
export default function About(){return <div className="st-app"><SiteHeader/><main className="st-shell st-section st-info"><p className="st-eyebrow">ABOUT SLOWTRAIL</p><h1>把远方，留给喜欢的事。</h1><p>我们想让旅行从你的心动开始：一座小城、一片湖、一段愿意慢慢走的路。</p><h2>面向欧洲，从英国开始。</h2><p>Slowtrail 是一个正在打磨的个人旅行产品。你可以浏览英国旅行提案，留下自己的想法，再选择城市、小镇与停留时间，整理成一份路线草案。</p><h2>旅行由你决定。</h2><p>今天的版本支持路线整理、机场接驳参考与官方交通查询入口。提案中的金额是预算假设，班次、余票与价格仍需通过官方渠道确认。</p><p>用自然语言协调交通、预算和逐日安排，是我们接下来要完善的方向。新版入口目前保存你的需求并引导你确认路线，不会自动完成预订。</p><Link href="/plan" className="st-button">计划我的旅行 ↗</Link></main><SiteFooter/></div>}
