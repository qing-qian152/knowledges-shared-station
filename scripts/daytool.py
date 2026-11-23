#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""每日一学 —— 内容工具（纯 Python 标准库，不需要 Node，不需要 API Key）

给「接管每日更新」的 agent（Workbuddy / 人或脚本）用。四个子命令：

    python scripts/daytool.py new      --date 2026-11-23       # 生成分段写作骨架 + 规格
    python scripts/daytool.py build    --date 2026-11-23       # 把 parts/ 里的分段 JSON 合成正文
    python scripts/daytool.py check    --date 2026-11-23 [--fix]
    python scripts/daytool.py publish  [--date 2026-11-23] [--git]

分段写作的意义：一整期约 3.4 万字，任何模型都不可能一次写完还不崩。
所以按板块分开写，最后用 build 合并 —— 每段都能单独校验、单独重写。
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time

# Windows 控制台默认 GBK，遇到 ▸ ✓ 会直接崩；这里强制 UTF-8 且永不因编码失败
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAYS = os.path.join(ROOT, 'data', 'days')
INDEX = os.path.join(DAYS, 'index.js')
QUEUE = os.path.join(ROOT, 'data', 'queue')
PARTS = os.path.join(ROOT, 'parts')
HTML = os.path.join(ROOT, 'index.html')
SITE = 'https://qing-qian152.github.io/knowledges-shared-station'
TZ_OFFSET = dt.timezone(dt.timedelta(hours=8))

WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
SECTIONS = ('chinese', 'poem', 'english', 'listening')
MODULES = 4

# 只能从 assets/art.js 的 SCENES 里挑，写错会退成素纸。
# 这份列表必须与 assets/art.js 的键保持同步 —— 由 scripts/check-structure.mjs 交叉校验，
# 漂移了 CI 会红，不要再手工对照。
ART = ['lotus-moon', 'autumn-mountain', 'bamboo', 'snow-peak', 'snow-boat',
       'spring-river', 'rain-window', 'dunes', 'border', 'pastoral', 'tower',
       'plum', 'autumn-river', 'pine-valley', 'lamp', 'paper',
       'desk', 'bloom']

# 语文必须原创署名「本站原创」：给原创散文署真名家名 = 伪造
FAMOUS = ['朱自清', '鲁迅', '郁达夫', '老舍', '傅雷', '胡适', '徐志摩', '梁实秋',
          '周作人', '冰心', '沈从文', '汪曾祺', '丰子恺', '林语堂', '钱钟书',
          '张爱玲', '巴金', '萧红', '史铁生', '余秋雨', '贾平凹', '张晓风']

