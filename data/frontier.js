/* 每日一学 · AI 前沿板块
   与 data/days/*.js 分开存放：这两块数据由「带联网检索的 agent」写入，
   部署在 GitHub Actions 里的 generate.mjs 没有联网能力，不会被它覆盖。
   结构：
   window.LEARN_FRONTIER = {
     "YYYY-MM-DD": {
       updated:  "写入时间",
       lead:     "今天整体在发生什么（一句）",
       items:    [{ title, url, source, publishedAt, meta, takeaway, why }],
       repos:    [{ name, url, stars, lang, what, tryThis, minutes }], // 学生能动手的高星项目
       task:     { title, goal, time, url, steps[], done, output },
       concept:  { term, line },
       keywords: ["今天", "记住", "三个词"],
       note:     "今天最该记住的一句"
     }
   }
   页面：frontierFor(date) 取不到就整块隐藏，不影响旧内容与进度统计。 */

window.LEARN_FRONTIER = {
  '2026-10-27': {
    updated: '2026-10-27 21:30',
    lead: '今天的主线是「降价」和「便宜也能跑」：GPT-6.1 Terra 把同档能力的价格压到约一半，Kimi K3.1 Pro 把开放权重的分数推到贴着闭源前沿的位置；论文侧最热的一篇，是把「视频」当成模型读写世界的接口。',
    items: [
      {
        title: '用视频读、写、分享、与这个世界互动（牛津，HF 日榜第 1）',
        source: 'Hugging Face Daily Papers',
        url: 'https://huggingface.co/papers/2610.31668',
        publishedAt: '论文 2026-10-26 收录；榜单 2026-10-26 第一，213 个赞',
        meta: 'Oxford · arXiv 2610.31668',
        takeaway: '把视频当作模型的「通用接口」——不只是生成一段画面，而是让模型从画面里读写动作与因果。',
        why: '值得看的是问题设定而不是效果：如果模型能从视频里读出「什么导致了什么」，人的日常经验就能直接当训练数据。看这篇只盯一件事——它说的「互动」是预测下一帧，还是真的能改变环境？这决定了它是「视频模型」还是「世界模型」。'
      },
      {
        title: 'RSIHub：把「让 Agent 自己进化」做成可组合框架',
        source: 'Hugging Face Daily Papers（ByteDance）',
        url: 'https://arxiv.org/abs/2610.32253',
        publishedAt: '2026-10-26 上榜，198 个赞',
        meta: 'arXiv 2610.32253 · NeurIPS 2026 Meta-Agents Workshop',
        takeaway: '最大提升 +13.5 个百分点，但排名会随设定变化，增益不一定迁移到没见过的任务。',
        why: '「自进化」是现在最容易吹的方向，这篇的价值在于把失败模式写出来了：换 baseline、换 held-out 集，结论就变。读法建议——跳过摘要直接看消融表，和它自己写的「不迁移」那段。'
      },
      {
        title: 'GPT-6.1 Terra 发布：同档能力，价格约一半',
        source: 'OpenAI 官方',
        url: 'https://openai.com/index/introducing-gpt-6-1-terra/',
        publishedAt: '2026-10-26 发布',
        meta: '$1 / $5 每百万 token（输入 / 输出），主打视觉推理与 computer use',
        takeaway: '价格是第一生产力：看新模型先看单价，再看分数。',
        why: '对你的实际意义是预算：同样一百次实验，现在跑得起，做 Agent 小项目时「多跑几轮看稳不稳」终于不心疼。别只看它比上一代强多少，看它比同价位的模型强多少——这才是你会真正做的选择。'
      }
    ],
    repos: [
      {
        name: 'NandhaKishorM/laya',
        url: 'https://github.com/NandhaKishorM/laya',
        stars: 34449,
        lang: 'Python',
        what: '非自回归的决策引擎：一次前向就吐出结构化的决策，覆盖 100+ 语言，HF 上有权重。',
        tryThis: '读 README 里「一次前向 vs 逐 token 生成」的对比，然后把最小示例跑起来，改一句输入，看决策怎么变。',
        minutes: 25
      },
      {
        name: 'deepseek-ai/deepseek-harness',
        url: 'https://github.com/deepseek-ai/deepseek-harness',
        stars: 263396,
        lang: 'TypeScript',
        what: '「Everything is a Plugin」的 Agent 运行时，插件即一切——很适合拿来学工程结构。',
        tryThis: '只做一件事：找一个最小的插件目录，读它的清单和入口文件，手画一张「一个请求进来，插件在哪一步被调用」的流程图。',
        minutes: 30
      },
      {
        name: 'eternity4719/HowToLiveBetter',
        url: 'https://github.com/eternity4719/HowToLiveBetter',
        stars: 69882,
        lang: 'HTML',
        what: '不是 AI 项目，但写法值得抄：每一条建议都写清成本、收益和证据等级。',
        tryThis: '抄它的结构——挑一个你正在纠结的选择，用「成本 / 收益 / 证据等级」三栏写满一页，再决定。',
        minutes: 15
      }
    ],
    task: {
      title: '跑通 200 行 GPT，并说出它到底在干什么',
      goal: '从零训练一个能生成名字的 GPT，然后把「它为什么会学」讲到别人能听懂',
      time: '45–60 分钟',
      url: 'https://karpathy.github.io/2026/02/12/microgpt/',
      steps: [
        '打开 microgpt 那篇文章，把代码整段存成本地 microgpt.py，先原样跑一次，记下输出。',
        '在训练循环里把四步标出来：logits 怎么来 → softmax 变成概率 → loss 怎么算 → backward 调整了什么（用注释写在对应行旁边）。',
        '只改一个超参（层数、学习率或训练轮数），再跑一次，对比两次输出像不像名字。',
        '把两次输出 + 四步解释写成 10 行以内的笔记。'
      ],
      done: '验收：不看文章，你能用自己的话讲清「模型靠什么把随机输出变成像名字的输出」，而且两次输出确实不一样。做不到就回去重看 backward 那一段。',
      output: 'microgpt-实验.md：两次输出 + 四步解释 + 你改的那个超参和结果'
    },
    concept: {
      term: 'KV Cache',
      line: '把已经算过的注意力键和值存下来，下一步只计算新增 token。省的是重复计算，不是精度；代价是显存——今天量子位那条「KV Cache 砍 99%」，砍的就是这份显存账。'
    },
    keywords: ['降价', '开放权重', '自进化'],
    note: '榜单上的 +13.5 个百分点，不等于能搬到你的任务上。看论文先看它的 held-out 集和比较对象。'
  }
};
