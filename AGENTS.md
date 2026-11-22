# AGENTS.md —— 给接手这个站的 agent 看

这个仓库是「每日一学」的 **全部** 内容与代码：纯静态站，GitHub Pages 托管，
线上地址 <https://qing-qian152.github.io/knowledges-shared-station/>。
没有后端、没有数据库、没有构建步骤。改完文件推上去，Pages 约 1 分钟后重建。

**如果你的任务是"更新今天的內容"，只做一件事：按下面 5 步生成当天的
`data/days/YYYY-MM-DD.js`，然后发布。不要重构站点，不要动样式。**

---

## 每日流程

```bash
# 0) 先看今天是否已存在（存在就别覆盖，除非用户要求重做）
ls data/days/$(date +%F).js

# 1) 建骨架：生成 parts/YYYY-MM-DD/_SPEC.md（内含全部字段与字数要求）
python scripts/daytool.py new --date 2026-11-23

# 2) 按板块分别写 JSON 到 parts/2026-11-23/
#    theme.json  chinese.json  poem.json  english.json  listening.json
#    一次只写一个板块，写完立刻进入下一步；不要试图一次输出整期（约 3.4 万字，必崩）

# 3) 合并 + 校验（校验不通过会拒绝写入）
python scripts/daytool.py build --date 2026-11-23

# 4) 单独复检（可选，--fix 会自动修插图白名单/译文段数/清单题数）
python scripts/daytool.py check --date 2026-11-23 --fix

# 5) 发布：重建索引 + sitemap + robots + 页脚往期链接
python scripts/daytool.py publish --date 2026-11-23
#    有可用 git 凭据时加 --git 即可自动 commit & push；
#    否则用 GitHub 连接器上传 publish 列出的那几个文件
```

`python` 指 Python 3.8+，只用标准库。**不需要 Node，不需要任何 API Key。**

---

## 内容硬规则（校验器会拦）

| 板块 | 要求 |
| --- | --- |
| 语文 | **一篇完整原创散文，1300–1700 字，7–9 段**；`author` 一律写「本站原创」；讲解 4–5 条、好词 6–8、好句 3–4、手法 4–5、仿写任务必须当天能写完 |
| 古诗文 | **整首**（词要整阕，不许摘句）；注释 4–6、译文一段、赏析 3–4 段、背诵提示 |
| 英文 | 原创 **480–600 词**、5–6 段、雅思 6.5–7.5；`translation` **段数必须与 `body` 完全相同**并逐段对应；生词 12–15、地道搭配 8–10、短语 6–8、句式 4–5、语法 3–4；阅读单选 5–6 题，`answer` 从 **0** 起 |
| 听力 | **自创**英文短文 180–260 词，拆 6–10 句，`lines` 里 `en`/`cn` 一一对应；标准美式拼写；**不许给任何外部链接** |
| 清单 | 5–6 项，覆盖四个板块，动词开头，`tip` 一句方法提示 |
| 引言 | 一句压得住主题的名言，优先可考经典并写清 `source` |
| 插图 | `image` 只能取 `scripts/daytool.py` 里 `ART` 列表的 16 个场景名（`lotus-moon`…`paper`） |
| 标点 | 中文正文用全角标点；引号用「」或“”，**不要用 ASCII 双引号** |

## 四条禁止

1. **不许给原创文字署真名家名字**（朱自清、徐志摩、傅雷…）。那是伪造，校验器会拦。
2. **不许编造名言或张冠李戴**。拿不准出处就换一句家喻户晓的，`source` 写空字符串。
3. **不许写外链**（听力尤其）。所有内容都要能离线读。
4. **不许动 `assets/`、`index.html` 的壳层、`sw.js`、`manifest.json`** —— 除非用户明确要求改版式。若真的改了壳层文件，必须把 `sw.js` 里的 `VERSION` 加一，否则老访客看到旧缓存。

## 发布后自查

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://qing-qian152.github.io/knowledges-shared-station/data/days/2026-11-23.js
```

应返回 `200`（Pages 重建约需 20 秒，CDN 生效可能到 10 分钟）。
浏览器打开 `https://qing-qian152.github.io/knowledges-shared-station/?d=2026-11-23` 确认四个板块都渲染出来。

---

## 目录

```
index.html              页面骨架（顶部栏 / 板块标签 / noscript 往期链接）
assets/app.js           全部渲染逻辑（板块、日期导航、朗读、清单、导出）
assets/style.css        6 套配色 + 5 档中文字体 + 排版
assets/art.js           21 幅程序化水墨插图（按 date 做种子，每天略有不同）
assets/fonts/           自托管中文字体子集（宋/楷/仿宋/文楷）
data/days/YYYY-MM-DD.js 每天一期内容（window.LEARN_DAY）
data/days/index.js      日期索引（window.LEARN_INDEX），由 daytool 维护
parts/YYYY-MM-DD/       分段写作的中间稿，不入库
scripts/daytool.py      生成/校验/发布工具（Python）
scripts/generate.mjs    旧的 Node 生成器（调 DeepSeek API，作兜底）
scripts/build-seo.mjs   旧的 SEO 构建（daytool 已用 Python 复刻）
.github/workflows/      GitHub Actions（定时生成，已默认停用）
```

## 两种更新方式

- **agent 自己写（推荐）**：就是本文档上面的流程，质量可控、不花钱、不依赖 API 额度。
- **调 API 生成（兜底）**：`API_KEY=... node scripts/generate.mjs --date 2026-11-23 && node scripts/build-seo.mjs`。
  2026-11-16 至 11-21 就是因为 DeepSeek 余额不足连续失败 6 天，所以不要把定时任务只押在它身上。