SPEC = """# {date}（{weekday}）写作规格

把每个板块**单独**写成 JSON 文件放进本目录，然后运行
`python scripts/daytool.py build --date {date}` 合并。
不要一次写完所有板块；每写完一个就跑一次 check 会更稳。

各文件必须是一个 JSON 对象（不要 markdown 围栏、不要注释、不要尾逗号）：

## theme.json
{{
  "theme": "当日主题，8-14 字短句",
  "quote": {{"text": "名言原文", "author": "真实作者", "source": "出处，如 论语·子路；没把握写空"}},
  "checklist": [{{"text": "动词开头的一件事", "tip": "方法提示，可空字符串"}}]
}}

## chinese.json —— 一篇完整的原创散文
{{
  "title": "篇名", "author": "本站原创", "tag": "现代散文 · 写景叙事",
  "readingTime": "约 8 分钟", "image": "插图场景名", "imageCaption": "10-18 字配图说明",
  "body": ["第1段", "..."],
  "explain": [{{"line": "原句", "note": "讲解，可用 <b></b> 标重点"}}],
  "words": [{{"w": "词", "meaning": "释义", "use": "用法点拨"}}],
  "expressions": [{{"s": "好句", "why": "妙在哪里"}}],
  "techniques": [{{"name": "手法", "desc": "解释", "example": "文中例句"}}],
  "imitation": {{"prompt": "仿写任务", "steps": ["步骤1", "步骤2", "步骤3"]}}
}}
- body 1300-1700 字，7-9 段，必须整篇；讲解 4-5 条、好词 6-8、好句 3-4、手法 4-5
- author 一律「本站原创」，**禁止**署真实名家名

## poem.json —— 与主题呼应的整首
{{
  "title": "诗题", "author": "作者", "dynasty": "朝代", "tag": "体裁",
  "image": "插图场景名", "imageCaption": "配图说明",
  "body": ["诗句1，", "诗句2。"],
  "notes": [{{"line": "词", "note": "注释"}}],
  "translation": "白话译文，一段",
  "appreciation": ["赏析1", "赏析2", "赏析3"],
  "recite": "背诵提示"
}}
- 词要整阕，不能只摘几句；注释 4-6 条、赏析 3-4 段

## english.json —— 雅思 6.5-7.5 的原创长文
{{
  "title": "English Title", "level": "IELTS 7.0", "words": 520,
  "body": ["段落1", "..."],
  "translation": ["段落1的中文翻译", "..."],
  "vocab": [{{"w": "word", "pos": "n.", "cn": "释义", "ex": "例句"}}],
  "collocations": [{{"phrase": "地道搭配", "cn": "中文意思", "ex": "例句"}}],
  "phrases": [{{"p": "短语", "cn": "中文", "ex": "例句"}}],
  "patterns": [{{"s": "原文句式", "cn": "中文意思", "note": "用法"}}],
  "grammar": [{{"point": "语法点", "explain": "讲解", "example": "原文例句"}}],
  "summary": "中文摘要，120-160 字",
  "questions": [{{"q": "英文题干", "options": ["A", "B", "C", "D"], "answer": 0, "explain": "中文解析"}}],
  "output": {{"prompt": "输出任务", "tasks": ["要求1", "要求2"]}}
}}
- body 480-600 词、5-6 段；**translation 段数必须与 body 完全相同、逐段对应**
- 生词 12-15、地道搭配 8-10、短语 6-8、句式 4-5、语法 3-4、阅读题 5-6（answer 从 0 起）

## listening.json —— 自创听力短文（不用外链）
{{
  "title": "标题", "level": "慢速美音", "words": 220, "topic": "一句话说明听的是什么",
  "lines": [{{"en": "第一句英文。", "cn": "第一句中文。"}}],
  "note": "一句话使用说明"
}}
- 180-260 词，拆 6-10 句，标准美式拼写；en 与 cn 一一对应、数量相等

## 硬性规则
1. 中文全角标点；字符串内部要引号时用「」或“”，**不要用 ASCII 双引号**
2. 插图场景只能是：{art}
3. 名言优先用可考经典，作者必须真实；拿不准就换一句，宁可不惊艳也不能编造
4. 清单 5-6 项，覆盖四个板块，动词开头
"""


# ---------------------------------------------------------------- 基础工具

def today() -> str:
    return dt.datetime.now(TZ_OFFSET).strftime('%Y-%m-%d')


def weekday_of(s: str) -> str:
    y, m, d = (int(x) for x in s.split('-'))
    return WEEK[dt.date(y, m, d).weekday()]


def day_path(date: str, queue: bool = False) -> str:
    return os.path.join(QUEUE if queue else DAYS, date + '.js')


def find_day(date: str) -> str:
    """已发布的优先，其次队列里的。返回路径（可能不存在）。"""
    p = day_path(date)
    if os.path.exists(p):
        return p
    q = day_path(date, queue=True)
    return q if os.path.exists(q) else p


def load_day_file(path: str) -> dict:
    text = open(path, encoding='utf-8').read()
    i, j = text.index('{'), text.rindex('}')
    return json.loads(text[i:j + 1])


def save_day_file(date: str, day: dict, queue: bool = False) -> None:
    body = json.dumps(day, ensure_ascii=False, indent=2)
    note = '待发布' if queue else '由 Workbuddy 每日生成'
    header = '/* %s · %s —— %s（scripts/daytool.py） */\n' % (date, day['weekday'], note)
    target = day_path(date, queue=queue)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, 'w', encoding='utf-8', newline='\n') as f:
        f.write(header + 'window.LEARN_DAY = ' + body + ';\n')


def all_dates() -> list[str]:
    if not os.path.isdir(DAYS):
        return []
    return sorted(f[:10] for f in os.listdir(DAYS) if re.fullmatch(r'\d{4}-\d{2}-\d{2}\.js', f))


def queue_dates() -> list[str]:
    if not os.path.isdir(QUEUE):
        return []
    return sorted(f[:10] for f in os.listdir(QUEUE) if re.fullmatch(r'\d{4}-\d{2}-\d{2}\.js', f))


def chars(s) -> int:
    return len(re.sub(r'\s', '', str(s or '')))


# ---------------------------------------------------------------- 校验

