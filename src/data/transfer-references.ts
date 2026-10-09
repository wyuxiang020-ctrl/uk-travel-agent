import type { EvidenceSource, TransferReference } from "../lib/travel-types";

const checkedOn = "2026-10-09";
const source = (id: string, title: string, url: string): EvidenceSource => ({
  id,
  title,
  url,
  checkedOn,
});
const caveat =
  "这是已核对页面的路线参考，不是实时班次、票价或门到门导航。反向查询仅共用项目估算；所列官方时长描述原方向，不保证反向相同。周末、施工、候车及市内接驳可能增加时间。";

export const TRANSFER_REFERENCES: TransferReference[] = [
  {
    id: "rail-london-oxford",
    from: "london",
    to: "oxford",
    mode: "rail",
    route: "London Marylebone → Oxford（Chiltern Railways）",
    serviceSummary:
      "运营商列出直达服务；伦敦站点为 Marylebone，此参考不代表 Paddington 线路。",
    referenceMinutes: 83,
    referenceKind: "typical",
    referenceText:
      "Chiltern 官方路线页列出平均 1 小时 23 分钟（另列最快 1 小时 12 分钟）。",
    planningRideMinutes: 90,
    bufferMinutes: 60,
    planningBasis:
      "项目为初步冲突检查预留 90 分钟铁路行程 + 60 分钟到站、候车和出站缓冲，共 150 分钟；不是官方时刻表或最短时间。住宿接驳和大件行李可能需要更多时间。",
    caveat,
    sources: [
      source(
        "rail-chiltern-london-oxford",
        "Chiltern Railways：London to Oxford",
        "https://www.chilternrailways.co.uk/london-oxford-train",
      ),
    ],
  },
  {
    id: "rail-london-bath",
    from: "london",
    to: "bath",
    mode: "rail",
    route: "London Paddington → Bath Spa",
    serviceSummary:
      "National Rail 列出伦敦 Paddington 与 Bath Spa 之间每日有直达服务，具体班次仍需按日期查询。",
    referenceMinutes: 74,
    referenceKind: "fastest",
    referenceText:
      "National Rail 的目的地参考表列出伦敦至巴斯最快 1 小时 14 分钟，并提示部分行程更长或需换乘。",
    planningRideMinutes: 100,
    bufferMinutes: 60,
    planningBasis:
      "项目预留 100 分钟铁路行程 + 60 分钟到站、候车和出站缓冲，共 160 分钟。没有直接使用最快时长作排程保证，实际仍以已选班次为准。",
    caveat,
    sources: [
      source(
        "rail-national-bath",
        "National Rail：Visit Bath by Train",
        "https://www.nationalrail.co.uk/discover-by-train/great-british-destinations/visit-bath-by-train/",
      ),
    ],
  },
  {
    id: "rail-oxford-bath",
    from: "oxford",
    to: "bath",
    mode: "rail",
    route: "Oxford → Bath Spa（按日期核对直达或换乘）",
    serviceSummary:
      "National Rail 提供此城际路线参考。GWR 官方索引列出经 Bath Spa 的 Oxford–Bristol 周一至周六直达服务；本次 GWR 主站受机器人验证限制，仍需复核。",
    referenceMinutes: 69,
    referenceKind: "fastest",
    referenceText:
      "National Rail 的目的地参考表列出牛津至巴斯最快 1 小时 9 分钟；不代表每班或每个方向的时长。",
    planningRideMinutes: 110,
    bufferMinutes: 60,
    planningBasis:
      "项目预留 110 分钟铁路行程（含可能的换乘）+ 60 分钟到站、候车和出站缓冲，共 170 分钟。当前不查询实际接续，不保证等待下一班仅需这段时间。",
    caveat,
    sources: [
      source(
        "rail-national-bath",
        "National Rail：Visit Bath by Train",
        "https://www.nationalrail.co.uk/discover-by-train/great-british-destinations/visit-bath-by-train/",
      ),
      source(
        "rail-gwr-oxford-bristol",
        "GWR：Oxford–Bristol direct（官方搜索索引；直读受限）",
        "https://www.gwr.com/bristol-oxford-direct",
      ),
    ],
  },
];
