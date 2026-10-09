import type {
  EvidenceSource,
  SourcedFact,
  TravelPlace,
} from "../lib/travel-types";

const source = (id: string, title: string, url: string): EvidenceSource => ({
  id,
  title,
  url,
  checkedOn: "2026-10-09",
});
const fact = (text: string, ...sourceIds: string[]): SourcedFact => ({
  text,
  status: "sourced",
  sourceIds,
});
const unknown = (text: string, ...sourceIds: string[]): SourcedFact => ({
  text,
  status: "unknown",
  sourceIds,
});
const estimate =
  "项目为行程草拟设置的停留估算，非场馆承诺；不含排队及往返交通。";
const bodleian = source(
  "ox-bodleian-visit",
  "Bodleian Libraries：参观说明",
  "https://visit.bodleian.ox.ac.uk/plan-your-visit/",
);
const covered = source(
  "ox-covered-story",
  "Oxford Covered Market：市场介绍与开放时间",
  "https://oxford-coveredmarket.co.uk/our-story/",
);
const christ = source(
  "ox-christ-tours",
  "Christ Church：每日多媒体参观",
  "https://www.chch.ox.ac.uk/visit/daily-multimedia-tours",
);
const ash = source(
  "ox-ashmolean-visit",
  "Ashmolean Museum：参观说明",
  "https://www.ashmolean.org/plan-your-visit",
);
const glam = source(
  "ox-glam-hours",
  "Oxford GLAM：开放时间",
  "https://www.glam.ox.ac.uk/opening-times",
);
const pitt = source(
  "ox-pitt-visit",
  "Pitt Rivers Museum：参观说明",
  "https://prm.web.ox.ac.uk/visit-us",
);
const natural = source(
  "ox-natural-visit",
  "Oxford Museum of Natural History：参观说明",
  "https://www.oumnh.ox.ac.uk/visit-us",
);
const botanicHours = source(
  "ox-botanic-hours",
  "Oxford Botanic Garden：季节开放时间",
  "https://www.botanic-garden.ox.ac.uk/opening-hours",
);
const botanicTickets = source(
  "ox-botanic-tickets",
  "Oxford University：植物园日票",
  "https://tickets.ox.ac.uk/WebStore/shop/ViewItems.aspx?C=BOT&CG=BGA",
);
const parksHours = source(
  "ox-parks-hours",
  "University Parks：开放与关闭时间",
  "https://www.parks.ox.ac.uk/opening-times",
);
const parksFaq = source(
  "ox-parks-faq",
  "University Parks：常见问题",
  "https://www.parks.ox.ac.uk/faqs",
);
const castleHours = source(
  "ox-castle-hours",
  "Oxford Castle Prison：开放时间与预约说明",
  "https://www.oxfordcastleandprison.co.uk/your-visit/opening-times/",
);
const castleTickets = source(
  "ox-castle-tickets",
  "Oxford Castle Prison：门票与导览",
  "https://www.oxfordcastleandprison.co.uk/tickets-prices/",
);

