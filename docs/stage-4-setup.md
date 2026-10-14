# 第四阶段：模型配置与验收

2026-10-11 最新：GPT-4.1 已配置，伦敦三日真实生成与一次局部修改已通过电脑测试，人工验收后置。产品面向欧洲，当前生成范围只覆盖伦敦、牛津、巴斯的 3–7 天旅行。

## 现在已经接好的流程

填写需求 → 模型理解与必要补问 → 用户确认结构化条件 → 模型选择地点并编排 → 服务端逐日检查 → 有冲突时最多修正两次 → 展示草案、来源与待确认信息。

模型可调用 `list_places`、`get_place`、`get_transfer`、`check_day`。服务端先执行资料目录查询，收到候选后再独立读取地点、检查每日时间与转场；不会因为模型说“检查通过”就接受结果。执行记录区分模型发起的工具与服务端复核。

模型只能选取资料库中的地点；必去点、固定活动、出发日期、起终城市、每日范围和天数独立校验。兴趣匹配、自然语言理解、路线质量仍需真实模型评估。未覆盖的开放时间、余票、同城交通不能被当作已核实事实。

## 本地配置

工程根目录已准备 `.env.local` 空白模板，默认 `TRAVEL_MODEL_ENABLED=false`；它由 Git 忽略，不会随代码上传。若另一个环境没有此文件，从 `.env.example` 复制，勿覆盖已有密钥。

用户确认服务、模型和测试额度后，在本机填写：

```dotenv
TRAVEL_MODEL_ENABLED=false
TRAVEL_MODEL_BASE_URL=
TRAVEL_MODEL_NAME=
TRAVEL_MODEL_API_KEY=
TRAVEL_MODEL_TOKEN_FIELD=max_completion_tokens
TRAVEL_MODEL_MAX_OUTPUT_TOKENS=6000
TRAVEL_MODEL_MAX_ROUNDS=10
TRAVEL_MODEL_TIMEOUT_MS=45000
```

- `BASE_URL` 填服务商的 API 根地址，一般包含 `/v1`；代码追加 `/chat/completions`，不要填写完整端点。HTTPS 为默认要求，本机地址可 HTTP。
- 所选模型必须支持 OpenAI 兼容 Chat Completions 的函数工具调用、`tool_choice: required`、`parallel_tool_calls: false`。本轮仅实测官方 OpenAI GPT-4.1，其他服务商未实测。
- `NAME` 使用服务商给出的准确模型 ID；`API_KEY` 只在本地文件中填写，不发到聊天或网页，不加 `NEXT_PUBLIC_` 前缀。
- 若服务商只接受旧的输出上限字段，将 `TOKEN_FIELD` 改为 `max_tokens`；不要同时发送两个字段。
- 测试额度确认后才将 `ENABLED` 改为 `true`，重启本地 Next 服务。服务状态读取不发起模型调用，也不能证明真实连通。

