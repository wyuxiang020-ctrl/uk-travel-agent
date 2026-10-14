import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import bled from "../../public/images/lake-bled.jpg";
import london from "../../public/images/london.jpg";
import oxford from "../../public/images/oxford.jpg";
import bath from "../../public/images/bath.jpg";
import desktop from "../../public/images/showcase/itinerary-desktop.jpg";
import mobile from "../../public/images/showcase/story-mobile.jpg";

const cases = [
  { image: oxford, alt: "牛津拉德克利夫书馆", label: "OXFORD / 地点故事", title: "在书页之外，读一座城。", href: "/discover?story=oxford-bodleian" },
  { image: bath, alt: "巴斯罗马浴场", label: "BATH / 地点故事", title: "在温泉旁，与往昔相遇。", href: "/discover?story=bath-roman-baths" },
];

export default function HomeShowcase() {
  return <>
    <section id="customization" className="ed-customization ed-reveal" aria-labelledby="customization-title">
      <div className="ed-customization-copy">
        <p className="ed-eyebrow">MADE AROUND YOU</p>
        <h2 id="customization-title">目的地可以相同，<br />旅行不必一样。</h2>
        <p className="ed-customization-description">想去的城市，愿意停留的时间，<br />还有那些不想错过的小事。<br />一段旅行，从你的偏好开始。</p>
        <div className="ed-customization-details"><span>你的兴趣</span><span>你的节奏</span><span>你的时间</span></div>
        <a className="ed-text-link" href="#cases">看看旅行的样子 <ArrowDown size={16} aria-hidden="true" /></a>
      </div>
      <div className="ed-customization-visual">
        <Image className="ed-customization-scenery" src={bled} alt="布莱德湖的湖水与群山，欧洲旅行灵感" fill sizes="(max-width: 900px) 100vw, 56vw" placeholder="blur" />
        <div className="ed-device-composition" aria-label="项目真实界面展示">
          <figure className="ed-desktop-frame"><div className="ed-window-bar" aria-hidden="true"><i /><i /><i /><span>SLOWTRAIL / YOUR JOURNEY</span></div><Image src={desktop} alt="桌面行程示例界面：逐日安排与重点景点地图" sizes="(max-width: 900px) 78vw, 43vw" /></figure>
          <figure className="ed-phone-frame"><Image src={mobile} alt="手机地点故事界面：在牛津，读一座图书馆" sizes="(max-width: 900px) 23vw, 13vw" /></figure>
        </div>
        <p className="ed-showcase-caption">真实界面 · 英国示例<span>画面为固定示例；可从计划入口体验真实 AI 规划。</span></p>
      </div>
    </section>
    <section id="cases" className="ed-cases ed-shell" aria-labelledby="cases-title">
      <div className="ed-cases-heading ed-reveal"><div><p className="ed-eyebrow">A FEW WAYS TO GO</p><h2 id="cases-title">下一程，可以是这样。</h2></div><p>从英国出发的行程与故事示例</p></div>
      <div className="ed-case-layout">
        <Link className="ed-case-feature ed-reveal" href="/plan/example">
          <div className="ed-case-photo"><Image src={london} alt="伦敦泰晤士河与威斯敏斯特宫" fill sizes="(max-width: 750px) 90vw, 48vw" placeholder="blur" /><span className="ed-case-image-label">7 DAYS / UNITED KINGDOM</span><span className="ed-case-arrow"><ArrowUpRight size={23} aria-hidden="true" /></span></div>
          <p className="ed-case-label">行程示例 / 伦敦 · 牛津 · 巴斯</p><h3>七天，慢慢走过三座城。</h3><p className="ed-case-description">从河畔到书馆，再到温泉古城。给每一站，留一点从容。</p><span className="ed-case-link">浏览完整示例 <ArrowUpRight size={15} aria-hidden="true" /></span>
        </Link>
        <div className="ed-case-list">{cases.map(item => <Link className="ed-case-row ed-reveal" href={item.href} key={item.href}><div className="ed-case-photo"><Image src={item.image} alt={item.alt} fill sizes="(max-width: 750px) 40vw, 22vw" placeholder="blur" /></div><div><p className="ed-case-label">{item.label}</p><h3>{item.title}</h3><span className="ed-case-link">走进这个故事 <ArrowUpRight size={15} aria-hidden="true" /></span></div></Link>)}<p className="ed-case-footnote">欧洲，是旅行的方向。<br />英国，是第一个细细展开的篇章。</p></div>
      </div>
    </section>
  </>;
}
