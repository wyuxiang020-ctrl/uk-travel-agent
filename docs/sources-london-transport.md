# 阶段 3：伦敦与铁路资料记录

核对日期：2026-10-09（用户所在时区 Asia/Shanghai）。数据是人工查看官方页面后的本地资料快照，并非在线实时查询。事实仅作短摘要，未复制评价、用户量、图片或整段原文。

## 伦敦 10 个地点

| 地点 / 数据 ID                                 | 实际阅读的官方来源                                                                                                                                                                                             | 核对与保留的边界                                                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 大本钟与议会周边 `london-big-ben`              | [UK Parliament 预订须知](https://www.parliament.uk/visiting/visiting-and-tours/big-ben-tour/before-you-book/)、[Historic England 地址登记](https://historicengland.org.uk/listing/the-list/list-entry/1226284) | 登塔与外围停留分开。地址登记通过官方搜索索引阅读。未取得外围统一时段，不推断全天开放。                                              |
| 南岸河畔步道 `london-south-bank`               | [South Bank London / Queen’s Walk](https://southbank.london/see-and-do/queens-walk)                                                                                                                            | 读到步行长廊与位置说明；票务、预约和时间不完整，相关字段为 unknown。                                                                |
| 大英博物馆 `london-british-museum`             | [British Museum Visit](https://www.britishmuseum.org/visit)、[Visit London](https://www.visitlondon.com/things-to-do/place/285709-british-museum)                                                              | 主站直读 403；已阅读官方搜索索引，并直读伦敦官方旅游局页面交叉确认普通入场/预约。开放时间保留索引提示但标 unknown，不建自动周时段。 |
| 国家美术馆 `london-national-gallery`           | [National Gallery Plan your visit](https://www.nationalgallery.org.uk/visiting/plan-your-visit)                                                                                                                | 免费普通入场、预约方式、常规周时段；节假日和展厅例外仍需确认。                                                                      |
| V&A `london-v-and-a`                           | [V&A South Kensington Visit](https://www.vam.ac.uk/south-kensington/visit)                                                                                                                                     | 普通入场、预约及常规周时段；周五部分展厅并不随整馆延时。                                                                            |
| 自然历史博物馆 `london-natural-history-museum` | [Natural History Museum Visit](https://www.nhm.ac.uk/visit.html)                                                                                                                                               | 明确读到 2026-10-09 闭馆公告。当前格式不建自动周时段，以免忽略具体日期例外。                                                        |
| 海德公园 `london-hyde-park`                    | [The Royal Parks FAQs](https://www.royalparks.org.uk/visit/parks/hyde-park/faqs)、[Visit London](https://www.visitlondon.com/things-to-do/place/610718-hyde-park)                                              | 公园时段与普通入园/收费活动分开；午夜结束暂未建自动时段，普通散步预约规则 unknown。                                                 |
| 伦敦塔 `london-tower-of-london`                | [HRP Visit](https://www.hrp.org.uk/tower-of-london/visit/)、[HRP Tickets](https://www.hrp.org.uk/tower-of-london/visit/tickets-and-prices/)                                                                    | 收费、购票方式、参观范围；只看到具体日期安排，不外推全年周规律。                                                                    |
| 西敏寺 `london-westminster-abbey`              | [Abbey Visit](https://www.westminster-abbey.org/visit-us)、[日期与票务](https://www.westminster-abbey.org/visit-us/opening-times-and-prices)                                                                   | 旅游参观与礼拜分开；工作中的教堂会临时关闭，必须查看日期日历。                                                                      |
| 科学博物馆 `london-science-museum`             | [Science Museum Visit](https://www.sciencemuseum.org.uk/visit)                                                                                                                                                 | 普通入场及预约；读到 2026-11-11 全天关闭和 11-26 提前关闭。当前格式保留文字，不外推自动周时段。                                     |

所有坐标为人工放置的 approximate 位置，仅用于地图展示，不视作核验后的入口定位或步行路径。建议停留时长为项目编辑估算，不把官方页面的参观建议冒充精确耗时。票价只存“普通免费/付费/特展另查”等已核事实，不保存无法保证仍有效的精确金额。

国家美术馆、V&A 的 `openingWindows` 只描述通常一周，不承诺某个具体日期开放。任何未覆盖星期和 null 时段都应返回需确认，不能推断闭馆或已可行。`knownClosedDates` 单独保存官网明确的完整日期：自然历史博物馆 2026-10-09、科学博物馆 2026-11-11；没有把每年圣诞规则外推为无限日期清单。

资料选择：Tate 主站无法直读，其他来源的晚间时段存在差异，本轮以可直读官方页面的科学博物馆补足 10 个地点，未把第三方镜像当成 Tate 官方站。

## 三对铁路参考

| 原方向                       | 官方参考与来源                                                                                                                                                                                                                                           | 项目排程估算                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| London Marylebone → Oxford   | [Chiltern Railways](https://www.chilternrailways.co.uk/london-oxford-train)：直达，页面平均 83 分钟。此路线从 Marylebone 发车。                                                                                                                          | 铁路 90 + 缓冲 60 = 150 分钟           |
| London Paddington → Bath Spa | [National Rail](https://www.nationalrail.co.uk/discover-by-train/great-british-destinations/visit-bath-by-train/)：直达参考，最快 74 分钟；页面明确存在更长或换乘行程。                                                                                  | 铁路 100 + 缓冲 60 = 160 分钟          |
| Oxford → Bath Spa            | [National Rail](https://www.nationalrail.co.uk/discover-by-train/great-british-destinations/visit-bath-by-train/)：最快 69 分钟。[GWR](https://www.gwr.com/bristol-oxford-direct) 官方索引说明经 Bath Spa 的周一至周六直达服务，主站直读触发机器人验证。 | 铁路/可能换乘 110 + 缓冲 60 = 170 分钟 |

核对方法：Chiltern、National Rail 正文直读成功。GWR 的伦敦–牛津、伦敦–巴斯及新直达路线主站直读均触发 JavaScript/机器人验证；阅读了搜索工具返回的官方索引文本，但最终结构化分钟值采用上述可直读页面。未尝试绕过验证码。未使用票价起步值、缓存实时发车信息或未选日期的频率作为当前班次结果。

反向查询可复用项目时间预算，官方分钟值仍只描述原方向；不保证反向相同。缓冲是项目统一预留，实际市内接驳、候车、施工及行李可能超出。没有真实导航、票务接口、实时延误查询或自动订票。