端点协议依据：[函数工具调用说明](https://developers.openai.com/api/docs/guides/function-calling)、[Chat Completions 接口](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。没有预选供应商，也没有安装供应商 SDK。

## 费用与运行边界

一次“理解需求”和一次“生成行程”是两个独立请求；补问、手动重试、重新生成会增加请求。默认每个请求最多 10 次模型往返，每次输出上限 6,000 tokens；输入包含来源资料和历次工具结果，随着往返增多而变长。这些限制不等于货币预算上限，应在服务商账户另设测试额度。

每次模型请求默认 45 秒超时，整个任务上限 240 秒；工具执行最多 160 次，候选最多两轮修正。网络错误不自动重试。页面可取消；中断已发出的请求仍可能产生费用。

同一进程只允许一个正在执行的任务，30 分钟内重复请求编号不会重复执行；重启后清空。它不是跨机器限流或账户鉴权。当前仅绑定本机 127.0.0.1，不应直接当作公开的付费生成服务部署。

## 如何检查

### 本机代理（2026-10-11 核实）

本机系统代理为 `127.0.0.1:7897`。Node 直连官方 API 超时，通过现有代理读取 `/v1/models` 成功（HTTP 200，包含 `gpt-4.1`）。使用 Node 24.16 的 `--use-env-proxy`，在启动 Node **之前**设置 `HTTPS_PROXY=http://127.0.0.1:7897`、`HTTP_PROXY=http://127.0.0.1:7897`、`NO_PROXY=localhost,127.0.0.1,::1`。仅在 Next 启动后加载的 `.env.local` 中填写代理变量不足以启用启动时代理。未关闭 TLS 校验，未修改系统代理。

当前本机启动脚本为 `work/start-preview.ps1`；先构建、确认 3005 端口没有旧预览占用，再运行该脚本。脚本只适用于当前电脑，路径和代理端口变更后需调整。模型列表验证不代表生成已经验收，也不能证明账户还有可用付费额度。

本轮已授权 OpenAI `gpt-4.1`，最多 1 美元。可设置 `TRAVEL_MODEL_TEST_BUDGET_USD=1`、`TRAVEL_MODEL_TEST_BUDGET_ID=20261011-gpt41-first`。本地服务按 GPT-4.1 标准输入/输出价格逐次预留费用，保留 10% 余量；有有效用量后按用量计入，没有用量则保留全部预留。记录保存在 `work/model-budget-20261011-gpt41-first.json`，重启继续累计，不得删除或更换编号来绕过本轮限制。该保护仅覆盖本工程经此适配器发出的请求，不限制账户内其他应用的调用，平台账单为最终依据。

1. 打开 http://127.0.0.1:3005/plan ，填写想法、城市、日期和天数，进入确认页，再点“进入真实规划”。当前配置已启用；未配置的环境应禁用调用，固定示例可以单独查看。
2. 配置和额度就绪后，先只运行一次理解：有缺失时补问，已知条件与原文不能被悄悄替换。尤其对照必去地点与固定活动。
3. 确认条件后生成，检查实际执行记录、引用地点、每日时间、跨城预留、固定安排及待确认提示。未知开放信息不得显示成保证开放。
4. 对比不同兴趣与节奏，确认内容实质变化；试验未收录目的地、模糊必去点、相互冲突的固定活动。不要为验证费用失控而反复发请求。
5. 在额度内检查取消、服务错误、超时和手动重试。不得出现固定示例冒充模型结果。固定示例始终在 `/plan/example`。

阶段 5 已实现局部修改、锁定、差异、撤销与手动保存恢复。离开前保存，在 /plan/saved 恢复。最新流程与边界见 usage-and-demo.md。

## 代码入口

| 内容 | 入口 |
| --- | --- |
| 模型协议、超时与错误 | `src/lib/agent/model.ts` |
| 需求与候选独立校验 | `src/lib/agent/validation.ts` |
| 工具、补问与终止动作定义 | `src/lib/agent/schemas.ts` |
| 编排、真实工具执行与复核 | `src/lib/agent/runner.ts` |
| 请求边界、并发与重复防护 | `src/lib/agent/http.ts` |
| 状态与流式事件接口 | `src/app/api/agent/route.ts` |
| 补问、确认、执行、取消与重试 | `src/components/agent-planner.tsx` |
| 日程、简明地图与来源 | `src/components/generated-plan-view.tsx` |
| 离线检查 | `src/lib/agent/agent.test.ts` |

离线测试替身只存在于测试文件中，验证流程和异常分支，不作为产品输出。真实验证覆盖一条伦敦生成路径和一次局部修改，更多路线效果及人工体验仍待后续验收。

### 2026-10-14 新需求助手入口

`/plan` 为可跳过的中文基础信息，下一步统一到 `/plan/route`。完整计划顶部大对话框调用 `/api/intake`：模型理解 → 缺失信息补问 → 用户确认 → 更新路线轮廓。它不会自动查询交通票价或预订。`TRAVEL_INTAKE_ENABLED` 控制该入口，沿用原 GPT-4.1 预算账本，不得删除或更换预算编号。用户已明确恢复本轮两轮真实验证；工程与费用记录见 `outputs/redesign-2026-10-14/review.md`。既有新逐日生成开关仍关闭。
