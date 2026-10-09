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
const roman = source(
  "bath-roman-visit",
  "The Roman Baths：参观说明",
  "https://www.romanbaths.co.uk/visit",
);
const romanTickets = source(
  "bath-roman-tickets",
  "The Roman Baths：2026 年 9–10 月票价",
  "https://www.romanbaths.co.uk/tickets/2026-09-september",
);
const abbey = source(
  "bath-abbey-visit",
  "Bath Abbey：参观与票务",
  "https://www.bathabbey.org/visiting/",
);
const crescent = source(
  "bath-crescent-visit",
  "Visit Bath：皇家新月楼",
  "https://www.visitbath.co.uk/things-to-do/the-royal-crescent-p56191",
);
const bridge = source(
  "bath-bridge-visit",
  "Visit Bath：普尔特尼桥",
  "https://www.visitbath.co.uk/things-to-do/pulteney-bridge-p56151",
);
const free = source(
  "bath-free-visit",
  "Visit Bath：免费参观地点",
  "https://www.visitbath.co.uk/blog/read/2026/04/free-things-to-do-in-bath-b182",
);
const no1 = source(
  "bath-no1-visit",
  "No.1 Royal Crescent：参观说明",
  "https://no1royalcrescent.org.uk/visit/",
);
const circus = source(
  "bath-circus-visit",
  "Visit Bath：圆形广场",
  "https://www.visitbath.co.uk/things-to-do/the-circus-p56201",
);
const jane = source(
  "bath-jane-visit",
  "Jane Austen Centre：巴斯场馆票价与开放时间",
  "https://janeausten.co.uk/pages/jane-austen-centre-in-bath",
);
const holburne = source(
  "bath-holburne-visit",
  "The Holburne Museum：参观说明",
  "https://holburne.org/plan-your-visit/",
);
const holburneTickets = source(
  "bath-holburne-tickets",
  "The Holburne Museum：门票说明",
  "https://holburne.org/plan-your-visit/ticket-information/",
);
const victoria = source(
  "bath-victoria-visit",
  "Visit Bath：皇家维多利亚公园",
  "https://www.visitbath.co.uk/things-to-do/royal-victoria-park-p25701",
);
const prior = source(
  "bath-prior-visit",
  "National Trust：Prior Park Landscape Garden",
  "https://www.nationaltrust.org.uk/visit/bath-bristol/prior-park-landscape-garden",
);

