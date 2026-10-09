/**
 * Fixed itinerary fixtures only. Source-backed facts live in data/travel-catalog.
 * These samples are not a travel database, routing result, or model output.
 */
export type CityId = "london" | "oxford" | "bath";

export type City = {
  id: CityId;
  name: string;
  english: string;
  image: string;
};

export type Place = {
  id: string;
  name: string;
  english: string;
  city: CityId;
  position: [number, number];
  category: string;
  description: string;
};

export type TripDraft = {
  idea: string;
  cities: CityId[];
  startDate: string;
  datesFlexible: boolean;
  days: number;
  startCity: CityId;
  endCity: CityId;
  interests: string[];
  pace: "relaxed" | "balanced" | "full";
  mustVisit: string;
  fixedPlans: string;
};

export type DemoDay = {
  day: number;
  city: CityId;
  title: string;
  placeIds: string[];
  transferFrom?: CityId;
};

export const CITIES: City[] = [
  {
    id: "london",
    name: "伦敦",
    english: "London",
    image: "/images/london.jpg",
  },
  {
    id: "oxford",
    name: "牛津",
    english: "Oxford",
    image: "/images/oxford.jpg",
  },
  { id: "bath", name: "巴斯", english: "Bath", image: "/images/bath.jpg" },
];

export const INTEREST_OPTIONS = [
  "历史建筑",
  "艺术与博物馆",
  "书店与学院",
  "街区漫步",
  "美食与咖啡",
  "自然风景",
];

export const PLACES: Place[] = [
  {
    id: "london-big-ben",
    name: "大本钟与议会广场",
    english: "Big Ben & Parliament Square",
    city: "london",
    position: [51.5007, -0.1246],
    category: "历史建筑",
    description:
      "示例活动：从广场看建筑，把河畔漫步作为这一段的开场。位置仅作地图示意，参观条件请查看地点详情。",
  },
  {
    id: "london-south-bank",
    name: "南岸漫步",
    english: "South Bank",
    city: "london",
    position: [51.5055, -0.1169],
    category: "街区漫步",
    description:
      "示例活动：沿河走走，为看风景和休息留一点空白。标记仅代表示意位置，不是导航或已核查的步行路线。",
  },
  {
    id: "london-british-museum",
    name: "大英博物馆",
    english: "The British Museum",
    city: "london",
    position: [51.5194, -0.127],
    category: "艺术与博物馆",
    description:
      "示例活动：把一段时间留给博物馆，按自己的兴趣挑选主题。开放与预约参考请查看地点详情。",
  },
  {
    id: "london-national-gallery",
    name: "英国国家美术馆",
    english: "The National Gallery",
    city: "london",
    position: [51.5089, -0.1283],
    category: "艺术与博物馆",
    description:
      "示例活动：从喜欢的画作开始，体验一段不赶路的艺术时光。开放与展览条件请查看地点详情。",
  },
  {
    id: "oxford-radcliffe-camera",
    name: "拉德克利夫书馆",
    english: "Radcliffe Camera",
    city: "oxford",
    position: [51.7534, -1.254],
    category: "书店与学院",
    description:
      "示例活动：以建筑外观和周围街巷为线索，慢慢认识牛津。此处为外观游览灵感，不代表可以入内。",
  },
  {
    id: "oxford-bodleian-library",
    name: "博德利图书馆",
    english: "Bodleian Library",
    city: "oxford",
    position: [51.754, -1.254],
    category: "书店与学院",
    description:
      "示例活动：把图书馆周边作为学院建筑主题的一站。导览与预约参考请查看地点详情。",
  },
  {
    id: "oxford-covered-market",
    name: "牛津室内市场",
    english: "Oxford Covered Market",
    city: "oxford",
    position: [51.7523, -1.2575],
    category: "美食与咖啡",
    description:
      "示例活动：穿插一段市场闲逛和休息，给当天留出弹性。不同店铺营业情况请单独确认。",
  },
  {
    id: "oxford-christ-church",
    name: "基督教堂学院",
    english: "Christ Church",
    city: "oxford",
    position: [51.7501, -1.2559],
    category: "历史建筑",
    description:
      "示例活动：围绕学院建筑安排一段散步灵感。入内和预约条件请查看地点详情。",
  },
  {
    id: "bath-roman-baths",
    name: "罗马浴场",
    english: "The Roman Baths",
    city: "bath",
    position: [51.3811, -2.3595],
    category: "历史建筑",
    description:
      "示例活动：以历史遗迹为主题，开启认识巴斯的一天。开放与预约参考请查看地点详情。",
  },
  {
    id: "bath-abbey",
    name: "巴斯修道院",
    english: "Bath Abbey",
    city: "bath",
    position: [51.3815, -2.3588],
    category: "历史建筑",
    description:
      "示例活动：留意建筑细节，在周围广场稍作停留。开放与活动安排请查看地点详情。",
  },
  {
    id: "bath-royal-crescent",
    name: "皇家新月楼",
    english: "Royal Crescent",
    city: "bath",
    position: [51.3875, -2.3687],
    category: "街区漫步",
    description:
      "示例活动：以建筑外观为线索散步，为休息留些时间。外观与室内博物馆的参观方式不同，请查看地点详情。",
  },
  {
    id: "bath-pulteney-bridge",
    name: "普尔特尼桥",
    english: "Pulteney Bridge",
    city: "bath",
    position: [51.3832, -2.3572],
    category: "街区漫步",
    description:
      "示例活动：把桥畔风景作为一天的收尾灵感。标记仅作位置示意，不代表已核查的通行或导航路线。",
  },
];