/** 人工核验的资料快照；地图坐标为近似点，不代表入口或导航路线。 */
export const OXFORD_PLACES: TravelPlace[] = [
  {
    id: "oxford-radcliffe-camera",
    name: "拉德克里夫图书馆",
    english: "Radcliffe Camera",
    city: "oxford",
    category: "大学建筑",
    description: "博德利图书馆群中的圆形建筑；内部参观取决于导览路线。",
    address: "Radcliffe Square, Oxford",
    position: [51.7534, -1.254],
    coordinateStatus: "approximate",
    visiting: fact("内部仅可随博德利导览进入，馆内禁止摄影。", bodleian.id),
    admission: fact(
      "内部参观须持导览票；所选导览是否包含此处需确认。",
      bodleian.id,
    ),
    booking: fact("须预约适用的博德利导览。", bodleian.id),
    opening: unknown(
      "尚未核实具体日期的内部导览场次，不能套用 Weston Library 的开放时间。",
      bodleian.id,
    ),
    openingWindows: null,
    openingCaveat:
      "示例点位可用于建筑外观定位；进入内部须另核导览路线、余票及关闭公告。",
    suggestedMinutes: 30,
    durationBasis: "项目估算为外观停留 30 分钟，不包含内部导览。",
    sources: [bodleian],
  },
  {
    id: "oxford-bodleian-library",
    name: "博德利老图书馆",
    english: "Bodleian Old Library",
    city: "oxford",
    category: "图书馆与历史",
    description: "可通过官方导览了解仍在使用的大学图书馆空间。",
    address: "Catte Street / Broad Street, Oxford OX1 3BG",
    position: [51.7541, -1.254],
    coordinateStatus: "approximate",
    visiting: fact(
      "进入老图书馆须参加官方导览；预订访客从 Catte Street 的 Great Gate 前往。",
      bodleian.id,
    ),
    admission: fact(
      "内部参观须持导览票；免费 Weston 展厅不是老图书馆内部。",
      bodleian.id,
    ),
    booking: fact("需预订导览；各导览包含空间不同。", bodleian.id),
    opening: unknown(
      "开放依所选导览场次与关闭公告；未建立全年内部参观时窗。",
      bodleian.id,
    ),
    openingWindows: null,
    openingCaveat:
      "活动可导致部分空间关闭；官方页面列有逐日例外，不能将总开放时间视为导览可订时间。",
    suggestedMinutes: 75,
    durationBasis: estimate,
    sources: [bodleian],
  },
  {
    id: "oxford-covered-market",
    name: "牛津室内市场",
    english: "Oxford Covered Market",
    city: "oxford",
    category: "市集与餐饮",
    description: "市中心的独立商铺、餐饮与咖啡市场。",
    address: "Market Street, Oxford OX1 3DZ",
    position: [51.7521, -1.2569],
    coordinateStatus: "approximate",
    visiting: fact("市场对公众开放，但各商铺营业时间不同。", covered.id),
    admission: unknown(
      "已读页面未明确列出市场入场收费规则；餐饮购物费用另计。",
      covered.id,
    ),
    booking: unknown(
      "已读页面未给出统一预约规则；特定餐厅或活动需另查。",
      covered.id,
    ),
    opening: fact(
      "周一至三 08:00–17:30，周四至六 08:00–22:00；周日及银行假日闭门时间在同页有冲突。",
      covered.id,
    ),
    openingWindows: [
      { weekdays: [1, 2, 3], opens: "08:00", closes: "17:30" },
      { weekdays: [4, 5, 6], opens: "08:00", closes: "22:00" },
    ],
    openingCaveat:
      "官方正文写周日及银行假日 16:00 关闭，页脚写 17:00；这两类日期需人工确认。商铺可能更早打烊。",
    suggestedMinutes: 60,
    durationBasis: estimate,
    sources: [covered],
  },
  {
    id: "oxford-christ-church",
    name: "基督堂学院",
    english: "Christ Church",
    city: "oxford",
    category: "学院与教堂",
    description: "大学学院与座堂组成的参观场所，教学和宗教活动会影响开放。",
    address: "St Aldate's, Oxford OX1 1DP",
    position: [51.7502, -1.2559],
    coordinateStatus: "approximate",
    visiting: fact(
      "多媒体票可参观主院区及座堂的开放部分；大厅或座堂可能关闭。",
      christ.id,
    ),
    admission: fact(
      "收费，票价依日期与票种变化；多媒体导览含在对应票内。",
      christ.id,
    ),
    booking: fact(
      "建议提前购票；通常周五约 10:00 放出下一周票，须查看时段旁的关闭提示。",
      christ.id,
    ),
    opening: unknown(
      "须以具体日期的售票时段和已知关闭公告为准，未记录全年周时窗。",
      christ.id,
    ),
    openingWindows: null,
    openingCaveat:
      "参观票并不保证大厅和座堂同时开放；本项目没有接入余票或逐日关闭日历。",
    suggestedMinutes: 90,
    durationBasis: estimate,
    sources: [christ],
  },
  {
    id: "oxford-ashmolean",
    name: "阿什莫林博物馆",
    english: "Ashmolean Museum",
    city: "oxford",
    category: "艺术与考古",
    description: "牛津大学的艺术与考古博物馆。",
    address: "Beaumont Street, Oxford OX1 2PH",
    position: [51.7555, -1.2601],
    coordinateStatus: "approximate",
    visiting: fact(
      "普通参观与特别展览的票务要求不同；部分展厅可能临时关闭。",
      ash.id,
    ),
    admission: fact("普通入馆免费；需购票的特别展览另计。", ash.id),
    booking: fact("普通个人参观无需预约；团体与收费展览需预约。", ash.id),
    opening: fact("大学 GLAM 页面列常规每日 10:00–17:00。", glam.id),
    openingWindows: [
      { weekdays: [1, 2, 3, 4, 5, 6, 7], opens: "10:00", closes: "17:00" },
    ],
    openingCaveat:
      "核对日官网列出部分西方艺术展厅关闭至 2026 年 10 月中旬；场馆及展厅临时关闭需另核。",
    suggestedMinutes: 120,
    durationBasis: estimate,
    sources: [ash, glam],
  },
  {
    id: "oxford-pitt-rivers",
    name: "皮特·里弗斯博物馆",
    english: "Pitt Rivers Museum",
    city: "oxford",
    category: "文化与考古",
    description: "从自然历史博物馆内部进入的大学博物馆。",
    address: "经 Museum of Natural History 进入，Parks Road, Oxford OX1 3PW",
    position: [51.759, -1.2551],
    coordinateStatus: "approximate",
    visiting: fact("公众入口设于自然历史博物馆内部。", pitt.id),
    admission: fact("免费入馆。", pitt.id),
    booking: fact("所有团体参观都需要预约。", pitt.id),
    opening: fact(
      "通常周一 12:00–17:00，周二至日 10:00–17:00；部分假期周一改为 10:00 开门。",
      pitt.id,
    ),
    openingWindows: [
      { weekdays: [1], opens: "12:00", closes: "17:00" },
      { weekdays: [2, 3, 4, 5, 6, 7], opens: "10:00", closes: "17:00" },
    ],
    openingCaveat:
      "官网明确 2026-10-10 延后至 12:00 开门；银行假日、学期中假期及其他逐日例外未编码，请另核。",
    suggestedMinutes: 90,
    durationBasis: estimate,
    sources: [pitt],
  },
  {
    id: "oxford-natural-history",
    name: "牛津大学自然历史博物馆",
    english: "Oxford University Museum of Natural History",
    city: "oxford",
    category: "自然历史",
    description: "展示自然历史标本与馆藏的大学博物馆。",
    address: "Parks Road, Oxford OX1 3PW",
    position: [51.7586, -1.2556],
    coordinateStatus: "approximate",
    visiting: fact(
      "入馆不发普通门票；可在馆内继续前往皮特·里弗斯博物馆。",
      natural.id,
      pitt.id,
    ),
    admission: fact("免费入馆。", natural.id),
    booking: fact(
      "普通个人参观无需门票；超过 10 人的机构或团体需预约。",
      natural.id,
    ),
    opening: fact(
      "每日 10:00–17:00，最后入馆 16:45；12 月 24–26 日关闭。",
      natural.id,
    ),
    openingWindows: [
      { weekdays: [1, 2, 3, 4, 5, 6, 7], opens: "10:00", closes: "17:00" },
    ],
    openingCaveat:
      "时窗仅表达常规开放，不自动应用 12 月 24–26 日关闭、最后入馆时间或临时活动例外。",
    suggestedMinutes: 90,
    durationBasis: estimate,
    sources: [natural, pitt],
  },
  {
    id: "oxford-botanic-garden",
    name: "牛津植物园",
    english: "Oxford Botanic Garden",
    city: "oxford",
    category: "植物园",
    description: "位于牛津市中心的植物园，与 Harcourt Arboretum 是不同场地。",
    address: "Rose Lane, Oxford OX1 4AZ",
    position: [51.7512, -1.2489],
    coordinateStatus: "approximate",
    visiting: fact(
      "植物园与树木园各自营业；此记录仅指市中心植物园。",
      botanicHours.id,
      botanicTickets.id,
    ),
    admission: fact(
      "日票收费，有减免票种；核对时标准成人票 £9，在线交易另收 £1 手续费。",
      botanicTickets.id,
    ),
    booking: fact(
      "可在线选日票；16 人及以上团体须提前预约。",
      botanicTickets.id,
    ),
    opening: fact(
      "每日 10:00 开门；3–4、9–10 月 17:00 关闭，5–8 月 18:00，11–2 月 16:00；提前一小时停止入园。",
      botanicHours.id,
    ),
    openingWindows: null,
    openingCaveat:
      "季节开放与温室临时关闭不适合全年周时窗；具体日期应再查官网。",
    suggestedMinutes: 75,
    durationBasis: estimate,
    sources: [botanicHours, botanicTickets, glam],
  },
  {
    id: "oxford-university-parks",
    name: "牛津大学公园",
    english: "University Parks",
    city: "oxford",
    category: "公园与散步",
    description: "大学管理的绿地与步道，闭园时间随日照变化。",
    address: "South Lodge, South Parks Road, Oxford OX1 3RF",
    position: [51.7618, -1.2539],
    coordinateStatus: "approximate",
    visiting: fact(
      "为大学成员、居民与访客提供公共绿地；部分步道会因积水关闭。",
      parksFaq.id,
      parksHours.id,
    ),
    admission: fact("普通公共区域免费，私人场地活动另有安排。", parksFaq.id),
    booking: unknown(
      "已读页面未明确普通散步预约规则；活动或场地使用需联系管理方。",
      parksFaq.id,
    ),
    opening: fact(
      "通常 07:45 开园，关门时间随季节变化；12 月 24 日全园关闭。",
      parksHours.id,
    ),
    openingWindows: null,
    openingCaveat:
      "官网按日期列闭园时间；不把日落时间简化为全年固定时窗。洪水或路径封闭需现场核实。",
    suggestedMinutes: 60,
    durationBasis: estimate,
    sources: [parksHours, parksFaq],
  },
  {
    id: "oxford-castle-prison",
    name: "牛津城堡与监狱",
    english: "Oxford Castle Prison",
    city: "oxford",
    category: "城堡与历史",
    description: "以导览形式参观城堡、地窖与监狱历史空间。",
    address: "44–46 Oxford Castle, Oxford OX1 1AY",
    position: [51.7516, -1.2631],
    coordinateStatus: "approximate",
    visiting: fact(
      "标准导览含塔楼、地窖及牢房；塔楼有楼梯，5 岁以下不能登塔。",
      castleHours.id,
      castleTickets.id,
    ),
    admission: fact(
      "收费，票型与线上优惠可能不同，按所选日期票价为准。",
      castleTickets.id,
    ),
    booking: fact("建议提前预约，每个导览名额有限。", castleHours.id),
    opening: unknown(
      "官网使用逐日开放日历；未将当前月份的 10:00–17:30 外推为全年规律。",
      castleHours.id,
    ),
    openingWindows: null,
    openingCaveat:
      "需要另核当天开放时间、导览场次及余票；地点开放不等于导览可以入场。",
    suggestedMinutes: 90,
    durationBasis: estimate,
    sources: [castleHours, castleTickets],
  },
];
