/* 2026-10-27 · 周二
   数据格式即“一天一课”的结构，生成脚本按同样结构产出即可。 */
window.LEARN_DAY = {
  date: "2026-10-27",
  weekday: "周二",
  theme: "在无人处，听见自己",

  /* ---------------- 01 语文晨读 ---------------- */
  chinese: {
    title: "荷塘月色（节选）",
    author: "朱自清",
    tag: "现代散文 · 写景",
    readingTime: "5 分钟",
    body: [
      "路上只我一个人，背着手踱着。这一片天地好像是我的；我也像超出了平常的自己，到了另一世界里。我爱热闹，也爱冷静；爱群居，也爱独处。像今晚上，一个人在这苍茫的月下，什么都可以想，什么都可以不想，便觉是个自由的人。白天里一定要做的事，一定要说的话，现在都可不理。这是独处的妙处，我且受用这无边的荷香月色好了。",
      "曲曲折折的荷塘上面，弥望的是田田的叶子。叶子出水很高，像亭亭的舞女的裙。层层的叶子中间，零星地点缀着些白花，有袅娜地开着的，有羞涩地打着朵儿的；正如一粒粒的明珠，又如碧天里的星星，又如刚出浴的美人。微风过处，送来缕缕清香，仿佛远处高楼上渺茫的歌声似的。这时候叶子与花也有一丝的颤动，像闪电般，霎时传过荷塘的那边去了。叶子本是肩并肩密密地挨着，这便宛然有了一道凝碧的波痕。叶子底下是脉脉的流水，遮住了，不能见一些颜色；而叶子却更见风致了。",
      "月光如流水一般，静静地泻在这一片叶子和花上。薄薄的青雾浮起在荷塘里。叶子和花仿佛在牛乳中洗过一样；又像笼着轻纱的梦。虽然是满月，天上却有一层淡淡的云，所以不能朗照；但我以为这恰是到了好处——酣眠固不可少，小睡也别有风味的。"
    ],
    explain: [
      {
        line: "微风过处，送来缕缕清香，仿佛远处高楼上渺茫的歌声似的。",
        note: "通感的教科书用例：嗅觉（清香）写成听觉（歌声）。关键是<b>“渺茫”</b>——它同时写了声音的若有若无和香气的忽浓忽淡，一个词把两种感官焊在一起，谁也没压过谁。"
      },
      {
        line: "这时候叶子与花也有一丝的颤动，像闪电般，霎时传过荷塘的那边去了。",
        note: "写的是极静的夜，偏用“闪电”这种极快的意象，这是<b>以动写静</b>。注意“一丝”和“霎时”一慢一快，节奏的张力就出来了。"
      },
      {
        line: "月光如流水一般，静静地泻在这一片叶子和花上。",
        note: "“泻”字是全段的眼。月光没有重量，用“泻”就给了它流动的体积感；换成“照”“洒”立刻平掉。后面“浮”“洗”是同一个思路——<b>把看不见的东西写成摸得到的</b>。"
      },
      {
        line: "我爱热闹，也爱冷静；爱群居，也爱独处。",
        note: "两句对举，句式整齐却不死板：后半句省掉“我”字，读起来更快，更像自言自语。排比常见，<b>会省字</b>才是本事。"
      }
    ],
    words: [
      { w: "弥望", meaning: "满眼，充满视野", use: "“弥”是满，“望”是看。写大片景物时用它，比“到处都是”有分量。" },
      { w: "田田", meaning: "荷叶相连、茂密的样子", use: "出自“莲叶何田田”，叠词自带声韵。" },
      { w: "亭亭", meaning: "高而挺拔的样子", use: "常写荷、树、人影，带一点清高的意味。" },
      { w: "袅娜", meaning: "柔美轻盈", use: "多写花、柳、女子的姿态，注意与“婀娜”通用。" },
      { w: "脉脉", meaning: "形容水缓缓流动（此处读 mò mò）", use: "同一词读 mài mài 时指含情不语，靠语境分辨。" },
      { w: "风致", meaning: "风韵、姿态", use: "写物比写人更有味，收在句尾尤显余韵。" },
      { w: "朗照", meaning: "明亮地照射", use: "与“照”相比，多了月色清透的质感。" }
    ],
    expressions: [
      {
        s: "叶子出水很高，像亭亭的舞女的裙。",
        why: "只一个比喻，姿态、高度、轻盈全有了；名词性比喻比形容词堆砌更省字。"
      },
      {
        s: "正如一粒粒的明珠，又如碧天里的星星，又如刚出浴的美人。",
        why: "博喻：三个比喻连下，从“亮”到“多”再到“洁”，层层递进，把白花写透了。"
      },
      {
        s: "酣眠固不可少，小睡也别有风味。",
        why: "用生活化的对比收束一段写景，景忽然有了人味——散文的“我”就在这里露头。"
      }
    ],
    techniques: [
      { name: "通感", desc: "把一种感官的感受写成另一种感官：香→声、色→温。它能让读者“多长一个器官”。", example: "“送来缕缕清香，仿佛远处高楼上渺茫的歌声似的。”" },
      { name: "叠词", desc: "曲曲折折、田田、亭亭、层层、粒粒、缕缕——叠词不只是可爱，它拖慢节奏，让文字有抚摸感。", example: "“曲曲折折的荷塘上面，弥望的是田田的叶子。”" },
      { name: "博喻", desc: "同一对象连用多个比喻，从不同侧面逼近它，适合写“说不清”的美。", example: "明珠、星星、刚出浴的美人，三喻写白花。" },
      { name: "以动衬静", desc: "用极快的动态反衬极静的环境，比直接写“很安静”有效十倍。", example: "“像闪电般，霎时传过荷塘的那边去了。”" },
      { name: "炼字", desc: "一个动词定全段气质：泻、浮、洗、笼。写景先找那个“动不了却非动不可”的字。", example: "“月光如流水一般，静静地泻在……”" }
    ],
    imitation: {
      prompt: "用“通感”写一段 150 字左右的夜景：把听觉写成触觉，或把气味写成颜色。",
      steps: [
        "先定一个场景：雨后的巷子、深夜的厨房、关灯后的卧室，越小越好。",
        "写下三种感官细节，选出最不搭的一对（比如“蝉声”和“粗糙”）。",
        "用“仿佛……似的”或“像……一样”把它焊起来，注意比喻要落在质感上，不要落在概念上。",
        "至少用两个叠词，最后一句收在一件小事上，不要总结升华。"
      ]
    }
  },

  /* ---------------- 02 古诗文 ---------------- */
  poem: {
    title: "山居秋暝",
    author: "王维",
    dynasty: "唐",
    tag: "五言律诗",
    body: [
      "空山新雨后，天气晚来秋。",
      "明月松间照，清泉石上流。",
      "竹喧归浣女，莲动下渔舟。",
      "随意春芳歇，王孙自可留。"
    ],
    notes: [
      { line: "暝", note: "日暮、傍晚。" },
      { line: "空山", note: "不是“空无一人的山”，而是山深林密、人迹罕至，写出一种空寂的清境。" },
      { line: "浣女", note: "洗衣服的女子。浣，洗涤。" },
      { line: "春芳歇", note: "春天的花草凋谢了。歇，尽、消歇。" },
      { line: "王孙", note: "原指贵族子弟，这里诗人借以自指；用《楚辞》“王孙兮归来，山中兮不可以久留”的反意，说山中正可久留。" }
    ],
    translation: "新雨洗过的空山，傍晚的天气已有秋意。明月从松林间洒下清辉，清泉在山石上淙淙流淌。竹林里传来喧笑，是洗衣的女子归来；莲叶摇动，是渔舟顺流而下。任凭春天的芳菲消歇吧，我这样的人，自可以留在山中。",
    appreciation: [
      "首联一个“空”字定调：山是空的，心也是空的。雨后、傍晚、初秋，三个时间条件叠在一起，空气的凉与净先声夺人。",
      "颔联是“诗中有画”的样板：上句写光（明月、松间），下句写声（清泉、石上），一静一动、一高一低，画面立刻有了纵深。",
      "颈联最见功夫：不写人，先写“竹喧”“莲动”，让人从声音和动静里“猜”出浣女与渔舟——这叫<b>未见其人，先闻其声</b>，比直写热闹高级得多。",
      "尾联一转，从景入志：春芳虽歇，秋山正好，何必归去？王维把归隐之心说得极淡，却极坚定。"
    ],
    recite: "按“景—人—志”三层记：先背前四句（雨后、月、泉，全是静景），再背颈联（竹喧、莲动，两个动态），最后收尾联（春芳歇、王孙留）。颈联两句都是“先果后因”，记住“竹喧”就想起“浣女”，“莲动”就想起“渔舟”。"
  },

  /* ---------------- 03 英文精读 ---------------- */
  english: {
    title: "The Unexpected Benefits of Boredom",
    level: "CET-6 / IELTS 6.5",
    words: 330,
    body: [
      "By the time you finish reading this sentence, your hand may have already reached for your phone. That reflex is hardly surprising: for most of us, a spare moment is now something to be filled rather than something to be endured. Yet a growing body of research suggests that boredom — the very state we spend so much effort avoiding — may be one of the most productive conditions the human mind can enter.",
      "Psychologists usually distinguish between two kinds of boredom. The first is situational and fleeting: a delayed train, a dull meeting, a queue that refuses to move. The second is chronic — a persistent sense that nothing holds meaning. The former is unpleasant but harmless; the latter is associated with anxiety and depression, and should not be romanticised. The interesting territory lies in between, where boredom works as a signal rather than a symptom: it tells us that our attention is under-stimulated, and quietly pushes us to look for something more engaging.",
      "That push, according to a series of experiments, is what makes boredom valuable. When participants were first asked to copy numbers out of a phone book and then to invent uses for a pair of plastic cups, those who had been made bored produced markedly more original ideas than those who had been allowed to scroll through social media. The mechanism is not mysterious. A wandering mind connects ideas that a focused one keeps apart, and the default mode network — a set of brain regions that becomes active when we are not working on a specific task — appears to be doing exactly this kind of associative work.",
      "None of this means we should ban entertainment, still less that we should feel guilty every time we relax. It means that the gaps matter. Leaving a few minutes unscripted each day, or resisting the urge to reach for a screen the instant a queue forms, may be a cheap and surprisingly effective way to keep our imagination in working order. The next time you find yourself with nothing to do, consider doing nothing — deliberately."
    ],
    vocab: [
      { w: "reflex", pos: "n.", cn: "本能反应；反射", ex: "Reaching for the phone has become a reflex." },
      { w: "endure", pos: "v.", cn: "忍受，忍耐", ex: "She endured the silence without complaint." },
      { w: "fleeting", pos: "adj.", cn: "短暂的，转瞬即逝的", ex: "He caught a fleeting glimpse of the train." },
      { w: "chronic", pos: "adj.", cn: "长期的，慢性的", ex: "Chronic stress wears the body down." },
      { w: "persistent", pos: "adj.", cn: "持续的，顽固的", ex: "A persistent cough kept her awake all night." },
      { w: "romanticise", pos: "v.", cn: "浪漫化，美化", ex: "The film romanticises country life." },
      { w: "under-stimulated", pos: "adj.", cn: "刺激不足的", ex: "Bored children are often under-stimulated, not lazy." },
      { w: "markedly", pos: "adv.", cn: "显著地", ex: "Sales rose markedly in the second quarter." },
      { w: "associative", pos: "adj.", cn: "联想的", ex: "Memory works through associative links." },
      { w: "unscripted", pos: "adj.", cn: "未预先安排的，即兴的", ex: "An unscripted moment in the interview went viral." },
      { w: "deliberately", pos: "adv.", cn: "有意地，故意地", ex: "He paused deliberately before answering." }
    ],
    phrases: [
      { p: "reach for", cn: "伸手去拿", ex: "He reached for his glasses." },
      { p: "a body of research", cn: "大量研究；一批研究成果", ex: "A growing body of research supports this view." },
      { p: "distinguish between A and B", cn: "区分 A 与 B", ex: "We must distinguish between opinion and fact." },
      { p: "be associated with", cn: "与……相关", ex: "Lack of sleep is associated with poor memory." },
      { p: "in working order", cn: "处于正常运转状态", ex: "The old radio is still in working order." },
      { p: "still less", cn: "更不用说（接在否定句后，语气更冷）", ex: "He never complains, still less asks for help." }
    ],
    patterns: [
      { s: "the very state we spend so much effort avoiding", cn: "我们费尽力气去回避的那种状态", note: "定语从句省略关系代词 that/which；the very + 名词起强调作用，比 this exact state 更地道。" },
      { s: "That reflex is hardly surprising.", cn: "这种条件反射并不奇怪。", note: "hardly 是半否定，比 not surprising 委婉，也更书面。" },
      { s: "None of this means we should ban entertainment, still less that we should feel guilty.", cn: "这绝不是说要禁止娱乐，更不是说每次放松都要内疚。", note: "否定 + still less 构成递进否定，注意后面用 that 从句保持结构对称。" },
      { s: "The next time you find yourself with nothing to do, consider doing nothing.", cn: "下次你发现自己无事可做时，不妨什么都不做。", note: "the next time 引导时间状语从句（省略 that）；find yourself + 介词短语；consider doing 固定搭配。" }
    ],
    grammar: [
      { point: "动名词作主语", explain: "主语是一个动名词短语时，谓语动词用单数，且句子重心会落在句末，适合下判断。", example: "Leaving a few minutes unscripted each day may be a cheap and surprisingly effective way to keep our imagination in working order." },
      { point: "破折号插入语 + 定语从句", explain: "先用破折号把一个名词短语塞进去解释术语，再在短语内部用 that 从句限定，句子因此能长而不乱。", example: "the default mode network — a set of brain regions that becomes active when we are not working on a specific task — appears to be doing exactly this kind of associative work" },
      { point: "比较结构中的 those who", explain: "比较对象是人时，用 those who 代替重复的名词，后面接定语从句；比较级前可加 markedly / considerably 等副词。", example: "those who had been made bored produced markedly more original ideas than those who had been allowed to scroll through social media" }
    ],
    summary: "我们为什么怕无聊？因为空隙一出现，手就伸向手机。但研究显示，无聊要分两种：一时的情境性无聊，和长期的、与焦虑抑郁相关的慢性无聊。真正有价值的是两者之间——无聊是一个信号，提示注意力刺激不足。实验里，先做枯燥抄写任务的人，在随后想塑料杯的新用途时，点子明显更原创；走神的大脑会把平时被专注隔开的概念连起来，默认模式网络正是干这个的。作者并不主张禁娱乐，只说别把每个空隙都填满：每天留几分钟不安排，可能最划算。",
    questions: [
      {
        q: "What is the author's main point?",
        options: ["Boredom is a sign of laziness.", "Short periods of boredom can be useful for creativity.", "Chronic boredom is good for the mind.", "Entertainment should be banned."],
        answer: 1,
        explain: "首段末句 may be one of the most productive conditions 与末段 the gaps matter 共同支撑 B。C 恰好相反：第二段明说慢性无聊 should not be romanticised。"
      },
      {
        q: "According to paragraph 2, chronic boredom ______.",
        options: ["is caused by delayed trains", "is linked to anxiety and depression", "is a signal worth listening to", "helps people focus on a task"],
        answer: 1,
        explain: "原文 the latter is associated with anxiety and depression。A 是情境性无聊的例子，C 是“两者之间”的无聊，D 与原文无关。"
      },
      {
        q: "In the phone-book experiment, participants who had been made bored ______.",
        options: ["copied numbers more accurately", "spent longer on social media", "came up with more original ideas", "refused to invent uses for the cups"],
        answer: 2,
        explain: "those who had been made bored produced markedly more original ideas。"
      },
      {
        q: "The default mode network is mentioned mainly to ______.",
        options: ["explain how the brain stores numbers", "show why social media is addictive", "suggest a mechanism behind creative association", "prove that boredom is a disease"],
        answer: 2,
        explain: "它跟在 The mechanism is not mysterious 之后，作用是为“走神产生联想”提供机制解释。"
      },
      {
        q: "The author's attitude towards entertainment is ______.",
        options: ["hostile", "cautious but tolerant", "enthusiastic", "completely indifferent"],
        answer: 1,
        explain: "None of this means we should ban entertainment, still less that we should feel guilty 一句：不禁、不愧，只提醒别把空隙填满——是“有保留的宽容”。"
      }
    ],
    output: {
      prompt: "写一段 80–100 词的英文，描述你最近一次“无事可做”的时刻。",
      tasks: [
        "用上今天至少 5 个生词，写完在下方笔记里把它们列出来自检。",
        "用一次 rather than 做对比。",
        "用 The next time ... 写一句结尾。",
        "再合上文本，用 60 秒口头复述文章主旨。"
      ]
    }
  },

  /* ---------------- 04 英语听力 ---------------- */
  listening: {
    title: "VOA Learning English · 每日听力",
    level: "慢速英语 · 每天更新",
    source: "VOA Learning English",
    url: "https://learningenglish.voanews.com/",
    note: "这是美国之音的慢速英语栏目，每天都有新音频。打开后在首页找当天的音频节目（Audio），先不看文字听两遍，再对照页面上的原文核对。"
  },
  ai: {
    term: "AI Agent（智能体）",
    oneLiner: "能自己决定下一步做什么、并且动手去做的模型。",
    explain: [
      "普通的聊天模型是“一问一答”：你说一句，它回一句，每一步都由你推着走。你让它写代码，它写完就停；能不能跑、报错怎么办，还得你来问。",
      "智能体多了一个循环：给它一个目标，它自己拆步骤、挑工具、看结果，发现不对就改，直到交差。所以它真正需要的三样东西是——目标、工具、循环。",
      "关键差别不在“更聪明”，而在“能动手”：能读文件、跑命令、查网页，然后根据结果决定下一步。很多号称 Agent 的产品其实只是把几个固定步骤串起来；分水岭在于它会不会在出错之后自己换一条路。"
    ],
    analogy: "聊天模型像一台答题机，你问什么它答什么；智能体像一个跑腿的实习生，你说“把这周的会议整理成纪要”，它会自己去翻日历、找录音、写完再检查一遍。",
    example: "你说“帮我把这周的会议整理成纪要”。它会先列计划：找会议记录 → 转写录音 → 提取决议和待办 → 写成文档 → 自查有没有漏人。中途某个录音找不到，它会换个方式找，而不是停下来问你。",
    takeaway: "判断一个产品是不是智能体，不看它会不会聊天，看它能不能在没有你逐步指挥的情况下，连续完成多个动作，并在出错时自己纠正。",
    quiz: {
      q: "下面哪一个最接近“智能体”？",
      options: [
        "能回答天气的语音助手",
        "能自己查资料、写文件、检查后再交付的助手",
        "根据你看过的电影推荐片单的系统",
        "能把网页翻译成中文的浏览器插件"
      ],
      answer: 1,
      explain: "其余三个都是“单步能力”：调用一个接口或模型就出结果，没有“拆步骤—执行—检查—纠错”的循环。"
    },
    next: "什么是 Skill（技能）？为什么同样是 Agent，加了 Skill 之后表现会差很多。"
  }
};
