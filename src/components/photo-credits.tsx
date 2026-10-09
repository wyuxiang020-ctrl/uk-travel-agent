import { ArrowUpRight } from "lucide-react";

export default function PhotoCredits() {
  return (
    <div className="credit-links">
      <p>
        伦敦 · Edgar El
        <br />
        <a
          href="https://commons.wikimedia.org/wiki/File:London_-_Palace_of_Westminster_-_Big_Ben_%E2%80%93_Westminster-Bridge_-_panoramio.jpg"
          target="_blank"
          rel="noreferrer"
        >
          原始照片 <ArrowUpRight size={13} />
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 3.0
        </a>
      </p>
      <p>
        牛津 · Photograph by Mike Peel (www.mikepeel.net)
        <br />
        <a
          href="https://commons.wikimedia.org/wiki/File:Radcliffe_Camera,_Oxford.jpg"
          target="_blank"
          rel="noreferrer"
        >
          原始照片 <ArrowUpRight size={13} />
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 4.0
        </a>
        <small>裁切展示及自动优化的图片同样遵守 CC BY-SA 4.0。</small>
      </p>
      <p>
        巴斯 · Draceane
        <br />
        <a
          href="https://commons.wikimedia.org/wiki/File:Bath_roman_baths.jpg"
          target="_blank"
          rel="noreferrer"
        >
          原始照片与公共领域声明 <ArrowUpRight size={13} />
        </a>
      </p>
    </div>
  );
}
