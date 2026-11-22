#!/usr/bin/env python3
"""Deterministic static course publisher. No third-party packages."""
from pathlib import Path
import hashlib
import html
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SOURCES = json.loads((ROOT/'content/sources.json').read_text())
UNITS = [
('The C bridge', 'Read, build, and reason about small programs.'),
('Representations', 'Interpret bytes and derive the limits of arithmetic.'),
('Machine programs', 'Follow instructions, calls, layouts, and invalid writes.'),
('Linking & loading', 'Connect names and addresses across compilation boundaries.'),
('The executing CPU', 'Model pipelines, dependencies, and useful performance.'),
('The memory hierarchy', 'Predict cache mappings, locality, and coherence costs.'),
('Virtual memory', 'Translate addresses and explain recoverable faults.'),
('Allocation & ownership', 'Establish lifetimes, invariants, and memory evidence.'),
('Exceptional control flow', 'Follow OS transitions, processes, and signals.'),
('System I/O', 'Account for descriptors, partial progress, and persistence.'),
('Networked programs', 'Frame byte streams and bound resource growth.'),
('Concurrent programs', 'Protect invariants and prove a way to stop.'),
('The investigation', 'Defend a complete source-to-hardware explanation.')]

def read_content(path):
    header, body = path.read_text().split('\n---\n', 1)
    return json.loads(header), body

LESSONS = [dict(meta, body=body) for meta, body in map(read_content, sorted((ROOT/'content/lessons').glob('*.md')))]
LABS = [dict(meta, body=body) for meta, body in map(read_content, sorted((ROOT/'content/labs').glob('*.md')))]
REFS = [dict(meta, body=body) for meta, body in map(read_content, sorted((ROOT/'content/reference').glob('*.md')))]
BY_ID = {x['id']: x for x in LESSONS}

def e(text): return html.escape(str(text), quote=True)
def lesson_path(item): return f"lessons/{item['id']:04d}-{item['slug']}.html"
def slug(text): return re.sub('[^a-z0-9]+', '-', text.lower()).strip('-')

