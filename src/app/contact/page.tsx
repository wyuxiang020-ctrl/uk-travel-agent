import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import ContactForm from "@/components/contact-form";
import "@/components/slowtrail.css";
export default function Contact(){return <div className="st-app"><SiteHeader/><main className="st-shell st-section st-info"><p className="st-eyebrow">LET’S MAKE IT BETTER</p><h1>下一次心动，从交流开始。</h1><p>这是一件持续打磨的作品。欢迎留下你使用时的感受。</p><ContactForm/></main><SiteFooter/></div>}
