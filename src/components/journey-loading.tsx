import Link from "next/link";

export default function JourneyLoading() {
  return <main className="journey-loading" aria-busy="true">
    <Link href="/" className="journey-loading-brand">SLOWTRAIL</Link>
    <div className="journey-loading-copy"><p role="status">正在打开旅行页面…</p><span>把时间，留给心之所向。</span></div>
    <div className="journey-loading-layout" aria-hidden="true"><div className="journey-loading-lines"><i /><i /><i /></div><div className="journey-loading-picture" /></div>
    <Link href="/">返回首页</Link>
  </main>;
}
