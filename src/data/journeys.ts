export type Journey = { slug: string; title: string; subtitle: string; days: number; theme: string; image: string; imageAlt: string; stops: { id: string; name: string; nights: number }[]; intro: string; highlights: string[]; itinerary: { title: string; text: string }[]; transport: [number, number]; activities: [number, number] };
// Editorial starting points, not live packages or bookable quotes.
export const JOURNEYS: Journey[] = [
  { slug: "pages-and-stone", title: "在书页与石巷之间", subtitle: "伦敦 · 牛津 · 巴斯", days: 5, theme: "艺术与旧城", image: "/images/oxford.jpg", imageAlt: "牛津拉德克利夫书馆实景", stops: [{id:"london",name:"伦敦",nights:2},{id:"oxford",name:"牛津",nights:1},{id:"bath",name:"巴斯",nights:1}], intro: "从泰晤士河畔走进书页，再让巴斯的石巷收留一个黄昏。五天，留给三座城的不同表情。", highlights:["伦敦的艺术与河岸","牛津的书馆与街巷","巴斯的温泉遗产"], transport:[100,200], activities:[40,100], itinerary:[
    {title:"抵达伦敦",text:"办理入住，留出入境与机场接驳时间。若仍有余力，在住处附近用晚餐。"},
    {title:"河畔与画框",text:"上午选择国家美术馆，下午沿威斯敏斯特一带散步。常设馆与特别展览分开查询，不把整天塞满。"},
    {title:"把一天翻到牛津",text:"离开伦敦前往牛津，抵达后办理入住，漫步拉德克利夫广场。书馆内部参观需另查预约。"},
    {title:"巴斯，石头的暖色",text:"从牛津转场巴斯，以入住和老城步行为主。铁路可能需要换乘，先核对当日车次。"},
    {title:"带着余韵返程",text:"根据离境时间决定是否参观罗马浴场；另留返程机场接驳，未选航班前不固定上午项目。"}] },
  { slug:"northbound", title:"一路向北，听见故事", subtitle:"曼彻斯特 · 约克 · 爱丁堡", days:7, theme:"城市与人文",image:"/images/atlas/edinburgh-real.jpg",imageAlt:"从卡尔顿山看爱丁堡的实拍照片",stops:[{id:"manchester",name:"曼彻斯特",nights:2},{id:"york",name:"约克",nights:2},{id:"edinburgh",name:"爱丁堡",nights:2}],intro:"从工业城市的脉搏，到中世纪的城墙，再走上爱丁堡的山坡。让一条向北的路，串起不同的英国。",highlights:["足球与工业记忆","约克的铁路与城墙","爱丁堡旧城与山坡"],transport:[140,280],activities:[60,130],itinerary:[
    {title:"在曼彻斯特落脚",text:"抵达、接驳、入住。第一晚只为熟悉城市留一点空间。"},
    {title:"城市的两种热爱",text:"从科学与工业博物馆开始，再按兴趣选择国家足球博物馆。球赛不是默认项目，需另查比赛日期和门票。"},
    {title:"向约克出发",text:"核对曼彻斯特至约克的铁路后转场，入住后逛老城，给换乘和行李留足余地。"},
    {title:"一座城的旧时光",text:"铁路博物馆与老城步行二选一或轻量组合；想进约克大教堂，先查当天礼拜与参观日历。"},
    {title:"列车驶向爱丁堡",text:"查询约克至爱丁堡班次，抵达后安顿下来。晚间留给住处附近的街道。"},
    {title:"在旧城与天空之间",text:"选择城堡或苏格兰国家博物馆作为当天重点，天气允许时再去卡尔顿山散步。"},
    {title:"把故事带回去",text:"按离境安排预留机场或车站接驳，不预设返程航班。"}] },
  { slug:"lakes-and-open-skies", title:"向山湖，借几日晴朗", subtitle:"曼彻斯特 · 凯斯维克 · 爱丁堡",days:9,theme:"山湖与慢行",image:"/images/atlas/lakes-real.jpg",imageAlt:"德文特湖与Cat Bells山的真实秋日风景",stops:[{id:"manchester",name:"曼彻斯特",nights:2},{id:"keswick",name:"凯斯维克",nights:3},{id:"edinburgh",name:"爱丁堡",nights:3}],intro:"把城市留在身后，在湖边住久一点。走路、看云、在小镇停下来，最后以爱丁堡的街巷作结。",highlights:["湖区三晚，不追赶风景","给天气留一个空白日","城市与自然相间"],transport:[180,360],activities:[50,150],itinerary:[
    {title:"抵达曼彻斯特",text:"抵达与入住，按航班安排机场接驳。"},{title:"城市里的轻松一天",text:"选择一处博物馆，余下时间留给街区与餐馆。"},{title:"前往湖区",text:"查询铁路至湖区周边车站及凯斯维克末段巴士，不假设小镇有直达列车。当天以交通为主。"},{title:"在德文特湖边",text:"按天气选择湖畔短距离步行；船班和开放情况另查，不预设整日登山。"},{title:"一日留白",text:"好天气可以延长散步，雨天便在小镇休息。户外路线需按体力与当地天气重新选择。"},{title:"告别湖水，前往爱丁堡",text:"先核对小镇巴士与铁路衔接，转场日不安排收费景点。"},{title:"走进旧城",text:"以苏格兰国家博物馆或旧城步行为重点，留时间认识城市。"},{title:"山坡上的风",text:"可选城堡参观与卡尔顿山散步，根据预约和天气取舍。"},{title:"返程",text:"确认离境交通，带着从容的时间离开。"}] }
];
export function journeyBySlug(slug: string | undefined) { return JOURNEYS.find(j => j.slug === slug); }
export function journeyBudget(j: Journey, nightly=90, food=35) { return { low:(j.days-1)*nightly+j.days*food+j.transport[0]+j.activities[0], high:(j.days-1)*180+j.days*60+j.transport[1]+j.activities[1] }; }
export const DESTINATION_CARDS = [
 {id:"london",name:"伦敦",english:"LONDON",image:"/images/london.jpg"}, {id:"oxford",name:"牛津",english:"OXFORD",image:"/images/oxford.jpg"}, {id:"bath",name:"巴斯",english:"BATH",image:"/images/bath.jpg"}, {id:"edinburgh",name:"爱丁堡",english:"EDINBURGH",image:"/images/atlas/edinburgh-real.jpg"}, {id:"keswick",name:"凯斯维克",english:"KESWICK",image:"/images/atlas/lakes-real.jpg"}
];
