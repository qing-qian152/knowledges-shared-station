// 由每日例行流程写入；结构见 README「AI 前沿板块 / 投资板块」两节。
window.LEARN_FRONTIER = {
  "2026-10-27": {
    "updated": "2026-10-27 21:30",
    "lead": "今天的主线是「降价」和「便宜也能跑」：GPT-6.1 Terra 把同档能力的价格压到约一半，Kimi K3.1 Pro 把开放权重的分数推到贴着闭源前沿的位置；论文侧最热的一篇，是把「视频」当成模型读写世界的接口。",
    "items": [
      {
        "title": "用视频读、写、分享、与这个世界互动（牛津，HF 日榜第 1）",
        "source": "Hugging Face Daily Papers",
        "url": "https://huggingface.co/papers/2610.31668",
        "publishedAt": "论文 2026-10-26 收录；榜单 2026-10-26 第一，213 个赞",
        "meta": "Oxford · arXiv 2610.31668",
        "takeaway": "把视频当作模型的「通用接口」——不只是生成一段画面，而是让模型从画面里读写动作与因果。",
        "why": "值得看的是问题设定而不是效果：如果模型能从视频里读出「什么导致了什么」，人的日常经验就能直接当训练数据。看这篇只盯一件事——它说的「互动」是预测下一帧，还是真的能改变环境？这决定了它是「视频模型」还是「世界模型」。"
      },
      {
        "title": "RSIHub：把「让 Agent 自己进化」做成可组合框架",
        "source": "Hugging Face Daily Papers（ByteDance）",
        "url": "https://arxiv.org/abs/2610.32253",
        "publishedAt": "2026-10-26 上榜，198 个赞",
        "meta": "arXiv 2610.32253 · NeurIPS 2026 Meta-Agents Workshop",
        "takeaway": "最大提升 +13.5 个百分点，但排名会随设定变化，增益不一定迁移到没见过的任务。",
        "why": "「自进化」是现在最容易吹的方向，这篇的价值在于把失败模式写出来了：换 baseline、换 held-out 集，结论就变。读法建议——跳过摘要直接看消融表，和它自己写的「不迁移」那段。"
      },
      {
        "title": "GPT-6.1 Terra 发布：同档能力，价格约一半",
        "source": "OpenAI 官方",
        "url": "https://openai.com/index/introducing-gpt-6-1-terra/",
        "publishedAt": "2026-10-26 发布",
        "meta": "$1 / $5 每百万 token（输入 / 输出），主打视觉推理与 computer use",
        "takeaway": "价格是第一生产力：看新模型先看单价，再看分数。",
        "why": "对你的实际意义是预算：同样一百次实验，现在跑得起，做 Agent 小项目时「多跑几轮看稳不稳」终于不心疼。别只看它比上一代强多少，看它比同价位的模型强多少——这才是你会真正做的选择。"
      }
    ],
    "repos": [
      {
        "name": "NandhaKishorM/laya",
        "url": "https://github.com/NandhaKishorM/laya",
        "stars": 34449,
        "lang": "Python",
        "what": "非自回归的决策引擎：一次前向就吐出结构化的决策，覆盖 100+ 语言，HF 上有权重。",
        "tryThis": "读 README 里「一次前向 vs 逐 token 生成」的对比，然后把最小示例跑起来，改一句输入，看决策怎么变。",
        "minutes": 25
      },
      {
        "name": "deepseek-ai/deepseek-harness",
        "url": "https://github.com/deepseek-ai/deepseek-harness",
        "stars": 263396,
        "lang": "TypeScript",
        "what": "「Everything is a Plugin」的 Agent 运行时，插件即一切——很适合拿来学工程结构。",
        "tryThis": "只做一件事：找一个最小的插件目录，读它的清单和入口文件，手画一张「一个请求进来，插件在哪一步被调用」的流程图。",
        "minutes": 30
      },
      {
        "name": "eternity4719/HowToLiveBetter",
        "url": "https://github.com/eternity4719/HowToLiveBetter",
        "stars": 69882,
        "lang": "HTML",
        "what": "不是 AI 项目，但写法值得抄：每一条建议都写清成本、收益和证据等级。",
        "tryThis": "抄它的结构——挑一个你正在纠结的选择，用「成本 / 收益 / 证据等级」三栏写满一页，再决定。",
        "minutes": 15
      }
    ],
    "task": {
      "title": "跑通 200 行 GPT，并说出它到底在干什么",
      "goal": "从零训练一个能生成名字的 GPT，然后把「它为什么会学」讲到别人能听懂",
      "time": "45–60 分钟",
      "url": "https://karpathy.github.io/2026/02/12/microgpt/",
      "steps": [
        "打开 microgpt 那篇文章，把代码整段存成本地 microgpt.py，先原样跑一次，记下输出。",
        "在训练循环里把四步标出来：logits 怎么来 → softmax 变成概率 → loss 怎么算 → backward 调整了什么（用注释写在对应行旁边）。",
        "只改一个超参（层数、学习率或训练轮数），再跑一次，对比两次输出像不像名字。",
        "把两次输出 + 四步解释写成 10 行以内的笔记。"
      ],
      "done": "验收：不看文章，你能用自己的话讲清「模型靠什么把随机输出变成像名字的输出」，而且两次输出确实不一样。做不到就回去重看 backward 那一段。",
      "output": "microgpt-实验.md：两次输出 + 四步解释 + 你改的那个超参和结果"
    },
    "concept": {
      "term": "KV Cache",
      "line": "把已经算过的注意力键和值存下来，下一步只计算新增 token。省的是重复计算，不是精度；代价是显存——今天量子位那条「KV Cache 砍 99%」，砍的就是这份显存账。"
    },
    "keywords": [
      "降价",
      "开放权重",
      "自进化"
    ],
    "note": "榜单上的 +13.5 个百分点，不等于能搬到你的任务上。看论文先看它的 held-out 集和比较对象。"
  },
  "2026-10-28": {
    "updated": "2026-10-28T07:20:00Z",
    "lead": "今天三条主线：agent 的「过程可靠性」开始被单独测量；工具调用训练不再靠堆成功轨迹；视频模型开始抢着主动开口。",
    "items": [
      {
        "title": "Trial by Trace: Benchmarking AI Agent Harnesses for Reliability and Failure Attribution",
        "url": "https://huggingface.co/papers/2610.32285",
        "source": "Hugging Face Daily Papers 第 2 名（277 upvote）· TraceLite AI",
        "publishedAt": "2026-10-23 上传 arXiv，10-27 上榜",
        "meta": "4 个 harness × 9 个模型 × 95 个任务 = 3420 次运行",
        "takeaway": "任务成功不等于过程可靠：31.1% 的运行做对了任务，却至少违反一条 harness 判据。",
        "why": "它把「agent 靠什么才算靠谱」拆成上下文、执行、治理、生命周期、可观测、工具、验证 7 块，并给了可执行的判据（代码 19★ 开源）。以后看到「成功率 90%」你就有第二把尺子了。"
      },
      {
        "title": "Trajectory2Gym: Decision-Grounded Compositional Interaction Synthesis for Tool-Use Agents",
        "url": "https://huggingface.co/papers/2610.33568",
        "source": "Hugging Face Daily Papers 第 1 名（346 upvote）· ant-international",
        "publishedAt": "2026-10-24 上传 arXiv，10-27 上榜",
        "meta": "5 个 Qwen3 规模，τ-bench / τ²-bench / BFCL 三榜平均 +16.9~+29.8 个百分点",
        "takeaway": "喂给模型的「成功轨迹」可能是坏教材——关键是每一步能不能从它当时看得见的信息推出来。",
        "why": "论文里 parent normalization 单独就有 +8.04 分（Qwen3-8B），说明「样本怎么加权」比「多收样本」更值钱；34,772 条交互候选池和 5 个 checkpoint 都开源了。"
      },
      {
        "title": "RoboHarness: A Simple Harness Outperforms VLA and World Action Models",
        "url": "https://huggingface.co/papers/2610.14018",
        "source": "Hugging Face Daily Papers · 浙江大学",
        "publishedAt": "2026-10-16 上传 arXiv，10-27 上榜",
        "meta": "GitHub 269★ · BEHAVIOR Challenge 2025",
        "takeaway": "不训练机器人专用模型，而是给通用 agent 一个「视觉-几何控制面板」，它就在机器人基准上超过了 SOTA VLA。",
        "why": "又一次证明 harness（外壳）本身能改写强弱：同一个模型，换一层外壳分数就变。你做 agent 项目时，外壳是值得单独优化的一层。"
      },
      {
        "title": "StreamVibe: Proactive Video Agents for Evolving User Intent",
        "url": "https://huggingface.co/papers/2610.34662",
        "source": "Hugging Face Daily Papers 第 3 名（247 upvote）· Google",
        "publishedAt": "2026-10-26 上传 arXiv，10-27 上榜",
        "meta": "4.1K 评测样本 + 85K 训练样本；响应时机与答案质量 +10.7%，叠加记忆 harness 再 +12.3%",
        "takeaway": "视频模型正在从「你问我答」转向「猜你想干嘛、什么时候该开口」。",
        "why": "隐式意图（比如用户在看网页时心里想「下一步点哪」）和动态意图才是真实场景；这条线做产品的人该盯着。"
      }
    ],
    "repos": [
      {
        "name": "ollama/ollama",
        "url": "https://github.com/ollama/ollama",
        "stars": 185067,
        "lang": "Go",
        "what": "一条命令在本机跑开源大模型（Qwen、DeepSeek、GLM 等），有 OpenAI 兼容接口，不用显卡也能跑小模型。",
        "tryThis": "装好后从 ollama.com/library 挑一个 4B 级小模型跑起来，问它一道你专业课的问题，记下首字延迟和答得怎么样。",
        "minutes": 25
      },
      {
        "name": "rohitg00/ai-engineering-from-scratch",
        "url": "https://github.com/rohitg00/ai-engineering-from-scratch",
        "stars": 74794,
        "lang": "Python",
        "what": "从零学 AI 工程的路线图 + 可跑代码：把「会用 API」补成「知道系统怎么搭」。",
        "tryThis": "读 README 的路线图，选和你现在最相关的一章，把里面最小可跑示例跑通，写 3 行笔记：学到什么、卡在哪。",
        "minutes": 30
      },
      {
        "name": "datawhalechina/leedl-tutorial",
        "url": "https://github.com/datawhalechina/leedl-tutorial",
        "stars": 16834,
        "lang": "Jupyter Notebook",
        "what": "《李宏毅深度学习教程》中文版（开源电子书），讲得比大多数网课更适合自学。",
        "tryThis": "只看「自注意力」那一章，然后用一句话向同学解释 Q、K、V 各在干什么。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "给你的小模型做一次「过程体检」",
      "goal": "复刻 Trial by Trace 的核心发现：算一算「答案对了但格式不合规」的比例。",
      "time": "45–60 分钟",
      "url": "https://huggingface.co/papers/2610.32285",
      "steps": [
        "选 5 道有唯一答案的题（比如 17×23、把 \"a=1;b=2\" 转成 JSON、给一句话数词数），每题写下标准答案和格式要求（例如「只输出 JSON，不要解释」）。",
        "用本地 ollama 模型（或任意在线模型的免费额度）跑这 5 题，把原始输出一字不改存到 eval/raw.txt。",
        "写 check.py：先判答案对不对，再判格式合不合规（json.loads 能不能解析、有没有多余句子），输出表格：题号 / 答案对 / 格式对。",
        "数一下「答案对但格式错」有几条，算比例，和你以为的对比，也对照论文的 31.1%。"
      ],
      "done": "eval/report.md 里有这张表，加一句结论：你的小模型最大的问题是答错，还是不合规。",
      "output": "eval/raw.txt + check.py + eval/report.md"
    },
    "concept": {
      "term": "Harness（外壳 / 执行框架）",
      "line": "同一个模型，换一层外壳——怎么给上下文、怎么调工具、怎么校验结果——分数能差出一大截。Trial by Trace 测的 4 个 harness，宏平均只有 59.8%–72.0%。"
    },
    "keywords": [
      "过程可靠性",
      "成功轨迹",
      "外壳",
      "主动交互"
    ],
    "note": "31.1% 这个数字提醒你：看到「任务成功率 90%」，先问一句——它是怎么做到的，中间有没有偷工。"
  },
  "2026-11-03": {
    "lead": "今天的素材指向同一件事：模型能力不再只靠堆参数和堆上下文，成本与判断正在被重新分配。论文在压缩推理、压缩上下文、按需调用算力，工程侧则把前沿模型塞进本地、插件和菜单栏，连磁带这种老存储也因归档需求回潮。",
    "items": [
      {
        "title": "短上下文频繁压实，长任务精度几乎不掉",
        "url": "https://huggingface.co/papers/2611.05306",
        "source": "Hugging Face 每日论文 · 第 4 名（1 赞）",
        "publishedAt": "2026-11-03 上榜",
        "meta": "前沿开源权重模型后段 token 成本最高可达前段 7 倍",
        "takeaway": "长上下文不是免费的，反复压实到短上下文可能更划算。",
        "why": "作者抓住一个常被忽略的成本结构：越靠后的 token 生成越贵，于是用频繁压实把上下文维持在短窗口，在长程与长输入任务上测精度损失。它挑战的是「上下文越长越好」的默认设定，但摘要未给出具体任务清单，结论仍需按场景验证。"
      },
      {
        "title": "让模型自己判断何时停止推理",
        "url": "https://huggingface.co/papers/2611.04814",
        "source": "Hugging Face 每日论文 · 第 3 名（6 赞）",
        "publishedAt": "2026-11-03 上榜",
        "meta": "作者：Muyao Yuan、Liyan Xu、Weizhan Zhang",
        "takeaway": "推理压缩的着力点从整条轨迹移到每一步的局部决策。",
        "why": "现有推理压缩多在整条思维链上做删减，这篇把问题改写成「当前状态下还需不需要继续想」的局部判断，用偏好学习训练这个决策。问题设定更贴近推理成本的真实来源，但摘要截断，压缩率与精度权衡的具体数据尚不完整。"
      },
      {
        "title": "城市级模拟器评测模型做刑侦与监控",
        "url": "https://huggingface.co/papers/2611.04785",
        "source": "Hugging Face 每日论文 · 上榜（0 赞）",
        "publishedAt": "2026-11-03 上榜",
        "meta": "构建城市级模拟引擎 Kierston 与配套基准 KierstonBench",
        "takeaway": "把「模型能否胜任办案」变成可打分的问题，而不是演示。",
        "why": "真实警务部署缺少可对照的标准答案，无法给模型结论打分。作者据其摘要搭建了 Allentown, PA 的城市级模拟环境，让记录收集与分析任务在已知真相下被评测。价值在于补上评测空白，但模拟环境与真实办案的差距仍是核心疑问。"
      },
      {
        "title": "Postman 被指静默装 AI 插件并试图上传 API 数据",
        "url": "https://github.com/postmanlabs/postman-app-support/issues/14370",
        "source": "Hacker News · 1319 分",
        "publishedAt": "2026-11-03 上榜",
        "meta": "447 条评论",
        "takeaway": "开发工具的默认行为正在成为数据边界的新风险点。",
        "why": "帖子指向 Postman 应用支持仓库的 issue，称其自动安装 AI 插件并尝试共享全部 API 数据。API 调试工具天然握着密钥与请求样本，一旦默认开启外传，影响面远超单个插件。讨论热度说明开发者对「静默变更」的容忍度很低。"
      }
    ],
    "repos": [
      {
        "name": "Niko1221/Strata",
        "url": "https://github.com/Niko1221/Strata",
        "stars": 39645,
        "lang": "C++",
        "what": "在普通消费级硬件上一键跑 Qwen3.8-Flash-Next，并在本地起一个兼容 OpenAI 与 Anthropic 的接口。",
        "tryThis": "按 README 下载 Windows 或 Linux 安装包，启动后在 localhost 用 curl 调一次 chat completions，确认返回正常。",
        "minutes": 20
      },
      {
        "name": "yetone/magpie",
        "url": "https://github.com/yetone/magpie",
        "stars": 29527,
        "lang": "Go",
        "what": "把各家编码代理和模型接到一个菜单栏入口，比如让 Codex 跑在 DeepSeek 上、Claude Code 跑在 Kimi 上。",
        "tryThis": "克隆仓库后按 README 编译并启动，在菜单栏里填入一个已有模型的 Key，切换一次后端再发一条测试请求。",
        "minutes": 20
      },
      {
        "name": "Gathin23/cleanyourtv",
        "url": "https://github.com/Gathin23/cleanyourtv",
        "stars": 51673,
        "lang": "Python",
        "what": "通过 Wi-Fi 用 adb 清理 Android TV 或 Google TV 的预装应用，换成接近 Apple TV 的简洁桌面。",
        "tryThis": "在电视上打开开发者调试并记下 IP，运行仓库脚本连接设备，先只列出可卸载包，确认清单后再执行清理。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "今天上手做这一件",
      "goal": "用本地推理引擎在 20 分钟内跑通一次兼容 OpenAI 格式的调用。",
      "time": "约 20 分钟",
      "url": "https://github.com/Niko1221/Strata",
      "steps": [
        "下载并安装 Strata 对应平台版本，启动服务",
        "确认本地端口已监听，记下 base URL",
        "用 curl 向 chat completions 发一条短提示并查看返回"
      ],
      "done": "收到结构完整的 JSON 响应，且模型名与本地加载的一致。",
      "output": "一份可复用的本地调用命令，之后可替换进任何兼容 OpenAI 的客户端。"
    },
    "concept": {
      "term": "上下文压实（context compaction）",
      "line": "把已积累的长对话定期摘要成短上下文，用少量信息损失换更低的生成成本。"
    },
    "keywords": [
      "推理压缩",
      "上下文成本",
      "本地推理"
    ],
    "note": "论文榜点赞数普遍很低，热度不等于结论可靠，先看方法再看数字。",
    "updated": "2026-11-04T11:42:00.229Z"
  },
  "2026-11-04": {
    "lead": "今天的主线是「模型之外的东西」开始被认真对待：研究者不再只比分数，而是考察模型是否具备人类的研究品味、能否把历史信息真正用于长程生成、能否直接读页面图像而非 OCR 文本；工程侧则围绕本地推理、权重可解释性与数据边界展开争论，工具链正把前沿模型搬到个人电脑上。",
    "items": [
      {
        "title": "IdeaTaste：用 2025 文献快照考模型的研究品味",
        "url": "https://huggingface.co/papers/2611.03424",
        "source": "Hugging Face 每日论文 · 25 赞",
        "publishedAt": "2026-11-02 上榜",
        "meta": "文献快照冻结于 2025 年，对照 2026 年同社区实际发表",
        "takeaway": "衡量 AI 科学家不只看执行力，还要看它选题、选方法的方向感。",
        "why": "它把「研究品味」拆成可打分任务：只给模型截至 2025 年的文献，让它写研究提案，再与同一社区 2026 年真正发表的工作比对。这绕开了「会不会做实验」，直接测判断力，也为评估 AI 科研助手提供了一个可复现的基准设定。"
      },
      {
        "title": "Order-Only 蒸馏：只学教师偏好哪个词",
        "url": "https://huggingface.co/papers/2611.02112",
        "source": "Hugging Face 每日论文 · 27 赞",
        "publishedAt": "2026-11-01 上榜",
        "meta": "",
        "takeaway": "教师概率里混着「偏好」和「自信」，后者小模型学不来也不必学。",
        "why": "在策略蒸馏中，学生模型匹配教师 token 概率，但概率同时编码了教师偏好哪些词与教师有多自信；后者反映教师自身容量与校准，小模型难以复现。作者据此只保留排序信息，把「学什么」与「学多准」解耦，是蒸馏目标设计上一个干净的切口。"
      },
      {
        "title": "History Forcing：让视频世界模型记住消失的画面",
        "url": "https://huggingface.co/papers/2611.02782",
        "source": "Hugging Face 每日论文 · 5 赞",
        "publishedAt": "2026-11-02 上榜",
        "meta": "",
        "takeaway": "长程视频生成的一致性，取决于能否把历史帧压成对当前预测的约束。",
        "why": "少步自回归视频扩散能高效生成，但主体或场景离开视野再回来时容易前后不一致。作者指出已有蒸馏方法没有充分利用更丰富的历史信息去约束学生模型的当前预测，并提出相应蒸馏方案，问题设定直指长 rollout 的一致性瓶颈。"
      },
      {
        "title": "DR Pixel：让 VLM 直接读论文页面图像",
        "url": "https://huggingface.co/papers/2611.03097",
        "source": "Hugging Face 每日论文 · 5 赞",
        "publishedAt": "2026-11-02 上榜",
        "meta": "",
        "takeaway": "深度研究代理不必先把论文压成 OCR 文本，表格公式可留在原版面里。",
        "why": "现有深度研究代理通常把论文降维成 OCR 抽取的纯文本，表格、图与公式的信息在预处理阶段就丢了。DR Pixel 改为直接检索并推理渲染后的页面图像，据其摘要称为首个开源端到端多模态方案，把「读文档」的粒度从字符提升到版面。"
      }
    ],
    "repos": [
      {
        "name": "Niko1221/Strata",
        "url": "https://github.com/Niko1221/Strata",
        "stars": 39336,
        "lang": "C++",
        "what": "把 Qwen3.8-Flash-Next 装到普通消费级硬件上，一键安装后在本地起一个兼容 OpenAI 与 Anthropic 的接口。",
        "tryThis": "按仓库说明下载 Windows 或 Linux 安装包，启动后在终端执行 curl 请求 http://localhost 的 /v1/chat/completions，确认能返回文本。",
        "minutes": 20
      },
      {
        "name": "yetone/magpie",
        "url": "https://github.com/yetone/magpie",
        "stars": 29098,
        "lang": "Go",
        "what": "在菜单栏里统一管理各家编码代理，把 Codex 接到 DeepSeek、Claude Code 接到 Kimi 这类组合集中配置。",
        "tryThis": "克隆仓库后按 README 编译或安装，打开菜单栏图标，新增一个模型配置并填入自己的 API Key，然后发一条测试对话。",
        "minutes": 15
      },
      {
        "name": "deepseek-ai/DeepInfer",
        "url": "https://github.com/deepseek-ai/DeepInfer",
        "stars": 25236,
        "lang": "Python",
        "what": "DeepSeek 官方开源的大规模高性能推理框架，用来在自有硬件上部署其模型。",
        "tryThis": "先读 README 的硬件要求与快速开始，按示例命令拉起最小配置的服务，再用自带脚本发一次推理请求看吞吐日志。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "今天上手做这一件",
      "goal": "在本地跑通一个兼容 OpenAI 接口的推理服务，并用 curl 打通一次请求。",
      "time": "约 20 分钟",
      "url": "https://github.com/Niko1221/Strata",
      "steps": [
        "按仓库说明完成一键安装，确认进程已启动并监听本地端口",
        "用 curl 向 localhost 的 /v1/chat/completions 发送一条简单提问",
        "把返回的 JSON 里的回复内容打印出来，并记录首次响应耗时"
      ],
      "done": "终端能稳定返回模型回复，且你知道该服务的端口与接口路径。",
      "output": "一份可复用的本地调用命令与一条耗时记录。"
    },
    "concept": {
      "term": "研究品味（research taste）",
      "line": "指判断该读什么、该攻哪个问题、该试哪种方法的取向，如今被当作可测量的模型能力。"
    },
    "keywords": [
      "研究品味评测",
      "策略蒸馏",
      "页面级深度研究"
    ],
    "note": "榜单点赞数只反映当天关注度，不代表论文结论已被复现。",
    "updated": "2026-11-04T01:55:25.940Z"
  },
  "2026-11-05": {
    "lead": "今天的主线是「对齐的缝隙」：模型说得对不等于做得对，长上下文失效的根因不是长度而是干扰，推理加速也会改变推理本身。与此同时，开源权重与本地推理工具继续把前沿模型推向消费级硬件，工程侧的旧债正被 AI 逼着一起还。",
    "items": [
      {
        "title": "视觉扰动可让 VLA 嘴上说一套、手上做一套",
        "url": "https://huggingface.co/papers/2611.04166",
        "source": "Hugging Face 每日论文 · 热度榜",
        "publishedAt": "2026-11-03 发表",
        "meta": "热度 1 赞；摘要截断于文本与动作共享接口处",
        "takeaway": "可读的推理文本不能当作具身安全的监控信号，文本与动作可以完全脱钩。",
        "why": "以往对 VLA 推理的攻击会篡改 rationale 本身，文本里留下痕迹；这篇据其摘要指出，仅靠视觉扰动就能在生成文本逐字不变的情况下改变物理动作。问题设定直指「用自然语言解释来监督机器人」这一做法的可信度，方法上把文本与动作的共享接口当作攻击面。"
      },
      {
        "title": "长上下文检索失败：干扰比长度更致命",
        "url": "https://huggingface.co/papers/2611.04169",
        "source": "Hugging Face 每日论文 · 热度榜",
        "publishedAt": "2026-11-03 发表",
        "meta": "5 个开源模型，0.5B–3B，四个模型家族",
        "takeaway": "中性填充几乎不掉分，同格式的干扰陈述才把检索准确率打崩。",
        "why": "作者用对照实验把「长度」与「竞争」拆开：Qwen2.5-1.5B 在 32K token 中性填充下准确率仍为 0.97–1.00，换成与证据同格式的陈述则跌到 0.16–0.33。这把 context rot 的归因从容量问题转向注意力竞争，也提示评测长上下文时应控制干扰项格式。"
      },
      {
        "title": "推测解码不只是加速，还会改变智能体推理",
        "url": "https://huggingface.co/papers/2611.05345",
        "source": "Hugging Face 每日论文 · 热度榜（6 赞）",
        "publishedAt": "2026-11-03 发表",
        "meta": "在复杂智能体任务上对比不同推测配置的前沿开源权重模型",
        "takeaway": "推测解码在长程智能体任务中并非行为中立的系统优化。",
        "why": "主流看法把推测解码当作不改变模型行为的纯加速，草稿模型训练也只看接受率。作者据其摘要主张这一看法在长程智能体推理中不成立，并用对抗式推测推理来利用这一差异。问题设定有价值：部署侧的加速参数可能悄悄改变任务成功率。"
      },
      {
        "title": "Kimi K3.1 Pro 开放模型权重",
        "url": "https://huggingface.co/moonshotai/Kimi-K3.1-Pro",
        "source": "Hacker News · 377 分",
        "publishedAt": "2026-11-04 上榜",
        "meta": "377 分、102 条评论",
        "takeaway": "又一款前沿级模型把权重放出来，本地部署与二次微调的选择继续变多。",
        "why": "素材只给出权重已发布这一事实与讨论热度，未披露参数规模与评测细节。值得看的是发布形态本身：权重公开意味着社区可以自行量化、微调与复现，而不是只能通过 API 调用；具体能力仍需回到模型卡核对，不宜按标题推断。"
      }
    ],
    "repos": [
      {
        "name": "Niko1221/Strata",
        "url": "https://github.com/Niko1221/Strata",
        "stars": 39995,
        "lang": "C++",
        "what": "在消费级硬件上一键跑 Qwen3.8-Flash-Next，并在本机暴露 OpenAI 与 Anthropic 兼容接口，方便现有客户端直接接入。",
        "tryThis": "按仓库说明下载 Windows 或 Linux 安装包并运行，启动后在终端执行 curl 请求 localhost 上的 /v1/chat/completions，确认能返回文本；再在任意支持自定义 base_url 的客户端里填入该地址。",
        "minutes": 20
      },
      {
        "name": "yetone/magpie",
        "url": "https://github.com/yetone/magpie",
        "stars": 29788,
        "lang": "Go",
        "what": "把各家编码智能体接到各家模型上：菜单栏里就能让 Codex 跑在 DeepSeek、Claude Code 跑在 Kimi。",
        "tryThis": "克隆仓库后按 README 编译或用发布版启动，在菜单栏图标里选一个智能体与一个模型，填好对应 API Key，发一句「列出当前目录结构」看是否走通。",
        "minutes": 15
      },
      {
        "name": "browser-use/jev-ultrafast",
        "url": "https://github.com/browser-use/jev-ultrafast",
        "stars": 24181,
        "lang": "Python",
        "what": "面向网页操作的智能体，主打更快更便宜的浏览任务执行，适合把重复的点击与填表交给它。",
        "tryThis": "pip 安装仓库依赖后跑示例脚本，把目标网址换成你常看的资讯页，让它抓取标题列表，观察耗时与 token 消耗。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "今天上手做这一件",
      "goal": "用 32K 中性填充与同格式干扰各做一次检索测试，亲眼看到 context rot 的归因差异",
      "time": "约 20 分钟",
      "url": "https://huggingface.co/papers/2611.04169",
      "steps": [
        "选一个 1.5B 级开源模型本地起服务，准备一条带唯一答案的事实问题作为检索目标",
        "第一轮：在问题前塞入约 3 万 token 的无关中性文本，记录模型答对与否",
        "第二轮：把中性文本换成与答案同格式的干扰陈述，位置保持不变，再问同一个问题"
      ],
      "done": "两轮结果出现明显落差，且你能说清落差来自干扰格式而非长度",
      "output": "一份两行对照记录：填充类型、上下文长度、是否答对"
    },
    "concept": {
      "term": "推测解码（speculative decoding）",
      "line": "用小模型先草拟若干 token、大模型并行校验，接受则跳过逐字生成，从而加速解码。"
    },
    "keywords": [
      "文本动作脱钩",
      "注意力竞争",
      "推测解码",
      "开放权重"
    ],
    "note": "热度与星数只是注意力信号，论文结论请回到原文与实验设置核对。",
    "updated": "2026-11-05T02:00:30.992Z"
  },
  "2026-11-06": {
    "lead": "今天的主线是推理效率与推理成本的再拆解：论文侧有人把投机解码的草稿阶段从串行依赖里解放出来，有人给稀疏注意力的索引器做多层重叠，还有人试图给每个 token 的能耗写出闭式公式；工程侧则出现把前沿模型塞进本地菜单栏、把大模型推理搬上消费级硬件的项目。",
    "items": [
      {
        "title": "D3D：让扩散草稿器不再等目标模型",
        "url": "https://huggingface.co/papers/2611.06425",
        "source": "Hugging Face 每日论文 · 第 1 名（3 赞）",
        "publishedAt": "2026-11-04 发布",
        "meta": "",
        "takeaway": "投机解码的草稿与验证可以脱钩，加速不再被轮次依赖吃掉。",
        "why": "据其摘要，目标条件扩散草稿器虽能并行出候选 token，但每个新块都要等目标模型更新隐状态，导致草稿与验证只能串行。D3D 把块级去噪与辅助自回归结合，做成独立草稿器以切断轮间依赖，问题设定直指投机解码的实际瓶颈。"
      },
      {
        "title": "多层索引器改进 DeepSeek 稀疏注意力",
        "url": "https://huggingface.co/papers/2611.03768",
        "source": "Hugging Face 每日论文 · 第 2 名（3 赞）",
        "publishedAt": "2026-11-02 发布",
        "meta": "每层保留 k=2048 个最高分 token",
        "why": "据其摘要，DeepSeek Sparse Attention 在每层前放一个 lightning indexer 给整个缓存打分、只保留前 2048 个。该文研究多层索引器的重叠选择与注意力关系，属于对已上线生产模型注意力机制的解剖式改进，关注长上下文推理成本的人值得看。",
        "takeaway": "稀疏注意力的选谁来看，本身可以跨层设计而非逐层独立。"
      },
      {
        "title": "给 LLM 推理能耗写一条闭式定律",
        "url": "https://huggingface.co/papers/2611.03330",
        "source": "Hugging Face 每日论文 · 第 5 名（9 赞）",
        "publishedAt": "2026-11-02 发布",
        "meta": "",
        "takeaway": "token 不等价，能耗随序列非线性增长，可以解析表达而非拟合。",
        "why": "据其摘要，每个 token 进入 KV-cache 都会抬高后续 token 的成本，而现有最准的 SOTA 模型只是拟合，把架构差异吸收进系数、需逐模型重新拟合。该文推出闭式表达，把「按 token 计费」背后的能量不对称讲清楚，对推理部署与计费都有直接含义。"
      },
      {
        "title": "重启 AI 智能体：监控准确率不是答案",
        "url": "https://huggingface.co/papers/2610.36544",
        "source": "Hugging Face 每日论文 · 第 7 名（2 赞）",
        "publishedAt": "2026-10-27 发布",
        "meta": "固定 90% 准确率的监控",
        "why": "据其摘要，仅看分类准确率与真阳/假阳率无法判断重启智能体是否提升成功率。作者用精确的告警到动作恒等式分析独立干净重启，发现同一 90% 准确率的监控可因替换策略不同，从成功率损失 5 个百分点翻转为提升 35 个百分点，把评估口径从准确率转向决策价值。",
        "takeaway": "监控好不好，要看重启后的决策收益，而不是分类准确率。"
      }
    ],
    "repos": [
      {
        "name": "yetone/magpie",
        "url": "https://github.com/yetone/magpie",
        "stars": 30520,
        "lang": "Go",
        "what": "把 Codex、Claude Code 等编码智能体接到 DeepSeek、Kimi 等模型上，从菜单栏统一切换，省去逐个改配置。",
        "tryThis": "按 README 安装后启动，在菜单栏图标里选一个智能体与一个模型，发一句「列出当前目录结构」看是否正常返回。",
        "minutes": 15
      },
      {
        "name": "Niko1221/Strata",
        "url": "https://github.com/Niko1221/Strata",
        "stars": 40601,
        "lang": "C++",
        "what": "在普通消费级硬件上一键跑 Qwen3.8-Flash-Next，并在本地起 OpenAI/Anthropic 兼容接口，方便接现成客户端。",
        "tryThis": "下载 Windows 或 Linux 一键安装包，启动后在 localhost 调一次 /v1/models 确认服务起来，再用 curl 发一条对话请求。",
        "minutes": 20
      },
      {
        "name": "Gathin23/cleanyourtv",
        "url": "https://github.com/Gathin23/cleanyourtv",
        "stars": 52679,
        "lang": "Python",
        "what": "通过 Wi-Fi 用 adb 给 Android TV 或 Google TV 卸载预装应用，换成类似 Apple TV 的简洁桌面。",
        "tryThis": "在电视上打开开发者调试并记下 IP，按 README 运行脚本连接，先只执行列表命令看清将卸载哪些包再动手。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "今天上手做这一件",
      "goal": "用本地 OpenAI 兼容接口跑通一次 Qwen3.8-Flash-Next 对话",
      "time": "约 20 分钟",
      "url": "https://github.com/Niko1221/Strata",
      "steps": [
        "从 Strata 仓库下载对应系统的一键安装包并启动",
        "确认本地 localhost 服务已监听，请求一次模型列表接口",
        "用 curl 向对话接口发一条简短提问，检查返回内容"
      ],
      "done": "终端里拿到一条结构完整的模型回复",
      "output": "一个可被现有客户端直接调用的本地推理端点"
    },
    "concept": {
      "term": "投机解码",
      "line": "用小而快的草稿模型先猜若干 token，再让大模型一次性验证，猜对就省下逐字生成的开销。"
    },
    "keywords": [
      "投机解码",
      "稀疏注意力",
      "推理能耗"
    ],
    "note": "论文榜点赞数普遍很低，热度不等于分量，先看问题设定再决定要不要读全文。",
    "updated": "2026-11-06T02:01:34.680Z"
  },
  "2026-11-07": {
    "lead": "今天的主线是「压缩与验证」：研究者不再一味堆叠上下文和算力，而是想办法把工具输出压成潜表示、把多能力教师蒸馏进少步采样，同时给数学建模和科研复现补上可验证的评测。产业侧，模型路由与本地推理工具在开源社区快速冒头，说明成本与可控性正成为新的竞争点。",
    "items": [
      {
        "title": "工具输出不必转成文字，潜空间压缩智能体上下文",
        "url": "https://huggingface.co/papers/2611.06500",
        "source": "Hugging Face 每日论文 · 热度榜",
        "publishedAt": "2026-11-04 发布",
        "meta": "",
        "takeaway": "智能体的工具返回可以不走文本通道，压缩率不再被离散词元卡住。",
        "why": "论文直指多步交互中原始工具输出又长又吵、稀释注意力的老问题，并指出词元剪枝与摘要受限于离散文本表示。作者提出在潜空间做上下文压缩，把「压缩比上限」从文本表示中解放出来，值得关注其如何保证任务相关信息不丢失。"
      },
      {
        "title": "离线 RAG 的知识包：签名不等于向量忠实于文本",
        "url": "https://huggingface.co/papers/2611.06498",
        "source": "Hugging Face 每日论文 · 热度榜",
        "publishedAt": "2026-11-04 发布",
        "meta": "",
        "takeaway": "签名只证明谁发布了知识包，不证明其中向量真的编码了那段文本。",
        "why": "边缘设备上的离线 RAG 靠签名知识包更新，包内同时带文本和预计算向量。作者把「文本—向量完整性缺口」形式化：攻击者控制向量时，即便验证器按余弦容差重算，也会放行可预测比例的有害查询，并给出测量与修补思路。"
      },
      {
        "title": "扩散模型多教师在线蒸馏的再思考",
        "url": "https://huggingface.co/papers/2611.04386",
        "source": "Hugging Face 每日论文 · 热度榜",
        "publishedAt": "2026-11-03 发布",
        "meta": "",
        "takeaway": "把「能力合并」和「少步采样」两阶段拆开做，会带来可复用的改进点。",
        "why": "可部署的文生图模型要同时具备指令遵循、文字渲染与人类偏好，还要少步采样。现有流程先用多教师在线蒸馏合并能力，再把全步模型当固定教师做步数蒸馏。StepX-OPD 重新审视这一两段式设定，问题定义清晰，适合跟踪其蒸馏目标与采样步数的权衡。"
      },
      {
        "title": "终端式数学建模基准：答案要可验证且物理可行",
        "url": "https://huggingface.co/papers/2611.08237",
        "source": "Hugging Face 每日论文 · 第 1 名（7 赞）",
        "publishedAt": "2026-11-05 发布",
        "meta": "",
        "takeaway": "数学建模的评分从「像不像报告」转向「接近参考解且物理可行」。",
        "why": "数学建模要把开放现实问题变成假设、模型、求解与可辩护的建议。已有基准要么只评求解片段，要么用 LLM 裁判给报告打分，数值本身无人核验。TB-MathModel 以终端式、可验证的方式同时检查与可信参考解的接近度和物理可行性，补上了这一环。"
      }
    ],
    "repos": [
      {
        "name": "deepseek-ai/DeepInfer",
        "url": "https://github.com/deepseek-ai/DeepInfer",
        "stars": 25555,
        "lang": "Python",
        "what": "面向 DeepSeek 系列模型的高性能大规模推理框架，解决本地或集群部署时的吞吐与显存问题。",
        "tryThis": "克隆仓库后按 README 安装依赖，用自带的小模型配置起一个 OpenAI 兼容服务，再发一条 curl 请求看返回。",
        "minutes": 20
      },
      {
        "name": "Niko1221/Strata",
        "url": "https://github.com/Niko1221/Strata",
        "stars": 41093,
        "lang": "C++",
        "what": "让消费级硬件一键跑起 Qwen3.8-Flash-Next，并在本机暴露 OpenAI/Anthropic 兼容接口。",
        "tryThis": "下载对应系统的安装包，启动后在 localhost 的接口地址用任意兼容客户端发一条对话，确认可选图像输入是否生效。",
        "minutes": 15
      },
      {
        "name": "browser-use/jev-ultrafast",
        "url": "https://github.com/browser-use/jev-ultrafast",
        "stars": 24240,
        "lang": "Python",
        "what": "主打最快最省的网页智能体，用较低调用成本完成浏览器里的点击与信息提取任务。",
        "tryThis": "pip 安装后跑仓库示例脚本，让它打开一个公开网页并抽取标题，观察耗时与调用次数。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "今天上手做这一件",
      "goal": "用 Strata 在本机跑通一个兼容 OpenAI 接口的本地模型",
      "time": "约 20 分钟",
      "url": "https://github.com/Niko1221/Strata",
      "steps": [
        "按 README 下载并安装对应系统的 Strata 版本",
        "启动服务，记下 localhost 上暴露的接口地址与端口",
        "用任意 OpenAI 兼容客户端或一条 curl 请求发送简单对话，再试一次带图片的输入"
      ],
      "done": "收到模型正常回复，且接口地址可被外部客户端复用",
      "output": "一份可复用的本地推理服务配置与一次成功调用记录"
    },
    "concept": {
      "term": "潜上下文压缩",
      "line": "把工具返回压进连续向量而非转成文字，从而突破文本表示的压缩比上限。"
    },
    "keywords": [
      "潜空间压缩",
      "可验证评测",
      "本地推理"
    ],
    "note": "论文热度与星标只反映关注度，别把数字当成效果证明。",
    "updated": "2026-11-07T01:39:18.788Z"
  }
};
