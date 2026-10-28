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
  }
};
