# 首页图片来源与许可

## 2026-10-10 欧洲首页补充

- 文件：`public/images/lake-bled.jpg`，4,032 × 3,024，2,756,711 字节。
- 作品：[Lake Bled from Bled Castle](https://commons.wikimedia.org/wiki/File:Lake_Bled_from_Bled_Castle.jpg)，作者 Kyvuh，2018-07-30 拍摄。
- 许可：[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)，已在 2026-10-10 阅读原始文件页核实；原图下载后目视检查。
- 下载：[原始 JPEG](https://upload.wikimedia.org/wikipedia/commons/3/3b/Lake_Bled_from_Bled_Castle.jpg)。原文件未修改，页面使用响应式裁切与 Next.js 图片优化、模糊占位。
- 用途：首屏与“走进自然”章节的欧洲灵感摄影，明确标记斯洛文尼亚布莱德湖和“此目的地尚未开放规划”，不作为英国地点照片或已支持目的地的证据。
- 首页原三点关系示意已替换为定制理念与案例展示。`public/images/showcase/` 两张截图于 2026-10-10 截取自本项目的七天固定示例与牛津故事，未包含个人需求；桌面截图保留 Leaflet / OpenStreetMap 署名。截图内摄影继续适用下列照片许可，真实地图仍为近似位置、非导航。

## 既有英国图片

这些照片用于首页和阶段 2 规划页的城市氛围展示，不代表实时旅行资料。地点详情已明确注明“城市氛围图 · 非当前地点实景”。来源页面已于 **2026-10-08** 核查。

下载日期：**2026-10-08**。三张原始 JPEG 均已下载至下表路径，经过文件解码、尺寸核查与目视检查。初次受限沙箱网络请求失败，随后在自动审批通过的网络执行中下载成功。

| 城市 / 目标文件 | 原作与来源页面 | 作者 / 署名 | 许可证 | 原图尺寸 |
| --- | --- | --- | --- | --- |
| 伦敦 — `public/images/london.jpg` | [London - Palace of Westminster - Big Ben – Westminster-Bridge - panoramio.jpg](https://commons.wikimedia.org/wiki/File:London_-_Palace_of_Westminster_-_Big_Ben_%E2%80%93_Westminster-Bridge_-_panoramio.jpg) | Edgar El | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | 4048 × 2937 |
| 牛津 — `public/images/oxford.jpg` | [Radcliffe Camera, Oxford.jpg](https://commons.wikimedia.org/wiki/File:Radcliffe_Camera,_Oxford.jpg) | Photograph by Mike Peel ([www.mikepeel.net](https://www.mikepeel.net/)) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | 3244 × 2592 |
| 巴斯 — `public/images/bath.jpg` | [Bath roman baths.jpg](https://commons.wikimedia.org/wiki/File:Bath_roman_baths.jpg) | Draceane | 作者将作品发布至公共领域（PD-self；详见来源页） | 2304 × 1728 |

## 原始文件下载地址

- 伦敦：[原始 JPEG](https://upload.wikimedia.org/wikipedia/commons/5/52/London_-_Palace_of_Westminster_-_Big_Ben_%E2%80%93_Westminster-Bridge_-_panoramio.jpg)
- 牛津：[原始 JPEG](https://upload.wikimedia.org/wikipedia/commons/3/3d/Radcliffe_Camera%2C_Oxford.jpg)
- 巴斯：[原始 JPEG](https://upload.wikimedia.org/wikipedia/commons/5/5b/Bath_roman_baths.jpg)

## 使用记录

- 不使用 Layla 页面素材。
- 三张本地文件为未经过内容修改的原始照片。文件大小：伦敦 3,650,639 字节，牛津 6,161,881 字节，巴斯 689,640 字节。若前端采用 `object-fit: cover`，图片会随容器裁切显示，应在页面图片署名处注明“裁切展示”。
- 如果压缩或生成裁剪后的牛津照片，衍生图片继续遵守 CC BY-SA 4.0，并记录变更。此要求针对图片，不自动适用于独立的应用代码。
- 页面应保留可访问的图片署名、来源及许可链接；推荐在页脚提供“图片来源”，展示上表信息。

## 2026-10-13 · 实拍与对应地理线稿

- 爱丁堡：public/images/atlas/edinburgh-real.jpg，Nono vlf，5317×3545；https://commons.wikimedia.org/wiki/File:Edinburgh_(Calton_Hill).jpg ，CC BY-SA 4.0。
- 德文特湖：public/images/atlas/lakes-real.jpg，Miura-photo（Nathan Atkinson），5897×3937；https://commons.wikimedia.org/wiki/File:Derwentwater_%26_Cat_Bells.jpg ，CC BY-SA 4.0。
- 原图许可于 2026-10-13 查看；均下载、解码并目视检查。伦敦沿用上表原图。内容未改写；网页有响应式裁切、Next 图片优化、轻微降低饱和度及可分离地图覆盖。相关照片衍生展示沿用各自许可。
- 首页地图为本地生成的 SVG，原始公开数据由 https://api.openstreetmap.org/api/0.6/map 获取，日期 2026-10-13；伦敦 bbox -0.130,51.497,-0.116,51.505，爱丁堡 -3.191,55.950,-3.175,55.957，德文特湖 -3.155,54.54,-3.115,54.605。数据 © OpenStreetMap contributors / ODbL，图稿 CC BY-SA 4.0；页面显示署名并链接 /credits。原始抓取与绘制脚本保留 work/redesign/map-*.osm 和 render-maps.mjs。只绘制真实道路/水域，不生成虚构地形线；不是照片透视配准或导航。
- 初次 imagegen 图被用户明确否定，最终不采用，已移至 outputs/redesign-2026-10-13/rejected；image-prompts.json 只为过程留档，不代表交付采用。

## 2026-10-14 · 第二轮影像调整

- 首页五图：爱丁堡、斯洛文尼亚布莱德湖、德文特湖、牛津、巴斯，均沿用已记录来源的实拍。伦敦街景从首页移除。地图覆盖从新版首屏移除；旧 SVG 和来源仅保留过程记录。
- `public/images/editorial/rome.jpg`、`florence.jpg`、`venice.jpg`：用户在本对话提供并明确要求选用的欧洲地图摄影图片，按文件原样复制，页面响应式裁切。原用于本地设计预览，本轮按用户上传完整版本的要求纳入源码归档；未核实商业授权，不标记为开源摄影素材。地点如实标示，不冒充英国摄影。
- `public/images/editorial/celebration-clean.png`：根据用户提供的庆祝场景截图，通过 imagegen 去除原英文标题、按钮与侧边浮层。人物与构图参考原图，属于 AI 编辑后的参考图，不是 Slowtrail 用户照片或评价。本轮纳入用户授权的 GitHub 源码归档，未部署公开应用，不标记为原创实拍。
- 编辑输入：`codex-clipboard-3fbedd0b-fc30-40dc-af53-8a326c466117.png`。输出原文件位于用户 `.codex/generated_images/01a129c1-1608-7af0-b6a0-f0517f6b60bf/exec-889830c6-a64a-4baa-a331-88fc93b95ec9.png`。提示词记录在本次交付 review.md。
