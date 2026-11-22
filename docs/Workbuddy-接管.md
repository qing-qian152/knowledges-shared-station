# 把「每日一学」交给 Workbuddy 每天更新

这份文档是给**人**看的操作手册；给 agent 看的规则在仓库根目录 `AGENTS.md`。

---

## 一、为什么要换

原来每天由 GitHub Actions 在 UTC 22:00（北京次日 06:00）调 DeepSeek 生成。
2026-11-16 到 11-21 连续 6 天失败，日志里的原因很直接：

```
✗ API 402: {"error":{"message":"Insufficient Balance","type":"insufficient_balance_error"}}
```

**账户余额不足**。也就是说，只要额度用完，站点就会静默断更——而断更时页面看起来
一切正常，只是没有新的一天。这正是本次把更新交给 Workbuddy 的原因：
Workbuddy 自己写内容，不花 API 的钱，也不依赖那个余额。

> 顺带说明：11-22 那天恢复了，所以现在线上是 22 期，中间缺 11-16 至 11-21 共 6 天。

---

## 二、交接后的分工

| 谁 | 干什么 |
| --- | --- |
| **Workbuddy** | 每天写四个板块的内容 → 跑 `daytool.py` 校验 → 发布 |
| 仓库里的 `scripts/daytool.py` | 拼装、校验、重建索引/站点地图、可选 git 推送 |
| GitHub Pages | 每次推送后自动重建站点（约 20 秒） |
| GitHub Actions | **保留但停用定时**，只作手动兜底（`workflow_dispatch`） |

为什么必须停掉 Actions 的定时：它在北京时间 06:00 跑，比人上班还早。
如果它先把当天生成出来，Workbuddy 再跑就会看到"已存在"而跳过——结果还是老流程在干活。

---

## 三、一次性准备（3 选 1）

### 方案 A：让 Workbuddy 自己拉仓库（最省事）

直接对 Workbuddy 说：

> 把 `https://github.com/qing-qian152/knowledges-shared-station` 克隆到工作区
> 的 `daily-learn` 目录，读根目录的 AGENTS.md，以后每天按里面的流程更新当天内容。

它已经连上 GitHub，能读也能写。克隆后所有命令都在 `daily-learn` 目录下执行。

### 方案 B：它只有「GitHub 连接器」、没有命令行

那就让它在连接器里读文件的**内容**给模型看，生成后直接用连接器写回仓库。
`daytool.py` 的 `publish` 会打印出需要更新的文件清单（通常是 5 个），
用连接器逐个覆盖即可。校验这一步仍建议跑——它能在上传前拦住结构错误。

### 方案 C：本机已有仓库

在 `D:\Workbuddy工作区` 下放一份 clone，把工作区指向它。
注意：git 的全局代理 `http.proxy=http://127.0.0.1:10808` 在代理没开时会让
`git clone/push` 直接失败（`Failed to connect ... over proxy`），
`daytool.py publish --git` 已经带了 `-c http.proxy=` 把它绕开。

---

## 四、每日怎么跑

```bash
cd daily-learn

python scripts/daytool.py new   --date 2026-11-23     # 1. 骨架 + 规格
# 2. 依次写 parts/2026-11-23/{theme,chinese,poem,english,listening}.json
python scripts/daytool.py build --date 2026-11-23     # 3. 合并 + 校验
python scripts/daytool.py publish --date 2026-11-23   # 4. 重建索引/SEO
```

第 4 步会输出改动文件；有 git 凭据就加 `--git` 自动提交推送，没有就用连接器上传。

### 可以直接粘给 Workbuddy 的每日提示词

> 按 `AGENTS.md` 的流程更新今天（`$(date +%F)`）的内容：
> 先 `python scripts/daytool.py new --date 今天`，
> 然后**一个板块一个板块**地写到 `parts/今天/` 里——顺序是 theme → chinese → poem → english → listening，
> 语文必须 1300 字以上并且署名「本站原创」，英文的 translation 段数要和 body 严格一致，听力不要任何外链。
> 每写完一个板块可以先不管，全部写完后运行 `build`，有报错就按报错改，
> 通过后运行 `publish`。最后告诉我今天讲了什么、哪几个文件变了。

提示词里点明"一个板块一个板块"很关键：整期约 3.4 万字，一次输出必然截断。

---

## 五、定时怎么设

Workbuddy 若支持定时任务，就建一条**每天 06:30** 的任务，内容用上面那段提示词
（把"今天"换成它自己的日期函数）。选 06:30 是因为读者早上通勤前就有新内容，
又留出时间在出问题时手动补救。

若它不支持定时，就每天开工时说一句「更新今天的」。`AGENTS.md` 已经把细节写全了，
不需要每次重新交代规则。

---

## 六、万一某天没更新

线上不会报错，只是 `?d=今天` 还是昨天那期。补救：

```bash
python scripts/daytool.py new   --date 2026-11-16
python scripts/daytool.py build --date 2026-11-16
python scripts/daytool.py publish --date 2026-11-16
```

一天一条，可以连续补。`publish` 会重建索引和 `sitemap.xml`，日期下拉里立刻出现。

---

## 七、校验器到底会拦什么

`build` 和 `publish` 都会跑一遍 `validate()`，硬性错误会直接拒绝写入：

- 语文不足 1000 字，或署名写了真名家名（伪造署名）
- 英文 `translation` 段数与 `body` 不一致
- 阅读题 `answer` 下标越界、选项少于 2 个
- 听力某句缺 `en` 或 `cn`
- `image` 不在 16 个内置场景里
- 与最近 4 期重复的古诗文

只警告不拦的：字数略少、词数偏离、条数不足、主题撞车。
可以用 `check --fix` 自动修掉的三类：插图白名单、译文段数、清单里的"五道题"与实际题数不一致。

---

## 八、想退回去

`.github/workflows/daily.yml` 里把 `schedule:` 那两行取消注释、恢复 cron 即可，
再在仓库 Settings → Secrets 里确保 `API_KEY` 有效、DeepSeek 有余额。
两条流程生成的文件格式完全一样，可以随时来回切。
