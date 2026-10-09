import type { SupportedCity } from "../lib/travel-types";

export type PlaceStory = {
  id: string;
  placeId: string;
  city: SupportedCity;
  kicker: string;
  title: string;
  summary: string;
  body: string[];
  image: { src: string; alt: string; caption: string };
  sourceIds: string[];
};

const londonImage = {
  src: "/images/london.jpg",
  alt: "泰晤士河畔的英国议会、大本钟与威斯敏斯特桥",
  caption: "伦敦城市印象",
};
const oxfordImage = {
  src: "/images/oxford.jpg",
  alt: "阳光下牛津拉德克里夫图书馆的圆顶与石质立面",
  caption: "牛津城市印象",
};
const bathImage = {
  src: "/images/bath.jpg",
  alt: "巴斯罗马浴场的水池、柱廊与远处的修道院",
  caption: "巴斯城市印象",
};

/**
 * Original editorial stories, checked against each place's existing official sources.
 * Paragraph 1 gives sourced context; paragraph 2 is an editorial travel suggestion.
 * Images are city impressions, not a promise to depict the selected place.
 */
export const PLACE_STORIES: PlaceStory[] = [
  {
    id: "london-south-bank",
    placeId: "london-south-bank",
    city: "london",
    kicker: "沿河漫步",
    title: "把一个下午交给泰晤士河",
    summary:
      "沿着南岸的步行长廊，在桥梁、河景与公共艺术之间停停走走，为伦敦留下一段没有下一站的时间。",
    body: [
      "南岸的 Queen’s Walk 沿泰晤士河展开，步行长廊将河景、公共艺术与文化场馆串在一起。南岸官方介绍提到，滑铁卢桥附近还有书市；沿途的桥梁也提供了观看城市的不同角度。",
      "我们的慢游建议：选一小段河岸走走，不必把整条步道变成打卡清单。看到喜欢的风景便停下来，再决定是否继续；如果想逛书市或进入场馆，出发前另查当天安排，把天气和休息都算进这个下午。",
    ],
    image: londonImage,
    sourceIds: ["london-south-bank-official"],
  },
  {
    id: "oxford-bodleian",
    placeId: "oxford-bodleian-library",
    city: "oxford",
    kicker: "大学城的一页",
    title: "在牛津，读一座图书馆",
    summary:
      "从石墙外的街道走近仍在使用的图书馆，先读懂不同空间的参观方式，再为好奇心选一场导览。",
    body: [
      "博德利的参观空间包括老图书馆、拉德克里夫图书馆与韦斯顿图书馆。前两者内部须持适用的官方导览票，韦斯顿的展厅另有免费参观安排；这些图书馆仍在使用，访客也需要留意安静提示。",
      "我们的慢游建议：先选真正感兴趣的导览，再围绕它安排这一天。在建筑外留一点观察石墙与街道的时间，参观后也别急着赶下一站；预订前确认路线包含哪些空间，让期待与实际能走进的地方相符。",
    ],
    image: oxfordImage,
    sourceIds: ["ox-bodleian-visit"],
  },
  {
    id: "bath-roman-baths",
    placeId: "bath-roman-baths",
    city: "bath",
    kicker: "在水边读历史",
    title: "一池水，另一种时间",
    summary:
      "走进巴斯市中心的罗马浴场，在遗址、石铺路与馆内讲解之间，慢慢拼起古代生活留下的线索。",
    body: [
      "罗马浴场位于巴斯修道院旁，参观内容包括遗址与博物馆。大浴池周围保留着罗马时期的铺路石，馆方提醒路面可能湿滑；这里的池水未经处理，不适合触碰、饮用或下水泡浴。",
      "我们的慢游建议：为馆内讲解留些时间，选一个细节认真看，而不只在水池前拍照。按预约时段抵达，并给入场与休息留出余量；走出遗址后再看周边街道，试着把刚读到的历史带回当下的巴斯。",
    ],
    image: bathImage,
    sourceIds: ["bath-roman-visit"],
  },
  {
    id: "london-national-gallery",
    placeId: "london-national-gallery",
    city: "london",
    kicker: "只为一幅画停留",
    title: "给喜欢的画，多留一会儿",
    summary:
      "在特拉法加广场旁走进国家美术馆，让一幅吸引你的画决定停留，而不是让整份必看清单决定脚步。",
    body: [
      "国家美术馆位于特拉法加广场，馆方以绘画收藏迎接访客，主要入口设在塞恩斯伯里翼。普通参观免费，部分特展单独收费；官网也提醒，工程可能让部分展厅关闭或作品调整位置。",
      "我们的慢游建议：进馆前只给自己一个小主题，可以是风景，也可以是人物。遇到喜欢的作品，先看一会儿再读说明，把另一幅画留到下次也无妨；若为特定作品而来，提前核对它是否正在展出。",
    ],
    image: londonImage,
    sourceIds: ["london-national-visit"],
  },
  {
    id: "oxford-university-parks",
    placeId: "oxford-university-parks",
    city: "oxford",
    kicker: "为行程留白",
    title: "从石墙之间，走进一片绿意",
    summary:
      "在学院与图书馆之外，给牛津大学公园留一段散步时间，让这一天的节奏随着自己的脚步慢下来。",
    body: [
      "牛津大学公园由大学管理，普通公共区域面向大学成员、当地居民与来访者免费开放。它有步行空间，也承接部分活动；闭园时间随日期变化，因此一片开放绿地仍有需要留意的进出边界。",
      "我们的慢游建议：把这里安排在一段需要休息的空白里，走多远由当天体力决定。出发前看好闭园时间和路径公告，到场再选择一段散步；不用为填满行程而加速，也不必把每一次停留都变成任务。",
    ],
    image: oxfordImage,
    sourceIds: ["ox-parks-faq", "ox-parks-hours"],
  },
  {
    id: "bath-royal-crescent",
    placeId: "bath-royal-crescent",
    city: "bath",
    kicker: "建筑的弧线",
    title: "沿着一弯石色，读懂巴斯",
    summary:
      "皇家新月楼将三十栋联排建筑连成弧线，从外观的整体秩序读起，再留意那些仍在继续的日常生活。",
    body: [
      "皇家新月楼由三十栋乔治时代联排建筑组成，建于十八世纪，弧形立面是这里鲜明的建筑特征。今天，楼内仍有私人住宅，也有酒店和一号博物馆；连贯的外观之下，是各自不同的内部空间。",
      "我们的慢游建议：先从公共区域看整条弧线，再慢慢观察门窗与立面的节奏，给拍照之外留几分钟。想进一步了解住宅生活，可以另查一号博物馆；外观散步不包含进入私人住宅、酒店或私人草坪。",
    ],
    image: bathImage,
    sourceIds: ["bath-crescent-visit"],
  },
];