class Report:
    def __init__(self):
        self.errors: list[str] = []
        self.warns: list[str] = []
        self.fixes: list[str] = []

    def err(self, m):
        self.errors.append(m)

    def warn(self, m):
        self.warns.append(m)

    def fix(self, m):
        self.fixes.append(m)

    def dump(self) -> int:
        for m in self.fixes:
            print('  ✎ 已修：' + m)
        for m in self.warns:
            print('  ⚠ ' + m)
        for m in self.errors:
            print('  ✗ ' + m)
        if self.errors:
            print('\n✗ %d 处不合格，先改完再发布' % len(self.errors))
            return 1
        print('\n✓ 结构校验通过' + ('（%d 处自动修正）' % len(self.fixes) if self.fixes else ''))
        return 0


def validate(day: dict, date: str, fix: bool) -> Report:
    r = Report()

    # --- 日期与星期 ---
    if day.get('date') != date:
        if fix:
            day['date'] = date
            r.fix('date 补为 ' + date)
        else:
            r.err('date 应为 %s，实际 %r' % (date, day.get('date')))
    wd = weekday_of(date)
    if day.get('weekday') != wd:
        if fix:
            day['weekday'] = wd
            r.fix('weekday 改为 ' + wd)
        else:
            r.err('weekday 应为 %s，实际 %r' % (wd, day.get('weekday')))

    # --- 板块齐备 ---
    for k in SECTIONS:
        if not isinstance(day.get(k), dict):
            r.err('缺少板块 %s' % k)
    if r.errors:
        return r

    # --- 主题与引言 ---
    theme = str(day.get('theme') or '').strip()
    if not theme:
        r.err('theme 不能为空')
    elif not 6 <= chars(theme) <= 16:
        r.warn('theme「%s」%d 字，建议 8-14 字' % (theme, chars(theme)))
    q = day.get('quote') or {}
    if not str(q.get('text') or '').strip():
        r.err('quote.text 缺失（首屏大字全靠它）')
    if not str(q.get('author') or '').strip():
        r.err('quote.author 缺失')
    if q.get('author') and q['author'] in ('佚名', '网络', '网友'):
        r.warn('quote.author 是「%s」，首屏会显得不可信，建议换成可考出处' % q['author'])

    # --- 语文 ---
    cn = day['chinese']
    cn_len = chars(''.join(str(x) for x in (cn.get('body') or [])))
    # origin 决定「署名」和「篇幅」两件事怎么判：
    #   "public"   = 逐字复制公版原文（作者去世 50 年以上），允许署真名，篇幅按原文走
    #   "original" / 缺省 = 本站原创，必须署「本站原创」，篇幅有硬下限
    # 以前只按署名黑名单判断，把《匆匆》《秋夜》这类真正的公版名篇也当成了伪造。
    origin = str(cn.get('origin') or '').strip()
    if origin and origin not in ('public', 'original'):
        r.err('chinese.origin 只能是 "public" 或 "original"（现在是「%s」）' % origin)
        origin = ''

    if origin == 'public':
        if cn_len < 600:
            r.err('语文公版原文仅 %d 字，多半是被截断了（原文应整篇照录）' % cn_len)
        elif cn_len < 1200:
            r.warn('语文公版原文 %d 字，比站点常规篇幅短，确认是否为整篇' % cn_len)
    elif cn_len < 1000:
        r.err('语文正文仅 %d 字，至少要 1000 字（目标 1300-1700，读者要读尽兴）' % cn_len)
    elif cn_len < 1300:
        r.warn('语文正文 %d 字，偏短，建议补到 1300 字以上' % cn_len)
    elif cn_len > 1900:
        r.warn('语文正文 %d 字，偏长，建议压到 1700 以内' % cn_len)
    if not 7 <= len(cn.get('body') or []) <= 9:
        r.warn('语文 %d 段，建议 7-9 段' % len(cn.get('body') or []))

    author = str(cn.get('author') or '').strip()
    if author in FAMOUS:
        if origin != 'public':
            r.err('语文署名「%s」但 chinese.origin 没标 "public"：'
                  '原创文字署名家属伪造，改成「本站原创」或标明是公版原文' % author)
    elif author != '本站原创':
        if origin == 'public':
            r.warn('语文标了 origin="public" 但署名「%s」不是公认名家，确认没标错' % author)
        else:
            r.warn('语文 author 是「%s」，除逐字复制公版原文（origin="public"）外都应写「本站原创」'
                   % author)
    for key, lo, hi, name in [('explain', 4, 5, '讲解'), ('words', 6, 8, '好词'),
                              ('expressions', 3, 4, '好句'), ('techniques', 4, 5, '手法')]:
        n = len(cn.get(key) or [])
        if n < lo:
            r.warn('语文%s只有 %d 条，建议 %d-%d' % (name, n, lo, hi))
    if not (cn.get('imitation') or {}).get('prompt'):
        r.err('chinese.imitation.prompt 缺失（仿写任务是这一板块的落点）')

    # --- 古诗文 ---
    poem = day['poem']
    if not (poem.get('body') or []):
        r.err('poem.body 为空')
    for k in ('title', 'author'):
        if not str(poem.get(k) or '').strip():
            r.err('poem.%s 缺失' % k)
    if len(poem.get('notes') or []) < 4:
        r.warn('古诗文注释 %d 条，建议 4-6 条' % len(poem.get('notes') or []))
    if len(poem.get('appreciation') or []) < 3:
        r.warn('古诗文赏析 %d 段，建议 3-4 段' % len(poem.get('appreciation') or []))

    # --- 英文 ---
    en = day['english']
    body = en.get('body') or []
    trans = en.get('translation') or []
    if not body:
        r.err('english.body 为空')
    if len(trans) != len(body):
        if fix:
            en['translation'] = [trans[i] if i < len(trans) else '' for i in range(len(body))]
            r.fix('english.translation 段数 %d → %d，已按正文对齐' % (len(trans), len(body)))
        else:
            r.err('english.translation 有 %d 段，正文 %d 段，必须逐段对应' % (len(trans), len(body)))
    for i, t in enumerate(en.get('translation') or []):
        if not str(t).strip():
            r.warn('english.translation 第 %d 段是空的' % (i + 1))
    words = sum(len(str(p).split()) for p in body)
    if not 480 <= words <= 620:
        r.warn('英文正文约 %d 词，要求 480-600 词' % words)
    elif en.get('words') in (None, 0):
        if fix:
            en['words'] = words
            r.fix('english.words 补为实际 %d 词' % words)
    if en.get('words') and abs(int(en['words']) - words) > 60:
        # 正文只有几十个词时说明这一板块还没写，改数字没意义，只提醒
        if words < 100:
            r.warn('english.words 标 %s，但正文只有约 %d 词，这一板块大概是没写完' % (en['words'], words))
        elif fix:
            r.fix('english.words %s → %d（按实际统计）' % (en['words'], words))
            en['words'] = words
        else:
            r.warn('english.words 标 %s，实际约 %d 词' % (en['words'], words))
    qs = en.get('questions') or []
    if len(qs) < 3:
        r.err('english.questions 只有 %d 题，至少 3 题（建议 5-6）' % len(qs))
    for i, it in enumerate(qs):
        opts = it.get('options') or []
        if len(opts) < 2:
            r.err('第 %d 题选项不足 2 个' % (i + 1))
            continue
        a = it.get('answer')
        if not isinstance(a, int) or not 0 <= a < len(opts):
            r.err('第 %d 题 answer=%r 越界（应从 0 起，小于 %d）' % (i + 1, a, len(opts)))
        if not str(it.get('q') or '').strip():
            r.err('第 %d 题缺题干' % (i + 1))
    for key, lo, name in [('vocab', 12, '生词'), ('collocations', 8, '地道搭配'),
                          ('phrases', 6, '短语'), ('patterns', 4, '句式'), ('grammar', 3, '语法点')]:
        n = len(en.get(key) or [])
        if n < lo:
            r.warn('英文%s只有 %d 条，建议 %d 条以上' % (name, n, lo))
    if not str(en.get('summary') or '').strip():
        r.err('english.summary 缺失')
    if not (en.get('output') or {}).get('prompt'):
        r.err('english.output.prompt 缺失')

    # --- 听力 ---
    li = day['listening']
    lines = li.get('lines') or []
    if not lines:
        r.err('listening.lines 为空（听力必须是自创短文，逐句 en/cn）')
    for i, ln in enumerate(lines):
        if not str((ln or {}).get('en') or '').strip():
            r.err('listening.lines[%d] 缺 en' % i)
        if not str((ln or {}).get('cn') or '').strip():
            if fix:
                r.warn('listening.lines[%d] 的 cn 是空的，页面会显示空白' % i)
            else:
                r.err('listening.lines[%d] 缺中文翻译 cn' % i)
    if not 6 <= len(lines) <= 10:
        r.warn('听力 %d 句，建议 6-10 句（每句一行、便于朗读）' % len(lines))
    lw = sum(len(str((x or {}).get('en', '')).split()) for x in lines)
    if not 150 <= lw <= 300:
        r.warn('听力约 %d 词，建议 180-260 词' % lw)

    # --- 清单 ---
    ck = day.get('checklist') or []
    if not 4 <= len(ck) <= 7:
        r.warn('清单 %d 项，建议 5-6 项' % len(ck))
    nq = len(qs)
    CN = '零一二三四五六七八九十'
    for it in ck:
        txt = it.get('text', '') if isinstance(it, dict) else str(it)
        if isinstance(it, dict) and not str(it.get('text') or '').strip():
            r.err('清单有一项没有 text')

        def rep(m):
            v = CN.find(m.group(1))
            return '%s道%s题' % (CN[nq] if nq < 10 else nq, m.group(2) or '') if 0 < v != nq else m.group(0)

        new = re.sub(r'([一二三四五六七八九十])道(单选)?题', rep, txt)
        if new != txt and isinstance(it, dict):
            it['text'] = new
            r.fix('清单题数对齐为「%s」' % new)

    # --- 插图白名单 ---
    for k in ('chinese', 'poem'):
        img = day[k].get('image')
        if img not in ART:
            if fix:
                day[k]['image'] = 'paper'
                r.fix('%s.image「%s」不在内置场景里 → paper' % (k, img))
            else:
                r.err('%s.image「%s」不在白名单，只能选：%s' % (k, img, '、'.join(ART)))

    # --- 中文标点：正文里出现 ASCII 双引号会让排版难看 ---
    for k in ('chinese', 'poem'):
        blob = json.dumps(day[k], ensure_ascii=False)
        n = len(re.findall(r'\\"', blob))
        if n:
            r.warn('%s 里有 %d 处 ASCII 双引号，中文正文建议用「」或“”' % (k, n))

    # --- 与近几期撞车 ---
    prev = [d for d in all_dates() if d < date][-4:]
    prev_poems, prev_themes = set(), set()
    for d in prev:
        try:
            o = load_day_file(day_path(d))
            prev_poems.add(str((o.get('poem') or {}).get('title') or ''))
            prev_themes.add(str(o.get('theme') or ''))
        except Exception:
            pass
    if str(poem.get('title') or '') in prev_poems:
        r.err('古诗文《%s》近 4 期刚用过，换一首' % poem.get('title'))
    if str(day.get('theme') or '') in prev_themes:
        r.warn('主题「%s」近 4 期出现过' % day.get('theme'))

    return r


