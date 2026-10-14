// Route destinations are independent of the legacy three-city attraction catalogue.
export const NATIONS = { england: "英格兰", scotland: "苏格兰", wales: "威尔士", northernIreland: "北爱尔兰" } as const;
export type Nation = keyof typeof NATIONS;
export type Destination = { id: string; name: string; english: string; nation: Nation; kind: "city" | "town"; custom?: boolean; hub?: string };
export const UK_DESTINATIONS: Destination[] = [
  { id: "london", name: "伦敦", english: "London", nation: "england", kind: "city" },
  { id: "manchester", name: "曼彻斯特", english: "Manchester", nation: "england", kind: "city" },
  { id: "york", name: "约克", english: "York", nation: "england", kind: "city" },
  { id: "liverpool", name: "利物浦", english: "Liverpool", nation: "england", kind: "city" },
  { id: "oxford", name: "牛津", english: "Oxford", nation: "england", kind: "city" },
  { id: "bath", name: "巴斯", english: "Bath", nation: "england", kind: "city" },
  { id: "cambridge", name: "剑桥", english: "Cambridge", nation: "england", kind: "city" },
  { id: "bristol", name: "布里斯托", english: "Bristol", nation: "england", kind: "city" },
  { id: "newcastle", name: "纽卡斯尔", english: "Newcastle upon Tyne", nation: "england", kind: "city" },
  { id: "brighton", name: "布莱顿", english: "Brighton", nation: "england", kind: "city" },
  { id: "windermere", name: "温德米尔", english: "Windermere", nation: "england", kind: "town" },
  { id: "stratford", name: "埃文河畔斯特拉特福", english: "Stratford-upon-Avon", nation: "england", kind: "town" },
  { id: "keswick", name: "凯斯维克", english: "Keswick", nation: "england", kind: "town" },
  { id: "edinburgh", name: "爱丁堡", english: "Edinburgh", nation: "scotland", kind: "city" },
  { id: "glasgow", name: "格拉斯哥", english: "Glasgow", nation: "scotland", kind: "city" },
  { id: "inverness", name: "因弗内斯", english: "Inverness", nation: "scotland", kind: "city" },
  { id: "stirling", name: "斯特灵", english: "Stirling", nation: "scotland", kind: "city" },
  { id: "fort-william", name: "威廉堡", english: "Fort William", nation: "scotland", kind: "town" },
  { id: "st-andrews", name: "圣安德鲁斯", english: "St Andrews", nation: "scotland", kind: "town" },
  { id: "pitlochry", name: "皮特洛赫里", english: "Pitlochry", nation: "scotland", kind: "town" },
  { id: "cardiff", name: "卡迪夫", english: "Cardiff", nation: "wales", kind: "city" },
  { id: "conwy", name: "康威", english: "Conwy", nation: "wales", kind: "town" },
  { id: "llandudno", name: "兰迪德诺", english: "Llandudno", nation: "wales", kind: "town" },
  { id: "belfast", name: "贝尔法斯特", english: "Belfast", nation: "northernIreland", kind: "city" },
  { id: "derry", name: "德里 / 伦敦德里", english: "Derry / Londonderry", nation: "northernIreland", kind: "city" },
];
export const OFFICIAL = {
  rail: { label: "National Rail · 铁路查询", url: "https://www.nationalrail.co.uk/journey-planner/" },
  local: { label: "Traveline · 巴士与末段接驳", url: "https://www.traveline.info/" },
  ni: { label: "Translink · 北爱交通", url: "https://www.translink.co.uk/JourneyPlanner" },
  ferry: { label: "Stena Line · 海渡航线", url: "https://www.stenaline.co.uk/routes" },
};
export const UK_AIRPORTS = [
  { code: "LHR", name: "伦敦希思罗", hub: "london", nation: "england", transport: "https://www.heathrow.com/transport-and-directions", flights: "https://www.heathrow.com/", checked: true },
  { code: "MAN", name: "曼彻斯特", hub: "manchester", nation: "england", transport: "https://www.manchesterairport.co.uk/getting-to-and-from/", flights: "https://www.manchesterairport.co.uk/", checked: true },
  { code: "EDI", name: "爱丁堡", hub: "edinburgh", nation: "scotland", transport: "https://www.edinburghairport.com/transport-links", flights: "https://www.edinburghairport.com/flights", checked: true },
  { code: "BFS", name: "贝尔法斯特国际", hub: "belfast", nation: "northernIreland", transport: "https://www.belfastairport.com/", flights: "https://www.belfastairport.com/", checked: false },
] as const;
export const SOURCE_CHECK_DATE = "2026-10-12";
