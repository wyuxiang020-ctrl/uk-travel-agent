# 地点故事：内容与来源记录

核对日期：2026-10-09（Asia/Shanghai）。本轮为已授权阶段 3 的界面与浏览内容改进，未接入模型、生成行程或保存功能。

`src/data/place-stories.ts` 提供 6 条原创中文地点故事，伦敦、牛津、巴斯各 2 条。每条第一段是官方来源支持的地点背景，第二段以“我们的慢游建议”明确标记编辑建议。标题、摘要与建议为本项目原创，不是官方承诺、用户评价或实地体验。

## 实际阅读的来源

| 故事 ID / 地点 ID | 来源 ID 与本轮实际读取页面 | 采用的事实与边界 |
| --- | --- | --- |
| `london-south-bank` / 同名地点 | `london-south-bank-official`：[South Bank London — Queen’s Walk](https://southbank.london/see-and-do/queens-walk) | 沿河步道、公共艺术与滑铁卢桥附近书市。未把步道推断为全天开放，也不保证到访日书市或场馆开放。 |
| `oxford-bodleian` / `oxford-bodleian-library` | `ox-bodleian-visit`：[Bodleian — Plan your visit](https://visit.bodleian.ox.ac.uk/plan-your-visit/) | 三个空间、内部导览要求、韦斯顿免费展厅、在用图书馆的安静提示。没有把免费展厅等同于老图书馆内部。 |
| `bath-roman-baths` / 同名地点 | `bath-roman-visit`：[The Roman Baths — Visit](https://www.romanbaths.co.uk/visit) | 修道院旁的位置、古罗马铺路石、未经处理的池水不可接触或泡浴。未新增导览库存、价格或全年开放承诺。 |
| `london-national-gallery` / 同名地点 | `london-national-visit`：[National Gallery — Plan your visit](https://www.nationalgallery.org.uk/visiting/plan-your-visit) | 地点、主要入口、普通参观与特展区分、工程可能影响展厅。没有保证某幅作品当前展出。 |
| `oxford-university-parks` / 同名地点 | `ox-parks-faq`：[University Parks — FAQs](https://www.parks.ox.ac.uk/faqs)；`ox-parks-hours`：[Opening times](https://www.parks.ox.ac.uk/opening-times) | 面向公众的绿地、普通公共区域免费、日期相关闭园时间。散步长度及节奏为编辑建议。 |
| `bath-royal-crescent` / 同名地点 | `bath-crescent-visit`：[Visit Bath — The Royal Crescent](https://www.visitbath.co.uk/things-to-do/the-royal-crescent-p56191) | 三十栋十八世纪乔治时代联排建筑、住宅与酒店及博物馆并存。没有暗示私人空间可进入。 |

以上来源 ID 均沿用关联地点的 `TravelPlace.sources`，可通过 `placeId` 连接既有目录读取 URL 与核对日期。页面正文实际读取成功；没有把搜索摘要或未读取页面当作核验结果。

## 图片与地图

- 仅复用既有 `public/images/london.jpg`、`oxford.jpg`、`bath.jpg`，本轮已逐张查看，未下载案例网站素材。
- 伦敦图实际为议会、大本钟与威斯敏斯特桥；牛津图为拉德克里夫图书馆；巴斯图为罗马浴场与修道院。`alt` 描述图片实际内容，`caption` 均明确写“城市印象”。这些图片不能被当作每条故事关联地点的实景照片。
- 版权署名继续遵循 [图片来源记录](image-credits.md)。
- 地图经 `placeId` 连接既有地点近似坐标；故事没有产生新坐标、导航路线或行程修改。

## 内容检查

- 6 个故事 ID 唯一；每城 2 条；首页 3 个固定故事 ID 为 `london-south-bank`、`oxford-bodleian`、`bath-roman-baths`。
- 每条均包含两个正文段落；来源必须可以在关联地点内解析。
- 不使用伪造历史轶事、评分、评论、优惠或用户数据；不复刻 Black Tomato、Atlas Obscura 或 Wanderlog 的品牌文字和图片。
- 已用 Node 类型擦除加载故事与三城目录，逐条检查地点存在、城市一致、来源 ID 可解析以及 6 个唯一 ID，全部通过。摘要为 42–44 字符，正文每段 78–88 字符。
- 单文件 TypeScript 检查通过：`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target es2020 --moduleResolution bundler --module esnext src/data/place-stories.ts`。本地没有独立 Prettier 包，直接运行其假定路径失败；该失败不影响上述数据与类型检查。