# ---------------------------------------------------------------- 子命令

def cmd_new(date: str, queue: bool = False) -> int:
    d = os.path.join(PARTS, date)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, '_SPEC.md')
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(SPEC.format(date=date, weekday=weekday_of(date), art='、'.join(ART)))
    print('✓ 已建 %s' % d)
    print('  规格：%s' % path)
    print('  接着按板块写：theme.json / chinese.json / poem.json / english.json / listening.json')
    print('  写完运行：python scripts/daytool.py build --date %s%s'
          % (date, ' --queue' if queue else ''))
    if queue:
        print('  （--queue：写进 data/queue，等到期由 GitHub Actions 自动发布）')
    return 0


def cmd_build(date: str, force: bool, queue: bool = False) -> int:
    src = os.path.join(PARTS, date)
    if not os.path.isdir(src):
        print('✗ 找不到 %s，先运行：python scripts/daytool.py new --date %s%s'
              % (src, date, ' --queue' if queue else ''))
        return 1
    target = day_path(date, queue=queue)
    if os.path.exists(target) and not force:
        print('✋ %s 已存在。要覆盖请加 --force' % target)
        return 1

    day: dict = {}
    need = ['theme', 'chinese', 'poem', 'english', 'listening']
    missing = []
    for name in need:
        p = os.path.join(src, name + '.json')
        if not os.path.exists(p):
            missing.append(name + '.json')
            continue
        try:
            obj = json.load(open(p, encoding='utf-8'))
        except json.JSONDecodeError as e:
            print('✗ %s 不是合法 JSON：%s' % (p, e))
            return 1
        if name == 'theme':
            day.update(obj)
        else:
            day[name] = obj
    if missing:
        print('✗ 还缺：%s' % '、'.join(missing))
        return 1

    day['date'] = date
    day.setdefault('weekday', weekday_of(date))
    day['weekday'] = weekday_of(date)

    print('▸ 校验 %s（%s）' % (date, day['weekday']))
    r = validate(day, date, fix=True)
    if r.dump():
        return 1

    os.makedirs(DAYS, exist_ok=True)
    save_day_file(date, day, queue=queue)
    if queue:
        print('✓ 已写入 data/queue/%s.js（队列里，还没发布）' % date)
        print('  到期那天由 GitHub Actions 自动搬进 data/days，无需开机')
    else:
        n = update_index()
        print('✓ 已写入 data/days/%s.js，索引 %d 条' % (date, n))
    cn = chars(''.join(day['chinese']['body']))
    print('  语文 %d 字 · 英文 %d 词 · 听力 %d 句 · 阅读题 %d 道'
          % (cn, sum(len(p.split()) for p in day['english']['body']),
             len(day['listening']['lines']), len(day['english']['questions'])))
    if queue:
        print('  队列现有 %d 期' % len(queue_dates()))
    else:
        print('  下一步：python scripts/daytool.py publish --date %s' % date)
    return 0


