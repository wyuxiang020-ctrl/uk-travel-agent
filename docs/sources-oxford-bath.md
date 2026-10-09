# 阶段 3：牛津与巴斯地点资料记录

核对日期：2026-10-09（用户时区 Asia/Shanghai）。本记录配合 `src/data/oxford-places.ts` 和 `src/data/bath-places.ts`，共 20 个地点。资料来自实际读取的官方场馆、牛津大学、National Trust 与官方旅游机构页面，是人工整理的快照，不是实时库存、现场勘察或模型查询结果。

每条 `visiting`、`admission`、`booking`、`opening` 都有独立状态及来源 ID；读取页面没有确认的字段标为 `unknown`。`sourced` 表示文字在核对时有来源支持，不保证未来旅行日照常开放。地图点均为项目近似定位，不是入口定位或导航路线；全部停留分钟数为项目估算，不用于冒充官方游览时长。

## 牛津：10 个地点

| 地点 | 实际读取来源 | 核实内容与保留项 |
| --- | --- | --- |
| 拉德克里夫图书馆 | [Bodleian 参观说明](https://visit.bodleian.ox.ac.uk/plan-your-visit/) | 内部须随适用导览进入、馆内不准摄影。总开放时间不代表此建筑的导览场次，内部开放时窗未知。估算仅对应外观停留。 |
| 博德利老图书馆 | [Bodleian 参观说明](https://visit.bodleian.ox.ac.uk/plan-your-visit/) | 内部须有导览票，预订访客可从 Catte Street 的 Great Gate 前往。保留逐日关闭及余票未知。 |
| 牛津室内市场 | [市场介绍与开放时间](https://oxford-coveredmarket.co.uk/our-story/) | 工作日与周六时间、商铺各自营业已核实。同页对周日/银行假日闭门时间给出 16:00 与 17:00 两种答案；这两类日期不作确定判断。入场与预约规则未明确。 |
| 基督堂学院 | [每日多媒体参观](https://www.chch.ox.ac.uk/visit/daily-multimedia-tours) | 收费、周五放票、建议预订、大厅/座堂可能关闭。使用具体日期售票时段，不编造全年开放规律。 |
| 阿什莫林博物馆 | [场馆参观说明](https://www.ashmolean.org/plan-your-visit)、[大学 GLAM 时间表](https://www.glam.ox.ac.uk/opening-times) | 普通入馆免费且无需预约，团体和收费展览另订；大学页面列每日 10:00–17:00。核对时部分展厅关闭至 10 月中旬，常规时窗不保证每个展厅开放。 |
| 皮特·里弗斯博物馆 | [场馆参观说明](https://prm.web.ox.ac.uk/visit-us) | 免费、经自然历史博物馆进入、团体预约、周一较晚开门。官网明确 2026-10-10 延至 12:00；此部分日调整只以提示保留。 |
| 牛津自然历史博物馆 | [场馆参观说明](https://www.oumnh.ox.ac.uk/visit-us) | 免费、10:00–17:00、16:45 最后入馆，超过 10 人的团体需预约。12 月 24–26 日关闭的年度例外以文字保留。 |
| 牛津植物园 | [季节开放时间](https://www.botanic-garden.ox.ac.uk/opening-hours)、[大学售票页](https://tickets.ox.ac.uk/WebStore/shop/ViewItems.aspx?C=BOT&CG=BGA)、[大学 GLAM](https://www.glam.ox.ac.uk/opening-times) | 区分市中心植物园与树木园；核实季节时间、在线日票、团体预约。GLAM 成人价格与售票页不同，金额采用更直接的大学售票页，不采用 GLAM 的旧价格。 |
| 牛津大学公园 | [开放时间](https://www.parks.ox.ac.uk/opening-times)、[常见问题](https://www.parks.ox.ac.uk/faqs) | 普通公共区域免费、07:45 开园、闭园随日期变化；12 月 24 日全园关闭。洪水封闭及普通预约规则不作保证。 |
| 牛津城堡与监狱 | [开放日历与预约](https://www.oxfordcastleandprison.co.uk/your-visit/opening-times/)、[门票与导览](https://www.oxfordcastleandprison.co.uk/tickets-prices/) | 付费导览、名额有限、建议预订、塔楼限制。当前月日历不可外推到全年；金额保留为依日期与票种核对。 |

## 巴斯：10 个地点

| 地点 | 实际读取来源 | 核实内容与保留项 |
| --- | --- | --- |
| 罗马浴场 | [参观说明](https://www.romanbaths.co.uk/visit)、[2026 年 9–10 月票价](https://www.romanbaths.co.uk/tickets/2026-09-september) | 遗址不能泡浴；提前票、9–10 月开放时段及最后入场时间有明确来源。不把季节报价和时段当作全年规则。 |
| 巴斯修道院 | [参观与票务](https://www.bathabbey.org/visiting/) | 普通观光收费、团体预约、普通票包含 Discovery Museum。官方时间表带季节范围且可能受宗教活动影响，未生成全年机器时窗。 |
| 皇家新月楼 | [地点介绍](https://www.visitbath.co.uk/things-to-do/the-royal-crescent-p56191)、[免费游览列表](https://www.visitbath.co.uk/blog/read/2026/04/free-things-to-do-in-bath-b182) | 区分免费外观与住宅、酒店及 1 号博物馆内部；外观具体每日通行时间与统一预约规则未核实。 |
| 普尔特尼桥 | [地点介绍](https://www.visitbath.co.uk/things-to-do/pulteney-bridge-p56151)、[免费游览列表](https://www.visitbath.co.uk/blog/read/2026/04/free-things-to-do-in-bath-b182) | 免费观赏外观，商铺与活动另计。仅有全年开放条目，不能推导商铺全天营业。 |
| 皇家新月楼 1 号博物馆 | [场馆参观说明](https://no1royalcrescent.org.uk/visit/) | 核实门票、建议预订、带年度范围的开放表。明确 2026-11-16 至 11-28 及 12-25 至 12-26 闭馆，15 个日期写入 `knownClosedDates`。周一假期例外与其他季节未自动处理。 |
| 圆形广场 | [地点介绍](https://www.visitbath.co.uk/things-to-do/the-circus-p56201)、[免费游览列表](https://www.visitbath.co.uk/blog/read/2026/04/free-things-to-do-in-bath-b182) | 免费外观地点；私人建筑内部不在范围。没有具体每日通行时段。未采用免费列表中与地点专页不一致的建筑师归属说法。 |
| 简·奥斯汀中心 | [巴斯馆票价与开放时间](https://janeausten.co.uk/pages/jane-austen-centre-in-bath) | 核实展览收费、建议预订、秋季时段及最后入场。页面春季表写“6 月 31 日”，不生成全年可执行日历。 |
| 霍尔本博物馆 | [参观说明](https://holburne.org/plan-your-visit/)、[票务说明](https://holburne.org/plan-your-visit/ticket-information/) | 普通收费、日票不限制时段、周三下午馆藏免费但临展收费。常规周时窗与银行假日、节日关闭及最后入场限制分开记录。 |
| 皇家维多利亚公园 | [官方旅游介绍](https://www.visitbath.co.uk/things-to-do/royal-victoria-park-p25701)、[免费游览列表](https://www.visitbath.co.uk/blog/read/2026/04/free-things-to-do-in-bath-b182) | 普通公园游览免费，设施与季节活动另查。具体每日时段保留未知。 |
| 普赖尔公园景观花园 | [National Trust 场馆页](https://www.nationaltrust.org.uk/visit/bath-bristol/prior-park-landscape-garden) | 核实票价、普通参观无需预订、坡地条件。日历读取仅对应选定日期，未外推；需查旅行日最后入园时间。 |

## 已知缺口与读取失败

- 每日例外、售票余量、最后入场限制、团体规则与银行假日尚未完整机器编码，检查结果必须保留需确认提示。
- 当前 20 个地点中 5 个具备部分或完整常规周时窗：室内市场、阿什莫林、皮特·里弗斯、自然历史博物馆、霍尔本。其余并非认定闭馆，而是季节/导览/日历资料不能安全压缩为全年周规律。
- [Royal Victoria Park 市政页面](https://www.bathnes.gov.uk/visit-royal-victoria-park)直接读取返回 HTTP 405；搜索返回了官方索引文本，但未以该索引的“全天开放”宣称直接核验完成，数据改用已成功读取的 Visit Bath 页面并保留具体时段未知。
- 一些猜测的旧路径读取失败，如自然历史馆与皮特·里弗斯的 `/plan-your-visit`、巴斯修道院 `/visiting/opening-times/`、牛津城堡 `/plan-your-visit/`；已找到并实际读取上表列出的有效官方路径。失败路径未作为事实来源。
- 没有下载图片、查询实时票务、自动预订或购买，也没有调用模型。坐标及停留时长不能用于声称步行时间或路线可行性。

## 数据检查

- `node node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target es2020 --moduleResolution bundler --module esnext src/data/oxford-places.ts src/data/bath-places.ts`：通过。
- Node 类型擦除加载后的断言：每城 10 条、20 个唯一地点 ID、八个原 ID 保留、26 个独立来源、所有事实来源引用可解析、核对日一致、坐标/停留估算标识及 15 个指定闭馆日期均通过。
- 80 个独立事实字段中 16 个标记 `unknown`，没有用缺失数据补成“免费”“无需预约”或“全天开放”。Node 报告现有包未声明模块类型的非致命告警，未改变工程模块设置。
