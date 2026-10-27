# 每日一学 · Daily Learn

一个**纯静态**的每日学习站点：每天一页，五个板块——晨读、古诗文、英文精读、英语听力、AI 知识。
内容由模型每天自动生成并提交到仓库，页面本身不需要任何后端服务。

> 打开就是一个网页，没有登录、没有数据库、没有服务器账单。你的学习进度存在浏览器本地。

---

## 它长什么样

打开先是一句**名言**（大字号、衬线体），再往下是五个板块：

| 板块 | 内容 |
| --- | --- |
| **晨读** | 一篇**完整的**公版名篇（1200–2000 字）+ 应景插画 + 逐句讲解 + 好词好句 + 写作手法 + 当天能写完的仿写任务 |
| **古诗文** | 一首与当日主题呼应的诗词：应景插画、注释、白话译文、结构赏析、背诵提示 |
| **英文精读** | 480–600 词原创文章（IELTS 7.0 难度）+ **一键显示逐段译文** + 生词、**地道搭配**、短语、句式、语法点 + 中文摘要 + 6 道单选题 + 输出任务 |
| **英语听力** | 每天一篇**原创英文短文**（180–260 词），页面内用浏览器**标准美音**逐句朗读 + 高亮跟读 + 三档语速 + 原文/译文切换；不依赖任何外链 |
| **AI 知识** | 每天一个 AI 概念（智能体 → Token → 上下文窗口 → 幻觉 → RAG …），配类比、场景和小测 |
| **今日清单** | 当天的可勾选任务清单，勾选即保存，全部勾完会提示休息 |

互动部分：选择题答错自动进错题本（带中文解析）、生词卡点击显隐、英文全文朗读、**英文逐段译文开关**、**听力逐句朗读与译文开关**、笔记自动保存、板块标记完成、清单打勾、每日打卡与连续天数、深浅色切换、按日期回看历史。

---

## 特性

- **零依赖、零构建**：原生 HTML / CSS / JS，双击 `index.html` 就能跑，不需要 npm。
- **零后端**：不需要服务器、数据库、账号系统。
- **成本与用户数无关**：每天只在构建时调用一次模型，访客再多也不产生费用。
- **进度本地化**：答题记录、错题本、打卡天数存 `localStorage`，不上传任何数据。
- **移动优先**：手机上比例舒服，适合每天通勤看。
- **可当 App 用（PWA）**：带 `manifest.json` + Service Worker，手机浏览器里点「安装到桌面 / 添加到主屏幕」后就是独立图标、全屏无地址栏、断网也能打开昨天读过的内容；安卓与桌面 Chrome 会出现「安装到桌面」按钮，iPhone 上是「分享 → 添加到主屏幕」。
- **自动更新**：GitHub Actions 每天定时生成 → 自动提交 → 静态站点自动重新发布。

---

## 本地跑起来

```bash
# 直接看首日内容（无需任何配置）
# 双击 index.html 即可

# 生成新的一天（占位内容，不需要 API Key）
node scripts/generate.mjs --mock --date 2026-10-28

# 真实生成（需要 API Key）
export API_KEY=sk-xxxx          # Windows PowerShell: $env:API_KEY="sk-xxxx"
node scripts/generate.mjs        # 默认生成今天，自动挑主题池里的下一个主题
```

可用参数与环境变量：

| 参数 / 变量 | 说明 |
| --- | --- |
| `--date 2026-11-01` | 指定生成哪一天 |
| `--topic 3` | 指定主题池下标（默认按已生成天数轮转） |
| `--mock` | 生成占位内容，不调用模型 |
| `--force` | 覆盖已存在的当天文件 |
| `API_KEY` | 模型 API Key（也可用 `OPENAI_API_KEY`） |
| `BASE_URL` | 接口地址，默认 `https://api.deepseek.com/v1` |
| `MODEL` | 模型名，默认 `deepseek-chat` |

---

## 部署成网站（GitHub Pages）

1. 新建一个仓库，把本项目推上去（或用你自己的 fork）。
2. 仓库 **Settings → Secrets and variables → Actions → New repository secret**
   添加 `DEEPSEEK_API_KEY`，值为你的模型 Key。
3. 仓库 **Settings → Pages**：`Source` 选 **Deploy from a branch**，分支 `main`，目录 `/ (root)`，保存。
4. 到 **Actions** 页手动跑一次 `Daily content`（`Run workflow`），确认能生成并提交。
5. 一两分钟后访问 `https://<你的用户名>.github.io/<仓库名>/`，把链接发给朋友就行。

小提示：

- 定时任务写在 `.github/workflows/daily.yml`，`cron: "0 22 * * *"` 是 **UTC** 时间，对应北京时间次日 06:00。想换时间就改这里（UTC = 北京时间 − 8 小时）。
- 「今天是哪天」按 `TZ` 计算（workflow 里已设为 `Asia/Shanghai`）。Runner 本身是 UTC，不设的话 22:00 UTC 会被算成前一天，内容日期整体差一天。
- 想用自定义域名：在仓库根目录加 `CNAME` 文件写入域名，并在 DNS 里加 CNAME 记录指向 `<用户名>.github.io`。
- 仓库是公开的没关系：内容生成在构建期，访客不会触发任何 API 调用。

---

## 目录结构