def cmd_check(date: str, fix: bool) -> int:
    p = find_day(date)
    if not os.path.exists(p):
        print('✗ 没有 %s（data/days 与 data/queue 里都没有）' % date)
        return 1
    in_queue = os.path.dirname(p) == QUEUE
    day = load_day_file(p)
    print('▸ 校验 %s%s' % (p, '（队列）' if in_queue else ''))
    r = validate(day, date, fix=fix)
    code = r.dump()
    if fix and (r.fixes or day.get('date') != date):
        day['date'] = date
        day['weekday'] = weekday_of(date)
        save_day_file(date, day, queue=in_queue)
        if not in_queue:
            update_index()
        print('  ✓ 已回写')
    return code


def cmd_promote(up_to: str | None, dry: bool) -> int:
    """把队列里到期的那天搬进 data/days，重建索引与站点产物。

    云端每天只做这一件事：不调模型、不生成内容，只把提前写好的那天放出去。
    所以本地电脑不开机，站点也不会断更。

    退出码：0 正常（含"还没到时间"）；1 出错；2 队列空了（workflow 据此开 issue）
    """
    cutoff = up_to or today()
    queued = queue_dates()
    if not queued:
        print('⚠ 队列是空的：data/queue 里没有待发布的内容')
        print('  在本地跑一次批量预写（见 docs/内容规范.md#批量预写）把它补上')
        return 2

    due = [d for d in queued if d <= cutoff]
    if not due:
        print('▸ 队列 %d 期，最近一期 %s 还没到时间（今天 %s），不动'
              % (len(queued), queued[0], cutoff))
        return 0

    released = []
    for d in due:
        src = day_path(d, queue=True)
        try:
            day = load_day_file(src)
        except Exception as e:
            print('✗ %s 读不动，留在队列：%s' % (d, e))
            continue
        r = validate(day, d, fix=False)
        if r.dump():
            print('✗ %s 没过校验，留在队列（不发布半成品）' % d)
            continue
        if dry:
            print('· [dry-run] 会发布 %s' % d)
            released.append(d)
            continue
        os.replace(src, day_path(d))
        released.append(d)
        print('✓ 发布 %s' % d)

    if dry or not released:
        return 0

    update_index()
    refresh_site()
    left = queue_dates()
    print('\n✓ 本次发布 %d 期，队列剩余 %d 期%s'
          % (len(released), len(left),
             ('：' + '、'.join(left)) if left else '（已空，尽快预写）'))
    return 0


