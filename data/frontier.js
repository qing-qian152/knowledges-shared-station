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
    "lead": "今天的主线是「把模型内部与训练过程变成可读、可改的对象」：有人直接读写权重来改模型行为，有人用梯度反查是哪些训练样本悄悄削弱了安全对齐，也有单研究者从零搭出的混合架构小模型。工具侧则继续把前沿模型塞进本地与菜单栏，让个人机器也能跑起推理。",
    "items": [
      {
        "title": "Astra 直接读写权重改造 Qwen",
        "url": "https://rikiyat.github.io/blog/weight-space-programming/",
        "source": "Hacker News · 1707 分",
        "publishedAt": "2026-11-02 上榜",
        "meta": "1707 分、550 条评论",
        "takeaway": "把「改模型」从改提示词、改数据，推进到直接在权重空间里做程序化编辑。",
        "why": "作者把权重当成可读写的对象，试图不经过再训练就改变 Qwen 的行为。相比微调和提示工程，这条路线若成立，模型修改会变成类似打补丁的操作；但它目前是个人博客的探索，效果边界和可复现性都还需要读者自己验证。"
      },
      {
        "title": "用梯度追出削弱安全性的训练样本",
        "url": "https://huggingface.co/papers/2610.37481",
        "source": "Hugging Face 每日论文 · 25 赞",
        "publishedAt": "2026-10-27 发布",
        "meta": "提出 SimpleLoRIF 梯度嵌入方法",
        "takeaway": "安全退化可以追溯到看起来无害的指令微调样本，而非某条明显的坏数据。",
        "why": "论文指出，指令微调会让模型安全性悄悄下降，而问题样本在内容上并不违规，常规内容过滤抓不到。作者用梯度嵌入找出与不安全行为方向对齐的训练样本，把「哪条数据有害」从人工判断变成可计算的信号，这是数据审计思路上的关键换位。"
      },
      {
        "title": "单研究者从零造出两个混合架构模型",
        "url": "https://huggingface.co/papers/2610.37903",
        "source": "Hugging Face 每日论文 · 4 赞",
        "publishedAt": "2026-10-27 发布",
        "meta": "Praxis 2.94B／激活 0.46B，Logos 10.23B／激活 1.18B",
        "takeaway": "小参数加好数据与混合架构，被当作对抗堆参数的一条低成本路线。",
        "why": "Metis-1.6 由一位研究者独立完成，采用 Mamba-2 与注意力混合的 MoE 堆叠，两个模型都强调每轮激活参数远小于总参数。它的问题设定是：在有限算力下，数据质量、训练方法和架构选择能否补上参数规模的差距；结论仍需社区复现。"
      },
      {
        "title": "研究智能体有没有「品味」",
        "url": "https://huggingface.co/papers/2610.40488",
        "source": "Hugging Face 每日论文 · 2 赞",
        "publishedAt": "2026-10-29 发布",
        "meta": "6 个前沿模型 × 7 篇近期 NLP 论文",
        "takeaway": "评估重点从「能不能做实验」转向「能不能判断哪个实验值得做」。",
        "why": "做法是给模型近期论文，让它提出最小可行实验、预测能否过阈值并排序，再由独立执行器把包括排在最后的实验全部跑一遍，用结果反推判断质量。这把研究判断力拆成可测量的预测任务，但样本只有 7 篇论文，规模偏小。"
      }
    ],
    "repos": [
      {
        "name": "deepseek-ai/DeepInfer",
        "url": "https://github.com/deepseek-ai/DeepInfer",
        "stars": 25026,
        "lang": "Python",
        "what": "DeepSeek 官方的高性能大模型推理框架，解决本地或集群上跑 DeepSeek 模型时吞吐和显存利用的问题。",
        "tryThis": "克隆仓库后按 README 安装依赖，用自带示例脚本加载一个小尺寸模型，观察启动日志里的显存占用与首 token 延迟。",
        "minutes": 20
      },
      {
        "name": "yetone/magpie",
        "url": "https://github.com/yetone/magpie",
        "stars": 28384,
        "lang": "Go",
        "what": "把 Codex、Claude Code 等客户端的后端模型统一到一个菜单栏入口，解决多工具多密钥来回切换的问题。",
        "tryThis": "下载对应平台的安装包启动，在菜单栏里填一个已有模型的 API Key，选一个客户端试跑一次代码补全。",
        "minutes": 15
      },
      {
        "name": "Gathin23/cleanyourtv",
        "url": "https://github.com/Gathin23/cleanyourtv",
        "stars": 50411,
        "lang": "Python",
        "what": "通过 Wi-Fi 用 ADB 清理 Android TV 和 Google TV 的预装应用，并换成接近 Apple TV 的简洁桌面。",
        "tryThis": "在电视上打开开发者模式与网络调试，电脑执行仓库里的连接脚本，先只禁用一两个预装应用看桌面变化。",
        "minutes": 20
      }
    ],
    "task": {
      "title": "用梯度视角检查一次微调数据",
      "goal": "理解「无害样本也可能削弱安全对齐」这一机制，并知道如何定位可疑样本。",
      "time": "约 20 分钟",
      "url": "https://huggingface.co/papers/2610.37481",
      "steps": [
        "读论文摘要与方法部分，记下 SimpleLoRIF 用什么信号给样本打分。",
        "对照自己的微调数据集，列出内容合规但风格强指令化的样本作为候选。",
        "在笔记里写下：如果按梯度对齐度排序，你会先复查哪几条，以及复查标准是什么。"
      ],
      "done": "能说清梯度对齐度与不安全行为的对应关系，并列出至少 3 条待复查样本。",
      "output": "一份针对自己数据集的「安全退化可疑样本」初筛清单。"
    },
    "concept": {
      "term": "权重空间编程",
      "line": "不重新训练，而是把模型参数当作可直接读取和写入的数据结构来编辑。"
    },
    "keywords": [
      "权重编辑",
      "梯度归因",
      "混合架构"
    ],
    "note": "榜单热度与 star 数不等于效果，先跑通再判断。",
    "updated": "2026-11-03T00:01:31.408Z"
  }
};
