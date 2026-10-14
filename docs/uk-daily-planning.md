# 英国路线 → 逐日安排（2026-10-12）

本阶段交付有来源资料、逐日手动安排与检查，以及尚未真实验收的新模型工具流程。欧洲是长期定位，英国为当前案例；目录可扩展不等于全英国资料齐备。

## 使用

1. 从 `/plan` 填写或跳过信息进入 `/plan/route`，确认据点、日期、住宿晚数和交通，再点击“确认路线，展开每天”。
2. 在 `/plan/days` 选择一个完整停留日，查看官方来源与开放限制，手动加入景点并调整时间。
3. 按需填写必去、活动窗口和不可移动的固定安排。“免费检查手动安排”不会调用模型。
4. 检查通过后“采用这一天”，最后“保存路线与每日安排”。未采用的候选、未保存的修改不会持久保留。
5. 支持 JSON 导入导出；导入会重新检查当前资料和时间规则，不信任文件自带的通过标记。导入后仍需保存。

原三城功能继续从 `/plan/details` 进入。新逐日结果存入 `slowtrail.uk-daily.saved.v1`，不覆盖旧三城文档。明确从路线页确认的新路线优先；新标签直接访问时优先恢复已存逐日文档，不被旧路线草案遮盖。不同路线的旧逐日安排不会混入。

## 本轮资料

新增11处、4个据点，核对日期2026-10-12。皮特洛赫里加入目录后，路线目录为25项，仍允许手填其他小镇；旧的同名自定义地点不自动认定为目录地点。

| 据点 | 地点与官方来源 | 使用边界 |
| --- | --- | --- |
| 曼彻斯特 | [科学与工业博物馆](https://www.scienceandindustrymuseum.org.uk/visit)、[国家足球博物馆](https://nationalfootballmuseum.com/visit-us/)、[赖兰兹图书馆](https://www.library.manchester.ac.uk/rylands/visit/index.htm) | 常规开放表、最后入场、已列节假日；修缮及排队另查 |
| 约克 | [铁路博物馆](https://www.railwaymuseum.org.uk/visit)、[约克大教堂](https://yorkminster.org/visit/)、[约克郡博物馆](https://www.yorkshiremuseum.org.uk/your-visit/tickets/) | 大教堂需按日期查询，暂不自动安排；其余依常规资料检查 |
| 爱丁堡 | [苏格兰国家博物馆](https://www.nms.ac.uk/national-museum-of-scotland/plan-your-visit)、[爱丁堡城堡](https://www.edinburghcastle.scot/plan-your-visit/opening-times/)、[苏格兰国家美术馆](https://www.nationalgalleries.org/visit/scottish-national-gallery) | 城堡本轮只录冬季时间；预约、临时闭馆另查 |
| 皮特洛赫里 | [水坝游客中心](https://www.pitlochrydam.com/about/opening-hours-travel-and-location/)、[节日剧院](https://www.pitlochryfestivaltheatre.com/visit-us/) | 剧院读取到的周表已过期，明确标为未知，不用于排程 |

以上11处页面正文实际读取。资料维护截止2027-03-31是项目保守刷新期限，不是运营方保证；期限外暂停编排。开放资料与项目建议游览时长分开，未接入实时搜索。

交通提供 [TPE](https://www.tpexpress.co.uk/travel-updates/timetables)、[ScotRail](https://www.scotrail.co.uk/plan-your-journey/timetables) 官方时刻表入口，正文已读取但未取得所选日期的班次。York–Edinburgh 的 [LNER 查询](https://www.lner.co.uk/routes/york-to-edinburgh-trains/are-there-direct-trains-from-york-to-edinburgh/)仅查到官方检索摘要、正文读取失败，界面明确披露，不当作已核实直达服务。其余路段在路线页查询。

## 已实现与未完成

- 住宿路线展开为抵达、停留、转场、离境日。交通日全部保留，不在未知交通耗时上堆放景点。
- 停留日安排1–3处景点，检查据点、资料缺口、开放/最后入场、必去、固定安排和重叠。活动间30分钟是产品缓冲，不是真实步行或导航时间。
- 新 Agent 先读资料工具、再提交候选；服务器独立检查，错误返回修正，最多4轮；取消、失败和调用上限不覆盖已采用版本。工具流程离线替身测试通过，不等于真实模型效果通过。
- `/api/uk-daily` 的手动检查免费。模型入口受 `TRAVEL_UK_DAILY_ENABLED` 独立开关保护，默认关闭；本机保持关闭，未改密钥配置。未来真实验证继续使用既有模型适配器与同一累计预算账本，不允许无测试预算运行。
- 未完成：新的真实模型验收、整条路线自动分配/优化、跨天景点去重、真实门到门交通、实时票价余票、资料按需在线补查、全英国完整覆盖。新逐日页尚无原工作区的锁定/多版本撤销，采用前保留旧安排，但采用后不会建立完整版本栈。
- 已保存的结果在当前规则下重验；重新安排日期可能使旧备份无效，原文件不会自动删除。备份的 `model` 标签不能单独作为真实调用证据。

## 修改入口

- `src/data/uk-knowledge.ts`：独立的地点资料与交通入口。
- `src/lib/uk-daily.ts`：日期骨架、资料可用性、输入与结果/备份检查。
- `src/lib/agent/uk-daily-runner.ts`、`src/app/api/uk-daily/route.ts`：工具循环和受预算保护的接口。
- `src/components/uk-daily-planner.tsx` 与 CSS、`src/app/plan/days/page.tsx`：逐日界面。
- `src/lib/uk-daily.test.ts`：本轮10项离线测试；完整交付结果见 `outputs/uk-daily/review.md`。