def cmd_check_all() -> int:
    """只读校验：已发布内容 + 队列里的待发布内容。CI 用它提前拦住坏数据。

    --all 一律不加 --fix：CI 只负责报错，不替人改内容。
    队列也要一起查 —— 否则预写时的字数不足 / 译文段数不符要等到发布当天
    才被 promote 拦下，那天站点就没内容了。
    """
    published = all_dates()
    if not published:
        print('✗ data/days 里没有任何内容')
        return 1

    # (日期, 路径, 标注)。队列与已发布同日时以已发布为准（重复由结构体检拦）。
    targets = [(d, day_path(d), '') for d in published]
    targets += [(d, day_path(d, queue=True), '（队列）') for d in queue_dates()
                if d not in published]

    bad = []
    total_err = 0
    for d, path, tag in targets:
        try:
            day = load_day_file(path)
        except Exception as e:
            print('✗ %s%s 读不动：%s' % (d, tag, e))
            bad.append(d)
            total_err += 1
            continue
        r = validate(day, d, fix=False)
        errs = len(r.errors)
        if errs:
            print('✗ %s%s  %d 处问题' % (d, tag, errs))
            for m in r.errors:
                print('    - %s' % m)
            bad.append(d)
            total_err += errs
    ok = len(targets) - len(bad)
    print('\n共 %d 期（含 %d 期待发布）：%d 期通过，%d 期有问题（%d 处错误）'
          % (len(targets), len(targets) - len(published), ok, len(bad), total_err))
    return 1 if bad else 0