def inline(text):
    fragments = []
    def stash(fragment):
        fragments.append(fragment)
        return f'\x00{len(fragments)-1}\x00'
    text = re.sub(r'`([^`]+)`', lambda m: stash('<code>'+e(m[1])+'</code>'), text)
    def link(m):
        url = m[2]
        if not (url.startswith(('https://','http://','#','../','./')) or re.match(r'^[\w/-]+\.(html|zip|md)(#.*)?$',url)):
            raise ValueError('Unsupported link: '+url)
        return stash(f'<a href="{e(url)}">{e(m[1])}</a>')
    text = re.sub(r'\[([^\[\]]+)\]\(([^\s)]+)\)', link, text)
    def cite(m):
        title,url,_ = SOURCES[m[1]]
        return stash(f'<a class="citation" href="{e(url)}">{e(title)}</a>')
    text = re.sub(r'\[\[([\w]+)\]\]', cite, text)
    text = e(text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', text)
    return re.sub(r'\x00(\d+)\x00', lambda m: fragments[int(m[1])], text)

def markdown(text):
    lines = text.strip().splitlines()
    out, i, headings = [], 0, {}
    while i < len(lines):
        line = lines[i].strip()
        if not line: i += 1; continue
        if line.startswith('```'):
            language = line[3:].strip(); block=[]; i+=1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                block.append(lines[i]); i+=1
            if i == len(lines): raise ValueError('Unclosed code fence')
            code='\n'.join(block)
            out.append(f'<div class="code-block"><span class="code-label">{e(language or "text")}</span><pre><code>{e(code)}</code></pre><button type="button" class="copy-code" aria-label="Copy code">Copy</button></div>')
            i+=1; continue
        if line.startswith('::: '):
            kind, _, title = line[4:].partition(' '); block=[]; i+=1
            while i<len(lines) and lines[i].strip()!=':::': block.append(lines[i]); i+=1
            if i == len(lines): raise ValueError('Unclosed detail block')
            out.append(f'<details class="{e(kind)}"><summary>{e(title)}</summary><div class="detail-body">{markdown(chr(10).join(block))}</div></details>')
            i+=1; continue
        if re.match(r'^#{1,4} ',line):
            marks,title=line.split(' ',1); key=slug(title); headings[key]=headings.get(key,0)+1
            if headings[key]>1:key+=f'-{headings[key]}'
            out.append(f'<h{len(marks)} id="{e(key)}">{inline(title)}</h{len(marks)}>'); i+=1; continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                cells=[v.strip() for v in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?',v) for v in cells): rows.append(cells)
                i+=1
            head=rows.pop(0)
            out.append('<div class="table-wrap"><table><thead><tr>'+''.join(f'<th scope="col">{inline(x)}</th>' for x in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{inline(c)}</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>'); continue
        if re.match(r'^(\d+\.|-) ',line):
            ordered=line[0].isdigit(); tag='ol' if ordered else 'ul'; values=[]
            pattern=r'^\d+\. ' if ordered else r'^- '
            while i<len(lines) and re.match(pattern,lines[i].strip()):
                values.append(re.sub(pattern,'',lines[i].strip()));i+=1
            out.append(f'<{tag}>'+''.join('<li>'+inline(v)+'</li>' for v in values)+f'</{tag}>');continue
        paragraph=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#{1,4} |```|:::|\||\d+\. |- )',lines[i].strip()):
            paragraph.append(lines[i].strip());i+=1
        out.append('<p>'+inline(' '.join(paragraph))+'</p>')
    return '\n'.join(out)

def source_list(keys):
    return '<ul class="source-list">'+''.join(f'<li><a href="{e(SOURCES[k][1])}">{e(SOURCES[k][0])}</a><p>{e(SOURCES[k][2])}</p></li>' for k in keys)+'</ul>'

def sidebar(prefix, current=None):
    parts=['<aside class="rail" aria-label="Course lessons"><a class="rail-home" href="'+prefix+'index.html#course">Course contents <span>40 lessons</span></a>']
    for i,(name,_) in enumerate(UNITS):
        items=[x for x in LESSONS if x['unit']==i]
        is_current=any(x['id']==current for x in items)
        parts.append(f'<details {"open" if is_current else ""}><summary><span>{i:02d}</span> {e(name)}</summary><ol>')
        for item in items:
            parts.append(f'<li><a {"aria-current=\"page\"" if item["id"]==current else ""} href="{prefix}{lesson_path(item)}"><span>{item["id"]:02d}</span>{e(item["title"])}</a></li>')
        parts.append('</ol></details>')
    parts.append('</aside>')
    return ''.join(parts)

def page(title,body,*,prefix='',current=None,description='',sidebar_on=False):
    nav=[('index.html#course','Course'),('labs.html','Labs'),('reference.html','Field notes'),('study.html','My study'),('sources.html','Sources')]
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="{e(description or title+' — an original, practical computer systems course.')}"><meta name="color-scheme" content="light dark"><title>{e(title)} · Below the Surface</title><link rel="icon" href="{prefix}assets/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="{prefix}assets/course.css"><script defer src="{prefix}assets/catalog.js"></script><script defer src="{prefix}assets/models.js"></script><script defer src="{prefix}assets/study.js"></script><script defer src="{prefix}assets/workbenches.js"></script><script defer src="{prefix}assets/course.js"></script></head>
<body data-prefix="{prefix}"{f' data-lesson="{current}"' if current else ''}><a class="skip" href="#main">Skip to content</a><header class="topbar"><a class="brand" href="{prefix}index.html"><span class="brand-mark" aria-hidden="true">≋</span><span>Below the Surface<small>A programmer’s systems course</small></span></a><nav aria-label="Main navigation">{''.join(f'<a href="{prefix}{url}">{label}</a>' for url,label in nav)}</nav><button type="button" id="theme-toggle" class="icon-button" aria-label="Switch color theme">◐</button></header>
<div class="{'reading-layout' if sidebar_on else 'page-layout'}">{sidebar(prefix,current) if sidebar_on else ''}<main id="main" tabindex="-1">{body}</main></div>
<footer class="footer"><span>Follow the program. Question the model.</span><span><a href="{prefix}about.html">About &amp; approach</a> · <a href="{prefix}setup.html">Lab setup</a> · <a href="{prefix}sources.html">Attribution</a></span><p>Original course inspired by the programmer-centered approach of CS:APP. Independent and unaffiliated. No textbook purchase required.</p></footer><div id="announcement" role="status" aria-live="polite" class="sr-only"></div><noscript><p class="noscript">All reading material and worked solutions are available without JavaScript. Quizzes, workbenches, search, and browser-local study tools require JavaScript.</p></noscript></body></html>'''

def save(name,text):
    path=ROOT/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)

def quiz(item):
    q,answers,correct,feedback=item['quiz']
    return f'<section class="checkpoint" aria-labelledby="check-title"><p class="eyebrow">Retrieval check</p><h2 id="check-title">{e(q)}</h2><form data-quiz data-correct="{correct}"><fieldset><legend class="sr-only">Choose one answer</legend>'+''.join(f'<label class="answer"><input type="radio" name="answer" value="{i}" required><span>{e(a)}</span></label>' for i,a in enumerate(answers))+f'</fieldset><button type="submit">Check my reasoning</button><p class="quiz-feedback" aria-live="polite" data-explanation="{e(feedback)}"></p></form><noscript><details><summary>Answer and explanation</summary><p>{e(answers[correct])}. {e(feedback)}</p></details></noscript></section>'

for item in LESSONS:
    n=item['id'];previous=BY_ID.get(n-1);following=BY_ID.get(n+1)
    rendered=markdown(item['body'])
    toc=''.join(f'<a href="#{anchor}">{html.unescape(re.sub("<[^>]+>","",title))}</a>' for anchor,title in re.findall(r'<h2 id="([^"]+)">(.*?)</h2>',rendered))
    lab=next(x for x in LABS if x['id']==item['lab'])
    refs='<a href="../reference/glossary.html">Glossary</a> · <a href="../reference/investigation.html">Investigation card</a>'
    prerequisites = 'Start here; no C background required.' if n==1 else f'Builds on <a href="{Path(lesson_path(previous)).name}">Lesson {n-1:02d}: {e(previous["title"])}</a>. Follow the course order on a first pass.'
    body=f'''<article class="lesson"><div class="breadcrumb"><a href="../index.html#unit-{item['unit']}">Unit {item['unit']:02d} · {e(UNITS[item['unit']][0])}</a><span>Lesson {n:02d} / 40</span></div><p class="eyebrow">{item['minutes']} minute core · optional depth &amp; lab</p><h1>{e(item['title'])}</h1><p class="dek">{e(item['win'])}</p><div class="prerequisite">{prerequisites}</div><details class="contents"><summary>In this lesson</summary><nav aria-label="On this page">{toc}</nav></details><div class="prose">{rendered}</div>'''
    if item.get('sim'):
        body+=f'<section class="workbench" data-sim="{item["sim"]}"><h2>Workbench · test your prediction</h2><div class="sim-root"></div><noscript>Use the hand-worked exercises above without JavaScript.</noscript></section>'
    body+=quiz(item)
    body+=f'''<section class="reflection"><h2>Explain it in your own words</h2><label for="reflection">What can you now predict? What is still uncertain?</label><textarea id="reflection" data-reflection rows="4" placeholder="Write a prediction, a boundary, or a question for your teacher."></textarea><p class="muted">Saved in this browser when storage is available. Ask the agent follow-up questions with the lesson number and your reasoning.</p></section><section class="reading"><p class="eyebrow">Primary reading &amp; practice</p><h2>Go to the source</h2><p>The first source is the recommended primary reading. Read for the question taught here; these links are extensions, not prerequisites to understanding the page.</p>{source_list(item['sources'])}<p><a class="text-link" href="../labs/{lab['id']}-{lab['folder'][3:]}.html">Lab {lab['id']} · {e(lab['title'])} →</a></p><p>{refs}</p></section><section class="completion"><h2>Close the book. Try to retrieve it.</h2><p>Predict a new case and explain the mechanism before marking this lesson complete. Completion and confidence are self-reports.</p><div class="button-row"><button type="button" data-complete>Mark complete</button><button type="button" class="secondary" data-review="again">Review: still uncertain</button><button type="button" class="secondary" data-review="good">Review: recalled unaided</button></div><p data-completion-status aria-live="polite"></p></section><nav class="lesson-pager" aria-label="Lesson navigation">'''
    body+=f'<a href="{Path(lesson_path(previous)).name}">← {e(previous["title"])}</a>' if previous else '<a href="../setup.html">← Lab setup</a>'
    body+=f'<a href="{Path(lesson_path(following)).name}">{e(following["title"])} →</a>' if following else '<a href="../labs/09-capstone.html">Take on the capstone →</a>'
    body+='</nav></article>'
    save(lesson_path(item),page(item['title'],body,prefix='../',current=n,sidebar_on=True,description=item['win']))

for item in LABS:
    related=''.join(f'<a href="../{lesson_path(BY_ID[n])}">{n:02d} · {e(BY_ID[n]["title"])}</a>' for n in item['lessons'])
    files=sorted((ROOT/'labs'/item['folder']).glob('*'))
    downloads=''.join(f'<li><a href="../labs/{item["folder"]}/{file.name}" download>{e(file.name)}</a></li>' for file in files if file.is_file())
    body=f'<article class="document"><p class="eyebrow">Lab {item["id"]} · {item["hours"]} hours, with extensions</p><h1>{e(item["title"])}</h1><p class="dek">Predict. Run. Explain. Preserve the evidence.</p><p><a class="button" href="../downloads/labs.zip" download>Download all lab files ↓</a> <a href="../setup.html">Environment setup</a></p><div class="prose">{markdown(item["body"])}</div><h2>Related lessons</h2><div class="related">{related}</div><h2>Files for this lab</h2><ul>{downloads}</ul><h2>Primary sources</h2>{source_list(item["sources"])}<p><a href="../labs.html">← All labs</a></p></article>'
    save(f'labs/{item["id"]}-{item["folder"][3:]}.html',page(item['title'],body,prefix='../'))

for item in REFS:
    save(f'reference/{item["slug"]}.html',page(item['title'],f'<article class="document reference"><p class="eyebrow">Field note · printable reference</p><h1>{e(item["title"])}</h1><p class="dek">{e(item["subtitle"])}</p><button class="secondary" type="button" data-print>Print this sheet</button><div class="prose">{markdown(item["body"])}</div><p><a href="../reference.html">← All field notes</a></p></article>',prefix='../'))

# The home page is useful without JavaScript; search progressively filters this rendered catalog.
hero='''<section class="hero"><div><p class="eyebrow">An open course in computer systems</p><h1>Go below<br>the surface.</h1><p class="hero-dek">Understand what your program is really doing—from C source to the machine, and back again.</p><p class="hero-note">Forty focused lessons. Nine substantial labs.<br>One connected view of the system.</p><div class="button-row"><a class="button" href="lessons/0001-follow-the-artifacts.html" data-continue>Begin the course <span>↗</span></a><a class="subtle-link" href="#course">Explore the curriculum ↓</a></div></div><div class="strata" role="img" aria-label="Connected systems layers: source and contracts, instructions and execution, memory and mappings, processes and byte streams. Each layer constrains the next."><div class="strata-top"><span>THE PROGRAM, AT DEPTH</span><span>01 — 04</span></div><div class="stratum"><span>01</span><div><strong>Source &amp; contracts</strong><small>Types · representation · ownership</small></div><b>{ }</b></div><div class="stratum"><span>02</span><div><strong>Instructions &amp; execution</strong><small>Compilers · ABI · dependencies</small></div><b>→</b></div><div class="stratum"><span>03</span><div><strong>Memory &amp; mappings</strong><small>Caches · virtual pages · allocation</small></div><b>▦</b></div><div class="stratum"><span>04</span><div><strong>Processes &amp; byte streams</strong><small>I/O · protocols · concurrency</small></div><b>⋈</b></div><div class="strata-bottom"><span>FOLLOW THE EVIDENCE</span><span>↓</span></div></div></section><section class="manifesto"><p class="eyebrow">The approach</p><p>A systems explanation should survive an experiment. Derive the result, inspect the artifact, challenge the model. Learn the boundaries that make real programs correct—and the costs that make them fast.</p><a href="about.html">How this course works ↗</a></section>'''
intro='''<section class="curriculum" id="course"><div class="section-heading"><div><p class="eyebrow">The curriculum</p><h2>A path through the whole system.</h2></div><p>Start with little C experience.<br>Build one defensible explanation at a time.</p></div><div class="course-toolbar"><label for="course-search">Find a lesson<input id="course-search" type="search" placeholder="Try: pointers, cache, signals…" autocomplete="off"></label><div class="study-count"><strong data-progress-count>0 / 40</strong><span>self-reported complete</span><progress data-progress max="40" value="0" aria-label="Course completion"></progress></div></div><p id="search-status" class="muted" role="status"></p>'''
cards=[]
for i,(name,desc) in enumerate(UNITS):
    items=[x for x in LESSONS if x['unit']==i]
    rows=''
    for x in items:
        rows+=f'<li data-catalog-item="{x["id"]}"><a href="{lesson_path(x)}"><span class="lesson-number">{x["id"]:02d}</span><span><strong>{e(x["title"])}</strong><small>{e(x["win"])}</small></span><span class="row-end"><span data-done="{x["id"]}"></span>{x["minutes"]} min <b>↗</b></span></a></li>'
    cards.append(f'<section class="unit" id="unit-{i}" data-unit="{i}"><div class="unit-heading"><span class="unit-number">{i:02d}</span><div><h3>{e(name)}</h3><p>{e(desc)}</p></div><span>{len(items)} lessons</span></div><ol>{rows}</ol></section>')
end='''</section><section class="home-bottom"><div><p class="eyebrow">From models to evidence</p><h2>The labs do the heavy lifting.</h2><p>Trace binaries. Test allocator invariants. Decode fragmented streams. Build a queue that knows how to stop. Finish with a complete systems investigation.</p><a class="button" href="labs.html">Enter the lab ↗</a></div><div><p class="eyebrow">Keep close</p><h2>A field guide for later.</h2><p>Printable references for arithmetic, memory models, tools, protocols, and synchronization. Return to them when the real bug arrives.</p><a class="text-link" href="reference.html">Open the field notes →</a></div></section>'''
save('index.html',page('Go below the surface',hero+intro+''.join(cards)+end))
lab_cards=''.join(f'<a class="resource-card" href="labs/{x["id"]}-{x["folder"][3:]}.html"><span class="eyebrow">Lab {x["id"]} · {x["hours"]} hours</span><h2>{e(x["title"])}</h2><p>{e(re.sub("[#*`]+","",x["body"].split("\n\n")[1])[:230])}</p><span>Open the investigation →</span></a>' for x in LABS)
save('labs.html',page('The laboratory','<section class="wide-document"><p class="eyebrow">Practice with consequences</p><h1>The laboratory.</h1><p class="dek">Nine original investigations. Reference programs, meaningful checks, boundary cases, and extensions that require an explanation.</p><div class="button-row"><a class="button" href="downloads/labs.zip" download>Download all lab files ↓</a><a href="setup.html">Set up your environment →</a></div><div class="card-grid">'+lab_cards+'</div></section>'))
ref_cards=''.join(f'<a class="resource-card" href="reference/{x["slug"]}.html"><span class="eyebrow">Printable field note</span><h2>{e(x["title"])}</h2><p>{e(x["subtitle"])}</p><span>Open reference →</span></a>' for x in REFS)
save('reference.html',page('Field notes','<section class="wide-document"><p class="eyebrow">Compressed understanding</p><h1>Keep the essentials close.</h1><p class="dek">The lessons teach. These sheets help you return to a precise vocabulary, a formula, or an investigation method.</p><div class="card-grid">'+ref_cards+'</div></section>'))
# Metadata for client-side search and study. No runtime fetch, backend, or origin-root paths.
catalog=[dict(id=x['id'],unit=x['unit'],title=x['title'],path=lesson_path(x),win=x['win'],minutes=x['minutes'],search=' '.join([x['title'],x['win'],re.sub(r'[`#*]','',x['body'])])) for x in LESSONS]
save('assets/catalog.js','window.COURSE = '+json.dumps(catalog,ensure_ascii=False)+';\n')
# Shared information pages are authored alongside lessons.
for filename in ['setup','about','study']:
    meta,body=read_content(ROOT/f'content/{filename}.md')
    extra=''
    if filename=='study':
        extra='''<section id="study-dashboard"><h2>Your next steps</h2><p data-study-summary></p><h3>Due for retrieval</h3><div data-due-list></div><h3>Continue in sequence</h3><div data-next-list></div><h2>Move your study record</h2><p>Completion, review dates, quiz attempts, and reflections stay in this browser and origin. Export before changing device, browser, or host. Import replaces the current course record; export first to keep a copy.</p><div class="button-row"><button type="button" data-export>Export progress</button><label class="button secondary file-label">Import progress<input type="file" data-import accept="application/json,.json"></label></div><p data-import-status role="status"></p><details class="danger"><summary>Clear this course’s study record</summary><p>This removes local completion, review, attempts, and reflections for this course. Export first if you want a copy.</p><button type="button" data-reset class="secondary">Clear local record</button></details></section>'''
    save(filename+'.html',page(meta['title'],f'<article class="document"><p class="eyebrow">{e(meta["subtitle"])}</p><h1>{e(meta["title"])}</h1><div class="prose">{markdown(body)}</div>{extra}</article>'))
source_body='<article class="document"><p class="eyebrow">Grounded in primary sources</p><h1>Read beyond the course.</h1><p class="dek">Language and ABI contracts, operating-system interfaces, and practitioner experiments. Original teaching, with a trail you can inspect.</p><p>Sources were consulted on 22 November 2026. External sites can change; the course remains readable offline. No textbook prose, figures, or proprietary lab handouts are bundled.</p>'
for key,value in SOURCES.items():source_body+=f'<section class="source-entry" id="{key}"><h2><a href="{e(value[1])}">{e(value[0])}</a></h2><p>{e(value[2])}</p></section>'
source_body+='<h2>Practitioner communities</h2><p><a href="https://discourse.llvm.org/">LLVM discussion forums</a> offer project-specific compiler/tool discussions, including a beginners category. <a href="https://kernelnewbies.org/">KernelNewbies</a> is an extension path for Linux internals after the user-space foundations. Bring a focused reproducer and evidence; community participation is optional.</p></article>'
save('sources.html',page('Sources and further reading',source_body))
resources='# Computer Systems Resources\n\n## Knowledge\n\n'+''.join(f'- [{v[0]}]({v[1]})\n  {v[2]}\n' for v in SOURCES.values())+'\n## Wisdom (Communities)\n\n- [LLVM discussion forums](https://discourse.llvm.org/)\n  Compiler behavior and tooling; start in Beginners with a minimal reproducible question.\n- [KernelNewbies](https://kernelnewbies.org/)\n  Kernel internals and an extension path after user-space foundations; not a prerequisite.\n\n## Scope and currency\n\nConsulted 2026-11-22. Runtime tool versions and hardware measurements can change. N1570 is a public C11 draft used to explain the subset shared with the C17 lab target; it is not a claim of current-standard equivalence. Historical practitioner papers supply mechanisms, not current hardware constants. No community participation preference has been stated.\n'
save('RESOURCES.md',resources)
save('GLOSSARY.md','# Course glossary\n\nCanonical printable vocabulary: [reference/glossary.html](reference/glossary.html). Source: [content/reference/glossary.md](content/reference/glossary.md). Use this vocabulary across lessons and future sessions.\n')
# Reproducible lab archive: fixed timestamps, sorted source entries; no executables or learner state.
download=ROOT/'downloads/labs.zip';download.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(download,'w',compression=zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((ROOT/'labs').rglob('*')):
        if path.is_file() and (path.suffix in {'.c','.h','.py','.md'} or path.name == 'Dockerfile'):
            info=zipfile.ZipInfo(path.relative_to(ROOT).as_posix(),date_time=(2026,11,22,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,path.read_bytes())
# Only public site assets go into dist. Source tree is still directly browsable.
dist=ROOT/'dist'
if dist.exists():shutil.rmtree(dist)
dist.mkdir()
for filename in ROOT.glob('*.html'):shutil.copy2(filename,dist/filename.name)
for folder in ['assets','lessons','reference','labs','downloads']:
    shutil.copytree(ROOT/folder,dist/folder,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
(dist/'.nojekyll').touch()
manifest={str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(dist.rglob('*')) if p.is_file()}
save('dist/manifest.json',json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(LESSONS)} lessons, {len(LABS)} labs, {len(REFS)} references; {len(manifest)} public files → dist/')