export const DEFAULT_DRAFT: TripDraft = {
  idea: "",
  cities: ["london", "oxford", "bath"],
  startDate: "",
  datesFlexible: true,
  days: 7,
  startCity: "london",
  endCity: "bath",
  interests: [],
  pace: "balanced",
  mustVisit: "",
  fixedPlans: "",
};

const SUPPORTED_CITIES = new Set<string>(CITIES.map((city) => city.id));

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    year > 0 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** A display sequence only; no geography, travel time, or feasibility checks. */
function citySequence(draft: TripDraft): CityId[] {
  if (draft.cities.length === 1) return [draft.startCity];
  return [
    draft.startCity,
    ...draft.cities.filter(
      (city) => city !== draft.startCity && city !== draft.endCity,
    ),
    draft.endCity,
  ];
}

export function validateDraft(draft: TripDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (typeof draft.idea !== "string" || !draft.idea.trim()) {
    errors.idea = "请写一点旅行想法，也可以先使用示例。";
  } else if (draft.idea.length > 500) {
    errors.idea = "旅行想法请控制在 500 字以内。";
  }

  if (!Array.isArray(draft.cities) || draft.cities.length === 0) {
    errors.cities = "请至少选择一座城市。";
  } else if (draft.cities.some((city) => !SUPPORTED_CITIES.has(city))) {
    errors.cities = "当前仅支持伦敦、牛津和巴斯。";
  } else if (new Set(draft.cities).size !== draft.cities.length) {
    errors.cities = "城市选择不能重复。";
  }

  for (const field of ["startCity", "endCity"] as const) {
    const label = field === "startCity" ? "出发" : "结束";
    if (!SUPPORTED_CITIES.has(draft[field])) {
      errors[field] = `请在支持的三座城市中选择${label}城市。`;
    } else if (
      Array.isArray(draft.cities) &&
      !draft.cities.includes(draft[field])
    ) {
      errors[field] = `${label}城市需要包含在所选城市中。`;
    }
  }

  if (!Number.isInteger(draft.days) || draft.days < 3 || draft.days > 7) {
    errors.days = "旅行天数请选择 3–7 天的整数。";
  } else if (!errors.cities && !errors.startCity && !errors.endCity) {
    const segments = citySequence(draft).length;
    if (draft.days < segments) {
      errors.days = `当前示例顺序包含 ${segments} 段城市停留，至少需要 ${segments} 天。请增加天数或减少城市；这只是展示结构要求，不是交通可行性检查。`;
    }
  }

  if (typeof draft.datesFlexible !== "boolean") {
    errors.datesFlexible = "请选择日期是否已经确定。";
  } else if (
    !draft.datesFlexible &&
    (typeof draft.startDate !== "string" || !isCalendarDate(draft.startDate))
  ) {
    errors.startDate = "请选择有效的出发日期（YYYY-MM-DD），或选择日期未定。";
  }

  if (
    !Array.isArray(draft.interests) ||
    draft.interests.some((item) => typeof item !== "string")
  ) {
    errors.interests = "请使用兴趣选项填写旅行偏好。";
  }
  if (!["relaxed", "balanced", "full"].includes(draft.pace)) {
    errors.pace = "请选择一个旅行节奏。";
  }
  for (const field of ["mustVisit", "fixedPlans"] as const) {
    if (typeof draft[field] !== "string" || draft[field].length > 1000) {
      errors[field] =
        `${field === "mustVisit" ? "必去地点" : "固定安排"}请填写为 1000 字以内的文字。`;
    }
  }
  return errors;
}

/**
 * Deterministically assembles fixtures by city/day selection. Other preferences
 * are retained in the draft but do not influence these demonstration contents.
 * Callers must label the result as a sample, not a personalised travel plan.
 */
export function buildDemoDays(draft: TripDraft): DemoDay[] {
  if (Object.keys(validateDraft(draft)).length > 0) return [];

  const sequence = citySequence(draft);
  const baseDays = Math.floor(draft.days / sequence.length);
  const extraDays = draft.days % sequence.length;
  const visits: Record<CityId, number> = { london: 0, oxford: 0, bath: 0 };
  const result: DemoDay[] = [];

  sequence.forEach((city, segmentIndex) => {
    const cityInfo = CITIES.find((entry) => entry.id === city)!;
    const places = PLACES.filter((place) => place.city === city);
    const count = baseDays + (segmentIndex < extraDays ? 1 : 0);

    for (let index = 0; index < count; index += 1) {
      const offset = (visits[city] * 2) % places.length;
      const previousCity = result.at(-1)?.city;
      result.push({
        day: result.length + 1,
        city,
        title: `${cityInfo.name} · 漫步与发现示例`,
        placeIds: [places[offset].id, places[(offset + 1) % places.length].id],
        ...(previousCity && previousCity !== city
          ? { transferFrom: previousCity }
          : {}),
      });
      visits[city] += 1;
    }
  });
  return result;
}