def update_index() -> int:
    entries = []
    for d in all_dates():
        try:
            o = load_day_file(day_path(d))
        except Exception:
            continue
        theme = str(o.get('theme') or '').replace('"', '“')
        entries.append((d, str(o.get('weekday') or weekday_of(d)), theme))
    body = ',\n'.join('  { date: "%s", weekday: "%s", theme: "%s", modules: %d }'
                      % (d, w, t, MODULES) for d, w, t in entries)
    with open(INDEX, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* 日期索引：生成脚本会自动维护 */\nwindow.LEARN_INDEX = [\n%s\n];\n' % body)
    return len(entries)


def esc(s) -> str:
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def refresh_site() -> None:
    """重建站点级产物：sitemap.xml + robots.txt + index.html 的往期兜底链接

    这是全仓库唯一一份实现（旧的 scripts/build-seo.mjs 已删除）。
    """
    entries = []
    for d in reversed(all_dates()):
        try:
            o = load_day_file(day_path(d))
        except Exception:
            continue
        entries.append({'date': d, 'weekday': o.get('weekday') or weekday_of(d),
                        'theme': o.get('theme') or ''})

    urls = []
    for e in entries:
        urls += ['  <url>',
                 '    <loc>%s/?d=%s</loc>' % (SITE, e['date']),
                 '    <lastmod>%s</lastmod>' % e['date'],
                 '    <changefreq>monthly</changefreq>',
                 '    <priority>0.8</priority>',
                 '  </url>']
    sitemap = '\n'.join(['<?xml version="1.0" encoding="UTF-8"?>',
                         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                         '  <url>',
                         '    <loc>%s/</loc>' % SITE,
                         '    <lastmod>%s</lastmod>' % (entries[0]['date'] if entries else ''),
                         '    <changefreq>daily</changefreq>',
                         '    <priority>1.0</priority>',
                         '  </url>'] + urls + ['</urlset>', ''])
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(sitemap)

    with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % SITE)

    groups: dict[str, list] = {}
    for e in entries:
        groups.setdefault(e['date'][:7], []).append(e)
    parts = []
    for key, lst in groups.items():
        y, m = key.split('-')
        parts.append('<h3>%s 年 %d 月 · %d 天</h3>' % (y, int(m), len(lst)))
        parts.append('<ul>')
        for e in lst:
            day = int(e['date'][8:10])
            t = ' · ' + esc(e['theme']) if e['theme'] else ''
            parts.append('<li><a href="?d=%s">%d/%d %s%s</a></li>'
                         % (e['date'], int(m), day, esc(e['weekday']), t))
        parts.append('</ul>')
    block = '\n'.join(parts)

    html = open(HTML, encoding='utf-8').read()
    s, t = '<!--ARCHIVE:START-->', '<!--ARCHIVE:END-->'
    i, j = html.find(s), html.find(t)
    if i < 0 or j < 0:
        print('  ⚠ index.html 里找不到归档标记，跳过兜底链接')
        return
    new = html[:i + len(s)] + '\n' + block + '\n' + html[j:]
    if new != html:
        with open(HTML, 'w', encoding='utf-8', newline='\n') as f:
            f.write(new)
    print('  ✓ sitemap.xml %d 个 URL · robots.txt · index.html 兜底链接 %d 条'
          % (len(entries) + 1, len(entries)))


def git_push(tries: int = 3) -> bool:
    """推送到 origin/main。直连、沙箱代理、git 自身配置三条路径轮流试。

    每天自动发布时网络状况不可控，单次失败就放弃会直接导致站点断更，
    所以宁可多重试几遍——反正失败时内容已经在本地提交好了，下次还能补推。
    """
    candidates = [
        ['-c', 'http.proxy=', '-c', 'https.proxy='],                    # 直连
        ['-c', 'http.proxy=http://127.0.0.1:51984',
         '-c', 'https.proxy=http://127.0.0.1:51984'],                   # 本机网关
        [],                                                             # 交给 git 配置 / 环境变量
    ]
    last = ''
    for rnd in range(tries):
        for extra in candidates:
            cmd = ['git', '-C', ROOT] + extra + ['push', 'origin', 'HEAD:main']
            r = subprocess.run(cmd, capture_output=True, text=True,
                               encoding='utf-8', errors='replace')
            if r.returncode == 0:
                return True
            last = (r.stderr or r.stdout).strip()[-400:]
            time.sleep(2)
        if rnd + 1 < tries:
            print('  第 %d 轮推送没成功，5 秒后再试' % (rnd + 1))
            time.sleep(5)
    print('✗ git push 失败（%d 轮 × %d 条路径）：\n%s' % (tries, len(candidates), last))
    print('  内容已经提交在本地，下次 publish 会把积压的提交一起推上去。')
    return False


