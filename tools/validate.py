#!/usr/bin/env python3
"""Check the public artifact, local links/anchors, and teaching-content contracts."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT/'dist'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path=path; self.ids=set(); self.refs=[]; self.errors=[]; self.h1=0; self.title=False; self.lang=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:self.errors.append('duplicate id: '+a['id'])
            self.ids.add(a['id'])
        for key in ['href','src']:
            if key in a:self.refs.append(a[key])
        if tag=='h1':self.h1+=1
        if tag=='title':self.title=True
        if tag=='html':self.lang=a.get('lang')=='en'
        if tag=='img' and 'alt' not in a:self.errors.append('image without alt')

errors=[]; pages={}
for path in sorted(SITE.rglob('*.html')):
    page=Page(path);page.feed(path.read_text());pages[path.resolve()]=page
    if page.h1!=1:page.errors.append(f'expected one h1, saw {page.h1}')
    if not page.title or not page.lang:page.errors.append('missing title or language')
    for error in page.errors:errors.append(f'{path.relative_to(SITE)}: {error}')
for path,page in pages.items():
    for ref in page.refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc:
            if url.scheme not in ['http','https','mailto','data']:errors.append(f'{path.name}: unexpected scheme {ref}')
            continue
        if url.path.startswith('/'):errors.append(f'{path.name}: root-absolute URL breaks repository subpaths: {ref}');continue
        destination=(path.parent/unquote(url.path)).resolve() if url.path else path
        if not destination.is_relative_to(SITE.resolve()):errors.append(f'{path.name}: link escapes public site: {ref}');continue
        if destination.is_dir():destination=destination/'index.html'
        if not destination.exists():errors.append(f'{path.relative_to(SITE)}: missing target {ref}');continue
        if url.fragment and destination.suffix=='.html':
            target=pages.get(destination)
            if target is None or unquote(url.fragment) not in target.ids:errors.append(f'{path.name}: missing fragment {ref}')
source_keys=set(json.loads((ROOT/'content/sources.json').read_text()))
correct_positions=set()
for path in sorted((ROOT/'content/lessons').glob('*.md')):
    raw,body=path.read_text().split('\n---\n',1);item=json.loads(raw)
    counts=[len(x.split()) for x in item['quiz'][1]]
    if len(set(counts))!=1:errors.append(f'{path.name}: quiz answer word counts differ: {counts}')
    correct_positions.add(item['quiz'][2])
    if len(re.findall(r'\b\w+\b',body))<400:errors.append(f'{path.name}: lesson is unexpectedly thin')
    if not item['sources'] or not set(item['sources'])<=source_keys:errors.append(f'{path.name}: invalid sources')
    for source in re.findall(r'\[\[(\w+)\]\]',body):
        if source not in source_keys:errors.append(f'{path.name}: unknown citation {source}')
    if '::: solution ' not in body or '::: deep ' not in body:errors.append(f'{path.name}: missing worked feedback or depth')
if len(list((SITE/'lessons').glob('*.html')))!=40:errors.append('Expected 40 public lessons')
if len(list((SITE/'labs').glob('*.html')))!=9:errors.append('Expected 9 public lab guides')
if correct_positions!={0,1,2}:errors.append('Quiz answer positions are not varied')
if errors:
    print('\n'.join(errors),file=sys.stderr);sys.exit(1)
print(f'Validated {len(pages)} HTML pages: local assets, repository-relative links, anchors, page structure, and lesson contracts.')
