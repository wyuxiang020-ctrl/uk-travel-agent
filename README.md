# Slowtrail 欧洲慢游

面向中文使用者的欧洲旅行规划原型，英国是当前深入案例。首页提供「发现旅行」和「计划旅行」两条入口；填写或跳过基础信息后，均进入顶部有大对话框的完整计划页。

## 当前版本

2026年10月14日完成两轮反馈改版与需求助手接入，详见 [迭代测试与改进报告](docs/iteration-report-2026-10-14.md) 和 [下一轮交接](docs/next-iteration-handoff.md)。

- 首页：左侧较小无衬线粒子标题、五张实拍轮换、错落三图理念、深色横向提案、整图计划入口；适配手机和减少动态偏好。
- 发现旅行：三条5/7/9天原创英国编辑提案及详情，含住宿分配与注明假设的预算估算。
- 需求对话：中文可跳过基础表单，完整计划顶部 GPT-4.1 理解、补问和候选确认。采用后更新路线；纯偏好修改保留手动住宿，日期或据点改变清除需重查交通。
- 英国路线：25个目录据点、自定义小镇、顺序与晚数、日期、四座机场与城际官方查询、本地保存及备份。
- 新逐日安排：曼城、约克、爱丁堡、皮特洛赫里新增11处来源资料，手动安排、免费检查和恢复。单日模型流程代码已实现，但真实验收未进行，本机入口关闭。
- 历史三城 Agent：伦敦三天真实生成及一次局部修改通过限定场景测试；手动编辑、锁定、差异预览、撤销重做、最近20个版本、本机保存及JSON备份已实现。

复杂三城五天真实生成曾因空白日和调用上限失败，修复后只有离线与接口检查通过，尚未真实复验。没有实时票价/余票、预订、账号云同步、语音或全欧洲自动规划。

## 本地运行

使用 Node.js 24：

```sh
npm ci
npm run preview
```

打开 [本地预览](http://127.0.0.1:3005/)。开发用 `npm run dev`，与生产预览共用3005，一次运行一种。将 `.env.example` 复制到 `.env.local` 后在本机配置；模板调用开关默认关闭，不含密钥和运行账本。详见 [模型配置与验收](docs/stage-4-setup.md)。

需要现有代理的本机可在构建后运行：

```powershell
.\scripts\start-preview.ps1 -ProxyUrl http://127.0.0.1:7897 -NodePath D:\NodeJS\node.exe
```

GitHub 保存源码、素材和文档。动态模型及检查接口需要 Node.js 服务，上传仓库不等于部署公开旅行应用，也不能直接用纯静态 GitHub Pages 运行。

## 页面入口

| 路由 | 用途 |
| --- | --- |
| `/` | 新首页 |
| `/journeys` 与 `/journeys/[slug]` | 编辑提案及详情 |
| `/plan` | 可跳过基础信息 |
| `/plan/route` | 顶部需求对话及完整英国路线 |
| `/plan/days` | 新据点逐日手动安排和检查 |
| `/api/intake` | 状态、受开关与预算保护的需求理解 |
| `/api/uk-daily` | 免费检查及独立开关保护的单日模型 |
| `/api/transport` | 实时提供商未配置状态 |
| `/plan/details`、`/plan/generate`、`/plan/saved` | 历史三城需求、生成和恢复 |
| `/plan/example` | 固定七天示例 |
| `/discover`、`/explore` | 地点故事、资料及时间检查 |
| `/my-trips`、`/about`、`/contact`、`/credits` | 本机旅行、介绍、反馈导出、来源 |

地点资料是带核对日期的本地来源快照。官方入口不代表已取得班次；停留、缓冲和预算含项目估算。不同工作流分开保存，聊天与未采用候选没有完整刷新恢复，也没有跨设备同步。

## 工程检查和文档

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

最新102项离线测试、lint、typecheck及生产构建通过；桌面和390×844模拟手机检查完成。需求助手两轮真实调用验证补问和确认更新。累计原1美元测试账本占用约0.599882美元，含历史失败保守预留，实际扣款以平台为准。工程检查不等于真人体验或模型整体准确率，详见 [完整报告](docs/iteration-report-2026-10-14.md)。

- [逐项反馈](docs/feedback-2026-10-13.md)
- [英国路线](docs/uk-route-planning.md) · [逐日安排](docs/uk-daily-planning.md)
- [历史工作区演示](docs/usage-and-demo.md) · [图片与地图来源](docs/image-credits.md)
- [地点来源](docs/story-sources.md) · [工具协议](docs/tool-contracts.md)
- [2026年10月9日作品案例](outputs/portfolio/case-study.md) · [PRD](outputs/portfolio/prd.md) · [简历内容](outputs/portfolio/resume-copy.md)

旧作品网页及PDF保留原交付版本，新能力以当前源码和报告为准。图片按记录保留来源和许可，用户提供及AI编辑参考素材不是本站摄影或客户评价。没有虚构用户数量、满意度和上线成绩。

## 代码结构

`src/app` 为页面和接口，`src/components` 为交互，`src/data` 为地点及提案，`src/lib` 为需求、规则、模型与预算。使用 Next.js、TypeScript、Tailwind CSS 和 Leaflet。