def cmd_publish(date: str | None, use_git: bool) -> int:
    if date and os.path.exists(day_path(date)):
        day = load_day_file(day_path(date))
        print('▸ 发布前校验 %s' % date)
        r = validate(day, date, fix=True)
        if r.dump():
            print('\n内容没过校验，不发布。修好后再运行 publish。')
            return 1
        if r.fixes:
            day['date'], day['weekday'] = date, weekday_of(date)
            save_day_file(date, day)

    n = update_index()
    print('✓ 索引已重建：%d 天' % n)
    refresh_site()

    files = ['data/days/index.js', 'sitemap.xml', 'robots.txt', 'index.html']
    if date:
        files.insert(0, 'data/days/%s.js' % date)
    print('\n改动文件：')
    for f in files:
        print('  - ' + f)

    if not use_git:
        print('\n没有加 --git，以上文件就地更新完毕。')
        print('用 GitHub 连接器把这几个文件传上去，Pages 约 1 分钟后重建。')
        return 0

    base = ['git', '-C', ROOT]
    run = lambda a: subprocess.run(base + a, capture_output=True, text=True,
                                   encoding='utf-8', errors='replace')
    if run(['add', '-A']).returncode:
        print('✗ git add 失败')
        return 1
    msg = 'content: %s' % (date or 'index 重建')
    c = run(['commit', '-m', msg])
    if c.returncode and 'nothing to commit' not in (c.stdout + c.stderr):
        print('✗ git commit 失败：\n' + (c.stderr or c.stdout)[-500:])
        return 1

    if not git_push():
        return 1
    print('✓ 已推送到 origin/main，Pages 约 1 分钟后重建')
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description='每日一学内容工具',
        epilog='site 子命令不需要 --date，只重建站点级产物（sitemap / robots / 往期兜底链接）。')
    sub = ap.add_subparsers(dest='cmd', required=True)

    # 只改站点产物、不碰内容的命令：不需要日期
    sub.add_parser('site', help='重建 sitemap.xml / robots.txt / index.html 往期兜底链接')

    p = sub.add_parser('promote', help='把 data/queue 里到期的一天搬进 data/days（云端每天跑这个）')
    p.add_argument('--date', default=None, help='把它当成今天（默认取 Asia/Shanghai 的今天）')
    p.add_argument('--dry-run', action='store_true', dest='dry', help='只说会发布什么，不动文件')

    for name in ('new', 'build', 'check', 'publish'):
        p = sub.add_parser(name)
        p.add_argument('--date', default=None)
        if name in ('new', 'build'):
            p.add_argument('--queue', action='store_true',
                           help='写进 data/queue（待发布），而不是直接发布')
        if name == 'build':
            p.add_argument('--force', action='store_true')
        if name == 'check':
            p.add_argument('--fix', action='store_true')
            p.add_argument('--all', action='store_true', dest='all_days',
                           help='校验全部已发布日期（只读，不加 --fix），CI 用')
        if name == 'publish':
            p.add_argument('--git', action='store_true')
    a = ap.parse_args()

    # site / promote 先分流：它们跟"写哪一天"无关
    if a.cmd == 'site':
        update_index()
        refresh_site()
        return 0

    if a.cmd == 'promote':
        if a.date and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', a.date):
            print('✗ 日期格式应为 YYYY-MM-DD')
            return 1
        return cmd_promote(a.date, a.dry)

    if a.cmd == 'check' and getattr(a, 'all_days', False):
        return cmd_check_all()

    date = a.date or today()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
        print('✗ 日期格式应为 YYYY-MM-DD')
        return 1
    if a.cmd == 'new':
        return cmd_new(date, getattr(a, 'queue', False))
    if a.cmd == 'build':
        return cmd_build(date, a.force, getattr(a, 'queue', False))
    if a.cmd == 'check':
        return cmd_check(date, a.fix)
    return cmd_publish(a.date, a.git)


if __name__ == '__main__':
    sys.exit(main())