```
daily-learn/
├── index.html                  # 页面外壳
├── assets/
│   ├── style.css               # 设计系统（纸感暖色 + 深色模式）
│   ├── art.js                  # 9 幅代码生成的水墨插画（无外部图片）
│   └── app.js                  # 全部交互（渲染、答题、清单、打卡、笔记、TTS）
├── data/
│   └── days/
│       ├── index.js            # 日期索引（脚本自动维护）
│       └── 2026-10-27.js       # 一天的内容：window.LEARN_DAY = {...}
├── scripts/
│   └── generate.mjs            # 生成脚本（调用模型 → 校验 → 写文件 → 更新索引）
├── topics.json                 # 主题池（30 天一轮，可自由增删）
├── .github/workflows/daily.yml # 每天自动生成 + 提交
└── README.md
```

数据用 `<script>` 注入 `window.LEARN_DAY`，而不是 `fetch` JSON —— 这样 `file://` 直接双击打开也不会被 CORS 拦住。

---

## 内容数据结构

`data/days/<日期>.js` 里是一个对象，五个板块 + 名言 + 清单：

```js
window.LEARN_DAY = {
  date: "2026-10-27", weekday: "周二", theme: "当日主题",
  quote:     { text, author, source },                      // 首屏每日一句
  chinese:   { title, author, tag, readingTime, image, imageCaption,
               body[], explain[], words[], expressions[], techniques[], imitation{} },
  poem:      { title, author, dynasty, tag, image, imageCaption,
               body[], notes[], translation, appreciation[], recite },
  english:   { title, level, words, body[], translation[], vocab[], collocations[], phrases[], patterns[], grammar[],
               summary, questions[], output{} },
  listening: { title, level, words, topic, lines[{ en, cn }], note },  // 自创短文 + 浏览器美音朗读
  ai:        { term, oneLiner, explain[], analogy, example, takeaway, quiz{}, next },
  checklist: [{ text, tip }]                                 // 今日任务清单
}
```

`questions[].answer` 是 **0 起始的下标**（0 = A）。生成脚本会校验题量与下标合法性，不合法直接报错而不是写出坏数据；`english.translation` 段数对不上会按正文补齐；`image` 不认识时自动退回 `paper`（素纸）。

---

## 配图

`assets/art.js` 里内置 16 幅**代码生成的水墨插画**，不引用任何外部图片，离线可用、无版权问题。同一个场景名同一天画出来一样，**换一天构图会重新随机**（seed 取日期），所以每天的配图都不重复。数据里只写场景名：

| 场景名 | 画面 | 场景名 | 画面 |
| --- | --- | --- | --- |
| `lotus-moon` | 荷塘月色 | `autumn-mountain` | 空山新雨 |
| `bamboo` | 竹林清影 | `snow-peak` | 雪岭 |
| `snow-boat` | 江雪孤舟 | `spring-river` | 春江 |
| `rain-window` | 雨窗 | `dunes` | 大漠孤烟 |
| `border` | 边塞烽烟 | `pastoral` | 田园 |
| `tower` | 登高 | `plum` | 寒梅 |
| `autumn-river` | 秋江芦荻 | `pine-valley` | 松间清泉 |
| `lamp` | 灯下 | `paper` | 素纸（兜底） |

要加新画面：在 `art.js` 的 `SCENES` 里加一个 `{ label, draw(r, uid) }`，`draw()` 返回 SVG 片段即可；同时把场景名加进 `scripts/generate.mjs` 的 `ART` 白名单和 prompt 的场景列表。

---

## 自定义主题

`topics.json` 是一个数组，每天消耗一条：

```json
{
  "theme": "当日主题（会显示在页面顶部）",
  "chinese": "语文方向，如「现代散文 · 写景 · 朱自清」",
  "poem": "诗词方向，如「王维《山居秋暝》」",
  "english": "英文题材，如「科技与生活 · 讨论 AI 助手」",
  "ai": "当天要讲的 AI 概念",
  "listening": "听力方向，如「日常叙事 · 一段关于地铁的观察」（会写成自创英文短文）"
}
```

加多少条，就有多少天不重复；写满 30 条后回到第一条，但因为是每次重新生成，重写出来的文章不会是原文。

想改文风、篇幅、题目难度，改 `scripts/generate.mjs` 里的 `buildPrompt()` 就行，字段结构和 `validate()` 保持同步。

---

## 内容来源与版权

- **语文**：只用公版作品（明清以前，或 1949 年前已故作者），或由模型原创。
- **古诗文**：公版。
- **英文精读**：模型原创，不搬运他人文章。
- **听力**：模型原创的英文短文，朗读由浏览器自带的语音合成（SpeechSynthesis，en-US）完成，不涉及任何第三方音频或音频版权。
- **配图**：`assets/art.js` 用代码画的水墨插画，无第三方素材。
- **名言**：中外名人语句，均为公版内容并标注作者与出处。
- **AI 知识**：原创讲解。

模型生成的内容**可能有事实或表述错误**，尤其古诗文注释和语法讲解，请以自己的判断为准；发现问题欢迎提 Issue 或 PR 修正。

---

## 贡献

1. Fork → 新建分支 → 改动
2. 本地跑 `node scripts/generate.mjs --mock --date 2026-01-01` 确认脚本没坏
3. 双击 `index.html` 看一眼页面
4. 提 PR，说明改了什么、为什么

---

## License

- **代码**（`assets/`、`scripts/`、`.github/`）：MIT
- **内容**（`data/`、`topics.json`）：CC BY 4.0

详见 [LICENSE](LICENSE)。
