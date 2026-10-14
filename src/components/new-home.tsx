"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {SiteHeader,SiteFooter} from "./site-chrome";
import ParticleTitle from "./particle-title";
import JourneyCard from "./journey-card";
import {JOURNEYS} from "@/data/journeys";
import "./slowtrail.css";
const slides=[
 {image:"/images/atlas/edinburgh-real.jpg",name:"爱丁堡 · 英国",position:"65% center"},
 {image:"/images/lake-bled.jpg",name:"布莱德湖 · 斯洛文尼亚",position:"center"},
 {image:"/images/atlas/lakes-real.jpg",name:"德文特湖 · 英国",position:"center"},
 {image:"/images/oxford.jpg",name:"牛津 · 英国",position:"center 40%"},
 {image:"/images/bath.jpg",name:"巴斯 · 英国",position:"center"}
];
export default function NewHome(){
 const [active,setActive]=useState(0),[reduced,setReduced]=useState(true);const rail=useRef<HTMLDivElement>(null);
 useEffect(()=>{const m=matchMedia("(prefers-reduced-motion: reduce)");const sync=()=>setReduced(m.matches);sync();m.addEventListener("change",sync);return()=>m.removeEventListener("change",sync);},[]);
 useEffect(()=>{if(reduced)return;const timer=setInterval(()=>{if(!document.hidden)setActive(a=>(a+1)%slides.length);},9000);return()=>clearInterval(timer);},[reduced]);
 return <div className="st-app st-revision"><a className="skip-link" href="#main">跳到主要内容</a><SiteHeader overlay/><main id="main">
 <section className="st-hero" aria-label="旅程从这里开始">{slides.map((s,i)=><div key={s.image} className={`st-hero-slide ${i===active?"active":""}`} aria-hidden={i!==active}><Image src={s.image} alt={s.name} fill priority={i===0} sizes="100vw" style={{objectPosition:s.position}}/></div>)}<div className="st-hero-shade"/><div className="st-hero-copy"><p className="st-eyebrow">LEAVE ROOM FOR WONDER</p><ParticleTitle/><p className="st-hero-sub">循着心动，让沿途成为答案。</p><div className="st-hero-actions"><Link className="st-button st-button-outline" href="/journeys">发现旅行 <span>↗</span></Link><Link className="st-button st-button-white" href="/plan">计划旅行 <span>↗</span></Link></div></div><div className="st-hero-bottom"><span>0{active+1} / 05 <i/>{slides[active].name}</span><div className="st-slides" role="group" aria-label="切换首页风景">{slides.map((s,i)=><button key={s.image} aria-label={`查看${s.name}风景`} aria-pressed={active===i} onClick={()=>setActive(i)}/>)}</div></div></section>
 <section className="st-philosophy st-shell"><div><p className="st-eyebrow">THE ART OF WANDERING</p><h2>走过风景，<br/>把日子过成喜欢的模样。</h2><p>在陌生的街角，找回从容。<br/>为一束光停下，为一段故事绕路。<br/>有些美好，值得慢慢经过。</p><Link className="st-text-link" href="/about">关于这场旅行 ↗</Link></div><div className="st-photo-composition"><figure><Image src="/images/editorial/rome.jpg" alt="罗马建筑与地图的旅行影像" fill sizes="(max-width:700px) 40vw, 20vw"/><figcaption>ROMA</figcaption></figure><figure><Image src="/images/editorial/florence.jpg" alt="佛罗伦萨夕照与地图的旅行影像" fill sizes="(max-width:700px) 40vw, 20vw"/><figcaption>FLORENCE</figcaption></figure><figure><Image src="/images/editorial/venice.jpg" alt="威尼斯大运河与地图的旅行影像" fill sizes="(max-width:700px) 35vw, 17vw"/><figcaption>VENEZIA</figcaption></figure></div></section>
 <section className="st-dark-trips" id="cases"><div className="st-dark-intro"><p className="st-eyebrow">EXPLORE OUR JOURNEYS</p><h2>沿途，皆是心动。</h2><p>从一段旅程，遇见另一种生活。</p><Link className="st-text-link" href="/journeys">发现旅行 ↗</Link></div><div className="st-trip-rail" ref={rail}>{JOURNEYS.map(j=><JourneyCard key={j.slug} journey={j}/>)}</div><div className="st-rail-controls"><button aria-label="查看前面的旅行" onClick={()=>rail.current?.scrollBy({left:-380,behavior:reduced?"auto":"smooth"})}>←</button><button aria-label="查看后面的旅行" onClick={()=>rail.current?.scrollBy({left:380,behavior:reduced?"auto":"smooth"})}>→</button></div></section>
 <section className="st-celebration"><Image src="/images/editorial/celebration-clean.png" alt="旅途中举杯分享相聚的时刻" fill sizes="100vw"/><div className="st-celebration-shade"/><div className="st-celebration-copy"><p className="st-eyebrow">MAKE ROOM FOR THE MOMENTS</p><h2>把相聚的此刻，<br/>酿成日后的念念不忘。</h2><Link href="/plan" className="st-button st-button-white">计划旅行 ↗</Link></div></section>
 </main><SiteFooter/></div>;
}