/** 人工核验的资料快照；地图坐标为近似点，不代表入口或导航路线。 */
export const BATH_PLACES: TravelPlace[] = [
  {
    id: "bath-roman-baths",
    name: "罗马浴场",
    english: "The Roman Baths",
    city: "bath",
    category: "历史遗址",
    description: "参观古代浴场遗址与博物馆的历史场所。",
    address: "Abbey Church Yard, Bath BA1 1LZ",
    position: [51.3811, -2.3596],
    coordinateStatus: "approximate",
    visiting: fact(
      "遗址参观不能下水泡浴；入口位于修道院旁的 Abbey Church Yard。",
      roman.id,
    ),
    admission: fact(
      "收费；2026 年 9–10 月成人提前票为工作日 £26.50、周末及银行假日 £29，非全年报价。",
      romanTickets.id,
    ),
    booking: fact(
      "官网建议提前订票以保证入场；按已订时段到达。",
      romanTickets.id,
      roman.id,
    ),
    opening: fact(
      "2026 年 9–10 月每日 09:00–18:00，最后入场 17:00；其他季节另查。",
      roman.id,
    ),
    openingWindows: null,
    openingCaveat:
      "开放随季节变化；本项目未编码全年日历或最后入场限制。12 月 25、26 日关闭，节日前后另有调整。",
    suggestedMinutes: 120,
    durationBasis: estimate,
    sources: [roman, romanTickets],
  },
  {
    id: "bath-abbey",
    name: "巴斯修道院",
    english: "Bath Abbey",
    city: "bath",
    category: "教堂与建筑",
    description: "仍举行礼拜的教堂，参观包含建筑空间与 Discovery Museum。",
    address: "Bath Abbey, Bath BA1 1LT",
    position: [51.3815, -2.3586],
    coordinateStatus: "approximate",
    visiting: fact(
      "普通参观票包含修道院及 Discovery Museum；礼拜空间与观光安排不同。",
      abbey.id,
    ),
    admission: fact(
      "普通成人观光票核对时为 £9；其他票种及减免以官网为准。",
      abbey.id,
    ),
    booking: fact("可在线或到场购票，10 人及以上团体需预订。", abbey.id),
    opening: fact(
      "当前官网表列周一至五 10:00–17:30、周六至 18:00、周日 13:00–15:30，提前 30 分钟停止入场。",
      abbey.id,
    ),
    openingWindows: null,
    openingCaveat:
      "官网表带季节范围，且教堂活动可能影响参观；未将当前表外推为全年开放承诺。",
    suggestedMinutes: 60,
    durationBasis: estimate,
    sources: [abbey],
  },
  {
    id: "bath-royal-crescent",
    name: "皇家新月楼",
    english: "The Royal Crescent",
    city: "bath",
    category: "城市建筑",
    description: "弧形乔治时代联排建筑群；此记录安排外观停留。",
    address: "Royal Crescent, Bath BA1 2LS",
    position: [51.3875, -2.3684],
    coordinateStatus: "approximate",
    visiting: fact(
      "建筑群包含私人住宅、酒店和 No.1 博物馆；这些内部空间各自管理。",
      crescent.id,
    ),
    admission: fact(
      "外观观赏列入官方免费游览地点；No.1 博物馆单独售票。",
      free.id,
      no1.id,
    ),
    booking: unknown(
      "已读页面未明确外观游览的统一预约规则，不能据此进入私人住宅或草坪。",
      crescent.id,
    ),
    opening: unknown("没有核实到公共观赏区域的具体每日通行时段。", crescent.id),
    openingWindows: null,
    openingCaveat:
      "本条仅对应外观，不将周边公共空间与私人草坪、酒店、博物馆的开放混为一谈。",
    suggestedMinutes: 30,
    durationBasis: estimate,
    sources: [crescent, free, no1],
  },
  {
    id: "bath-pulteney-bridge",
    name: "普尔特尼桥",
    english: "Pulteney Bridge",
    city: "bath",
    category: "河景与建筑",
    description: "两侧设有商铺的桥梁地标，可结合河边外观停留。",
    address: "Bridge Street, Bath BA2 4AT",
    position: [51.3833, -2.3596],
    coordinateStatus: "approximate",
    visiting: fact("桥上有独立商铺，周边可观赏桥与堰坝。", bridge.id),
    admission: fact(
      "外观观赏列入官方免费游览地点，商铺与其他活动另计。",
      free.id,
    ),
    booking: unknown(
      "已读来源未说明外观游览统一预约规则；游船等活动需另查。",
      bridge.id,
    ),
    opening: unknown(
      "官方旅游页仅列 2026 年全年开放，未给出具体每日时段。",
      bridge.id,
    ),
    openingWindows: null,
    openingCaveat:
      "全年开放条目不等于各商铺 24 小时营业；通行情况及河边路径需现场确认。",
    suggestedMinutes: 30,
    durationBasis: estimate,
    sources: [bridge, free],
  },
  {
    id: "bath-no1-royal-crescent",
    name: "皇家新月楼 1 号博物馆",
    english: "No.1 Royal Crescent",
    city: "bath",
    category: "历史住宅博物馆",
    description: "通过室内陈设与声像体验了解乔治时代住宅生活。",
    address: "No.1 Royal Crescent, Bath BA1 2LR",
    position: [51.3873, -2.367],
    coordinateStatus: "approximate",
    visiting: fact("参观含影像与声音体验；安静参观可向场馆咨询。", no1.id),
    admission: fact(
      "核对时成人票 £16；18 岁以下须成人陪同，适用免费规则。",
      no1.id,
    ),
    booking: fact("可现场买票，官网建议预订日期与时段。", no1.id),
    opening: fact(
      "2026-01-31 至 2027-01-03 通常周二至日 10:00–17:30，最后入场 16:30；有指定关闭日。",
      no1.id,
    ),
    openingWindows: null,
    knownClosedDates: [
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-12-25",
      "2026-12-26",
    ],
    openingCaveat:
      "官网明确 2026-11-16 至 11-28、12-25 至 12-26 关闭；周一通常关闭，当地学校假期与银行假日例外。全年周时窗未建立。",
    suggestedMinutes: 75,
    durationBasis: estimate,
    sources: [no1],
  },
  {
    id: "bath-the-circus",
    name: "圆形广场",
    english: "The Circus",
    city: "bath",
    category: "城市建筑",
    description: "三段弧形联排建筑围成的乔治时代街区。",
    address: "The Circus, Bath",
    position: [51.3866, -2.3652],
    coordinateStatus: "approximate",
    visiting: fact("街区由三段弧形历史住宅围成；本条对应建筑外观。", circus.id),
    admission: fact("外观观赏列入官方免费游览地点。", free.id),
    booking: unknown("来源未明确外观游览的统一预约规则。", circus.id),
    opening: unknown(
      "官方旅游页列全年开放，但没有具体每日通行时段。",
      circus.id,
    ),
    openingWindows: null,
    openingCaveat: "本条不代表私人住宅对外开放；道路施工与活动限制尚未核实。",
    suggestedMinutes: 25,
    durationBasis: estimate,
    sources: [circus, free],
  },
  {
    id: "bath-jane-austen-centre",
    name: "简·奥斯汀中心",
    english: "The Jane Austen Centre",
    city: "bath",
    category: "文学与历史",
    description: "通过展览与角色讲解介绍奥斯汀在巴斯的生活及摄政时期文化。",
    address: "40 Gay Street, Bath BA1 2NT",
    position: [51.3846, -2.3626],
    coordinateStatus: "approximate",
    visiting: fact("展览与茶室分别提供预约入口；此条为展览参观。", jane.id),
    admission: fact("核对时线上成人展览票 £18，页面称已含预约费。", jane.id),
    booking: fact("官方强烈建议提前预约。", jane.id),
    opening: fact(
      "秋季 9 月 22 日至 11 月 2 日每日 10:00–17:30，展览提前一小时停止入场；冬夏时段不同。",
      jane.id,
    ),
    openingWindows: null,
    openingCaveat:
      "季节表中的春季结束日写作不存在的 6 月 31 日，未照搬为可执行日历；实际日期需再核。",
    suggestedMinutes: 75,
    durationBasis: estimate,
    sources: [jane],
  },
  {
    id: "bath-holburne-museum",
    name: "霍尔本博物馆",
    english: "The Holburne Museum",
    city: "bath",
    category: "艺术博物馆",
    description: "位于 Great Pulteney Street 一端的艺术馆，设馆藏与临时展览。",
    address: "Great Pulteney Street, Bath BA2 4DB",
    position: [51.3863, -2.3515],
    coordinateStatus: "approximate",
    visiting: fact(
      "普通参观票可看馆藏和展览；商店与咖啡区域可免费进入。",
      holburneTickets.id,
    ),
    admission: fact(
      "核对时全价票 £16.50；周三 15:00 后馆藏免费，临展仍收费。",
      holburneTickets.id,
    ),
    booking: fact(
      "提供线上预购；普通票不限定入场时段，可在所选日使用。",
      holburneTickets.id,
    ),
    opening: fact(
      "通常周一至六 10:00–17:00，周日和银行假日 11:00–17:00；最后入场 16:30。",
      holburne.id,
    ),
    openingWindows: [
      { weekdays: [1, 2, 3, 4, 5, 6], opens: "10:00", closes: "17:00" },
      { weekdays: [7], opens: "11:00", closes: "17:00" },
    ],
    openingCaveat:
      "12 月 24–26 日及 1 月 1 日关闭；银行假日改为 11:00 开门。常规时窗未自动编码这些例外或最后入场限制。",
    suggestedMinutes: 90,
    durationBasis: estimate,
    sources: [holburne, holburneTickets],
  },
  {
    id: "bath-royal-victoria-park",
    name: "皇家维多利亚公园",
    english: "Royal Victoria Park",
    city: "bath",
    category: "公园与散步",
    description: "皇家新月楼附近的绿地，设植物园、游乐与散步区域。",
    address: "Royal Victoria Park, Bath",
    position: [51.3877, -2.373],
    coordinateStatus: "approximate",
    visiting: fact("可散步或野餐；园内设施、活动的安排各自不同。", victoria.id),
    admission: fact(
      "普通公园游览列入官方免费活动；收费设施及活动另计。",
      free.id,
    ),
    booking: unknown(
      "官方旅游页未明确普通散步的预约规则；季节活动需单独核实。",
      victoria.id,
    ),
    opening: unknown(
      "已成功读取的旅游页只列全年开放，具体区域或设施时段未核实。",
      victoria.id,
    ),
    openingWindows: null,
    openingCaveat:
      "暂未取得市政详情页的完整开放说明；本条采用官方旅游局资料，具体区域、活动和设施时段仍需另查。",
    suggestedMinutes: 60,
    durationBasis: estimate,
    sources: [victoria, free],
  },
  {
    id: "bath-prior-park",
    name: "普赖尔公园景观花园",
    english: "Prior Park Landscape Garden",
    city: "bath",
    category: "花园与景观",
    description: "National Trust 管理的山坡景观花园，园内设帕拉第奥式桥。",
    address: "Ralph Allen Drive, Bath BA2 5AH",
    position: [51.3663, -2.3475],
    coordinateStatus: "approximate",
    visiting: fact(
      "上、下园之间有陡坡，不宜把整个园区视为平坦无障碍路线。",
      prior.id,
    ),
    admission: fact(
      "2026-03-01 起标准成人非 Gift Aid 票 £12；会员按资格入园，票价可能调整。",
      prior.id,
    ),
    booking: fact("普通参观无需预订，到场付费或出示会员卡。", prior.id),
    opening: unknown(
      "官网按所选日期显示入园时间，未取得全年简单周规律。",
      prior.id,
    ),
    openingWindows: null,
    openingCaveat:
      "官网说明最后入园后一小时锁门；所读日历只对应选定日期，未外推为旅行日开放时间。",
    suggestedMinutes: 90,
    durationBasis: estimate,
    sources: [prior],
  },
];
