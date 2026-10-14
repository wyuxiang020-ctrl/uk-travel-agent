import Link from "next/link";
import PlanWorkspace from "@/components/plan-workspace";
export default function SavedPage(){return <div className="agent-page"><header className="agent-header"><Link className="agent-brand" href="/">SLOWTRAIL<span>欧洲慢游</span></Link><nav><Link href="/plan">新建旅行</Link><Link href="/">返回首页</Link></nav></header><main className="agent-shell"><h1>继续上一次旅行。</h1><PlanWorkspace/></main></div>;}
