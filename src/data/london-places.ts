import type {
  EvidenceSource,
  SourcedFact,
  TravelPlace,
} from "../lib/travel-types";

const checkedOn = "2026-10-09";
const source = (id: string, title: string, url: string): EvidenceSource => ({
  id,
  title,
  url,
  checkedOn,
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
const durationBasis =
  "项目编辑估算，仅供初步安排，不是官方规定或实际游览耗时保证。";

/** Manually reviewed reference data; approximate map points are not entrances or navigation. */
export const LONDON_PLACES: TravelPlace[] = [
  {
    id: "london-big-ben",
    name: "大本钟与议会周边",
    english: "Big Ben & Parliament",
    city: "london",
    category: "历史建筑",
    description:
      "以议会广场附近的钟楼外观为本条目停留范围；登塔是另一项需购票的导览。",
    address: "Parliament Square, Westminster, London SW1A 0AA",
    position: [51.5007, -0.1246],
    coordinateStatus: "approximate",
    visiting: fact(
      "官方登塔导览限 11 岁及以上，需爬 334 级台阶；本条目不代表已预订登塔。",
      "london-big-ben-booking",
    ),
    admission: fact(
      "登塔导览收费；具体票价及资格请查看议会官方票务。",
      "london-big-ben-booking",
    ),
    booking: fact(
      "登塔门票仅通过官方链接在线购买，须核对实际余位。",
      "london-big-ben-booking",
    ),
    opening: unknown(
      "未建立外围空间开放时段；登塔按可预约场次，不能按全天开放处理。",
      "london-big-ben-booking",
    ),
    openingWindows: null,
    openingCaveat: "公共区域可能临时管制；议会活动及安保可能导致导览取消。",
    suggestedMinutes: 45,
    durationBasis: `${durationBasis} 此处只估外围停留，不含登塔。`,
    sources: [
      source(
        "london-big-ben-booking",
        "UK Parliament：Big Ben 预订须知",
        "https://www.parliament.uk/visiting/visiting-and-tours/big-ben-tour/before-you-book/",
      ),
      source(
        "london-parliament-address",
        "Historic England：议会建筑地址",
        "https://historicengland.org.uk/listing/the-list/list-entry/1226284",
      ),
    ],
  },
  {
    id: "london-south-bank",
    name: "南岸河畔步道",
    english: "South Bank / Queen’s Walk",
    city: "london",
    category: "城市漫步",
    description: "沿泰晤士河南岸步行，欣赏河景与沿途公共艺术。",
    address: "Queen’s Walk, Festival Pier, London SE1 8XZ",
    position: [51.5053, -0.1166],
    coordinateStatus: "approximate",
    visiting: fact(
      "Queen’s Walk 是南岸的步行长廊，可沿河散步。",
      "london-south-bank-official",
    ),
    admission: unknown(
      "来源没有单列步道票务规则；沿途景点、活动和消费需分别核对。",
      "london-south-bank-official",
    ),
    booking: unknown(
      "未核到步道统一预约要求；沿途场馆预约不包含在本条目中。",
      "london-south-bank-official",
    ),
    opening: unknown(
      "区域介绍未提供可自动核对的步道开放时段。",
      "london-south-bank-official",
    ),
    openingWindows: null,
    openingCaveat:
      "不把公共步道推断为全天可达；活动、天气与临时管制需现场确认。",
    suggestedMinutes: 90,
    durationBasis,
    sources: [
      source(
        "london-south-bank-official",
        "South Bank London：Queen’s Walk",
        "https://southbank.london/see-and-do/queens-walk",
      ),
    ],
  },
  {
    id: "london-british-museum",
    name: "大英博物馆",
    english: "British Museum",
    city: "london",
    category: "博物馆",
    description: "以世界历史与文化藏品为主题的博物馆。",
    address: "Great Russell Street, London WC1B 3DG",
    position: [51.5194, -0.127],
    coordinateStatus: "approximate",
    visiting: fact(
      "常设展与部分收费特展的参观安排不同，需分别确认。",
      "london-british-visitlondon",
    ),
    admission: fact(
      "常设展免费，特展通常另收费。",
      "london-british-visitlondon",
    ),
    booking: fact(
      "建议提前预约免费入场时段；现场入场受容量限制。",
      "london-british-visit",
      "london-british-visitlondon",
    ),
    opening: unknown(
      "官方索引列出通常 10:00–17:00、周五延长至 20:30，12 月 24–26 日闭馆；本次主站直读受限，需复核当天安排。",
      "london-british-visit",
    ),
    openingWindows: null,
    openingCaveat: "索引可能滞后，未将其转为自动开放时段；展厅也可能临时关闭。",
    suggestedMinutes: 180,
    durationBasis,
    sources: [
      source(
        "london-british-visit",
        "British Museum：Visit（官方搜索索引；直读受限）",
        "https://www.britishmuseum.org/visit",
      ),
      source(
        "london-british-visitlondon",
        "Visit London：British Museum",
        "https://www.visitlondon.com/things-to-do/place/285709-british-museum",
      ),
    ],
  },
  {
    id: "london-national-gallery",
    name: "国家美术馆",
    english: "National Gallery",
    city: "london",
    category: "艺术",
    description: "位于特拉法加广场的绘画美术馆。",
    address: "Trafalgar Square, London WC2N 5DN",
    position: [51.5089, -0.1283],
    coordinateStatus: "approximate",
    visiting: fact(
      "主要入口位于 Sainsbury Wing；个别展厅可能因施工关闭。",
      "london-national-visit",
    ),
    admission: fact("普通入场免费，部分特展收费。", "london-national-visit"),
    booking: fact(
      "可预约免费票以使用快速入场；也接受现场访客。",
      "london-national-visit",
    ),
    opening: fact(
      "通常每日 10:00–18:00，周五至 21:00；12 月 24–26 日及 1 月 1 日闭馆。",
      "london-national-visit",
    ),
    openingWindows: [
      { weekdays: [1, 2, 3, 4, 6, 7], opens: "10:00", closes: "18:00" },
      { weekdays: [5], opens: "10:00", closes: "21:00" },
    ],
    openingCaveat:
      "仅为常规周时段，不覆盖 12 月 24–26 日、1 月 1 日及临时闭馆；须确认指定日期。",
    suggestedMinutes: 120,
    durationBasis,
    sources: [
      source(
        "london-national-visit",
        "National Gallery：Plan your visit",
        "https://www.nationalgallery.org.uk/visiting/plan-your-visit",
      ),
    ],
  },
  {
    id: "london-v-and-a",
    name: "维多利亚与艾尔伯特博物馆",
    english: "V&A South Kensington",
    city: "london",
    category: "艺术与设计",
    description: "南肯辛顿的艺术与设计博物馆，可从感兴趣的展厅开始参观。",
    address: "Cromwell Road, London SW7 2RL",
    position: [51.4966, -0.1722],
    coordinateStatus: "approximate",
    visiting: fact(
      "部分展厅正在维护或改造，官网提供关闭清单。",
      "london-va-visit",
    ),
    admission: fact("普通入场免费，部分展览与活动另收费。", "london-va-visit"),
    booking: fact("普通入场无需预约；收费展览另查票务。", "london-va-visit"),
    opening: fact(
      "通常每日 10:00–17:45，周五至 22:00；部分展厅周五 17:45 后关闭，12 月 24–26 日闭馆。",
      "london-va-visit",
    ),
    openingWindows: [
      { weekdays: [1, 2, 3, 4, 6, 7], opens: "10:00", closes: "17:45" },
      { weekdays: [5], opens: "10:00", closes: "22:00" },
    ],
    openingCaveat:
      "闭馆前 30 分钟开始清场；周五夜间不保证所有展厅开放，圣诞及临时关闭需另核。",
    suggestedMinutes: 150,
    durationBasis,
    sources: [
      source(
        "london-va-visit",
        "V&A：South Kensington visit",
        "https://www.vam.ac.uk/south-kensington/visit",
      ),
    ],
  },
  {
    id: "london-natural-history-museum",
    name: "自然历史博物馆",
    english: "Natural History Museum",
    city: "london",
    category: "博物馆",
    description: "南肯辛顿的自然历史展馆与花园。",
    address: "Cromwell Road, London SW7 5BD",
    position: [51.4967, -0.1764],
    coordinateStatus: "approximate",
    visiting: fact(
      "周末和学校假期可能排队，官网提供展厅与花园参观信息。",
      "london-nhm-visit",
    ),
    admission: fact(
      "普通展厅免费；展览和活动另看相应票务。",
      "london-nhm-visit",
    ),
    booking: fact(
      "可预约免费入场票，官网将预约列为确保入场的方式之一。",
      "london-nhm-visit",
    ),
    opening: fact(
      "通常 10:00–17:50，末次入场 17:30；2026-10-09 临时闭馆，12 月 24–26 日闭馆。",
      "london-nhm-visit",
    ),
    openingWindows: null,
    knownClosedDates: ["2026-10-09"],
    openingCaveat:
      "2026-10-09 因慈善晚会闭馆；官网存在明确日期例外，当前不建立自动周时段。",
    suggestedMinutes: 150,
    durationBasis,
    sources: [
      source(
        "london-nhm-visit",
        "Natural History Museum：Plan your visit",
        "https://www.nhm.ac.uk/visit.html",
      ),
    ],
  },
  {
    id: "london-hyde-park",
    name: "海德公园",
    english: "Hyde Park",
    city: "london",
    category: "公园",
    description: "适合安排散步与休息的城市公园，步行区域与收费活动分开考虑。",
    address: "Hyde Park, London W2 2UH（公园区域）",
    position: [51.5073, -0.1657],
    coordinateStatus: "approximate",
    visiting: fact(
      "公园包含湖区、步行空间和体育设施，部分区域会因活动或维护关闭。",
      "london-hyde-faq",
      "london-hyde-visitlondon",
    ),
    admission: fact(
      "入园免费，体育设施及部分活动收费。",
      "london-hyde-visitlondon",
    ),
    booking: unknown(
      "普通散步未取得独立预约规则；有组织的活动需查看具体票务。",
      "london-hyde-visitlondon",
    ),
    opening: fact(
      "通常每日 05:00 开门，午夜关门；临时关闭以公园公告为准。",
      "london-hyde-faq",
    ),
    openingWindows: null,
    openingCaveat:
      "公园通常于午夜关闭；自动检查暂不判断跨午夜的开放时间，活动与临时关闭仍需另核。",
    suggestedMinutes: 90,
    durationBasis,
    sources: [
      source(
        "london-hyde-faq",
        "The Royal Parks：Hyde Park FAQs",
        "https://www.royalparks.org.uk/visit/parks/hyde-park/faqs",
      ),
      source(
        "london-hyde-visitlondon",
        "Visit London：Hyde Park",
        "https://www.visitlondon.com/things-to-do/place/610718-hyde-park",
      ),
    ],
  },
  {
    id: "london-tower-of-london",
    name: "伦敦塔",
    english: "Tower of London",
    city: "london",
    category: "历史建筑",
    description: "城堡历史与王室珍宝展览结合的付费参观地点。",
    address: "Tower of London, London EC3N 4AB",
    position: [51.5081, -0.0759],
    coordinateStatus: "approximate",
    visiting: fact(
      "门票涵盖开放公共区域；修缮可能影响路线，场地有台阶与不平路面。",
      "london-tower-tickets",
    ),
    admission: fact(
      "普通参观收费，按年龄及票种区分；实时票价请查官方票务。",
      "london-tower-tickets",
    ),
    booking: fact(
      "可提前在线购票，也可当天在售票处购买；实际入场受票务和容量约束。",
      "london-tower-tickets",
    ),
    opening: unknown(
      "官方按日期发布开闭门与末次入场时间，本项目未固化为全年周时段。",
      "london-tower-visit",
    ),
    openingWindows: null,
    openingCaveat:
      "季节、日期与临时路线关闭均需核对，不能用本次页面展示的一周推断其他日期。",
    suggestedMinutes: 180,
    durationBasis,
    sources: [
      source(
        "london-tower-visit",
        "Historic Royal Palaces：Tower visit",
        "https://www.hrp.org.uk/tower-of-london/visit/",
      ),
      source(
        "london-tower-tickets",
        "Historic Royal Palaces：Tower tickets",
        "https://www.hrp.org.uk/tower-of-london/visit/tickets-and-prices/",
      ),
    ],
  },
  {
    id: "london-westminster-abbey",
    name: "西敏寺",
    english: "Westminster Abbey",
    city: "london",
    category: "历史建筑",
    description: "英国加冕礼相关的教堂，旅游参观与宗教活动有不同安排。",
    address: "Dean’s Yard, London SW1P 3PA",
    position: [51.4994, -0.1273],
    coordinateStatus: "approximate",
    visiting: fact(
      "游客参观与日常礼拜分开；主日以宗教活动为主。",
      "london-abbey-visit",
      "london-abbey-times",
    ),
    admission: fact(
      "普通旅游参观收费，参加日常礼拜不收费；资格优惠需单独确认。",
      "london-abbey-times",
    ),
    booking: fact(
      "官方强烈建议提前预约，以提高繁忙时段入场确定性。",
      "london-abbey-visit",
    ),
    opening: unknown(
      "时段按日期和宗教活动变化；官网日历列出具体入场时间，不能把礼拜时间当旅游开放时间。",
      "london-abbey-times",
    ),
    openingWindows: null,
    openingCaveat: "仍在使用的教堂可能临时关闭；需查看指定日期的入场日历。",
    suggestedMinutes: 120,
    durationBasis,
    sources: [
      source(
        "london-abbey-visit",
        "Westminster Abbey：Visit",
        "https://www.westminster-abbey.org/visit-us",
      ),
      source(
        "london-abbey-times",
        "Westminster Abbey：Opening times and prices",
        "https://www.westminster-abbey.org/visit-us/opening-times-and-prices",
      ),
    ],
  },
  {
    id: "london-science-museum",
    name: "科学博物馆",
    english: "Science Museum",
    city: "london",
    category: "博物馆",
    description: "南肯辛顿的科学主题博物馆，普通展馆与互动体验分别安排。",
    address: "Exhibition Road, London SW7 2DD",
    position: [51.4978, -0.1745],
    coordinateStatus: "approximate",
    visiting: fact(
      "主入口位于 Exhibition Road；部分展厅可能因维护关闭。",
      "london-science-visit",
    ),
    admission: fact(
      "普通入场免费，Wonderlab 等体验另有票务。",
      "london-science-visit",
    ),
    booking: fact(
      "官网要求预订免费入场票，按票面到达时段前往。",
      "london-science-visit",
    ),
    opening: fact(
      "通常 10:00–18:00，末次入场 17:15；2026-11-11 闭馆，11-26 提前至 17:00 关闭，12 月 24–26 日闭馆。",
      "london-science-visit",
    ),
    openingWindows: null,
    knownClosedDates: ["2026-11-11"],
    openingCaveat:
      "2026-11-11 全天闭馆；官网另有提前关闭及展厅例外，当前需人工核对指定日期。",
    suggestedMinutes: 120,
    durationBasis,
    sources: [
      source(
        "london-science-visit",
        "Science Museum：Visit",
        "https://www.sciencemuseum.org.uk/visit",
      ),
    ],
  },
];
