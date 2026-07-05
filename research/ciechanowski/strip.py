#!/usr/bin/env python3
"""Strip ciechanow.ski post HTML into study text.

Preserves the craft-relevant structure:
  # Heading                    — section headings
  [FIGURE n | id | ratio]      — canvas mount points (drawer_container divs)
  [CONTROL | id]               — slider/control mount divs that follow a figure
  {class|words}                — colored-vocabulary spans binding prose to figure parts
  prose                        — paragraph text, entities decoded
"""
import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class Stripper(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.fig_count = 0
        self.in_body = False
        self.depth_at_body = None
        self.div_depth = 0
        self.tag_stack = []       # (tag, emit_close_text)
        self.buf = None           # current paragraph/heading buffer
        self.buf_kind = None      # 'p' | 'h' | 'pre' | 'li'
        self.span_stack = []      # colored span classes awaiting close

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get('class', '')
        if tag == 'div':
            self.div_depth += 1
            if a.get('id') == 'body':
                self.in_body = True
                self.depth_at_body = self.div_depth
            if self.in_body and 'drawer_container' in cls:
                self.fig_count += 1
                ratio = ' '.join(c for c in cls.split() if c.startswith('ratio'))
                self.out.append(f"\n[FIGURE {self.fig_count} | {a.get('id','?')} | {ratio}]")
            elif self.in_body and self.fig_count and self.buf is None and a.get('id') and not cls:
                # bare empty div with id right in the flow = control mount
                self.out.append(f"[CONTROL | {a['id']}]")
            elif self.in_body and self.fig_count and self.buf is None and cls and ('slider' in cls or 'button' in cls):
                self.out.append(f"[CONTROL | {a.get('id', cls)}]")
        elif not self.in_body:
            return
        elif tag in ('h1', 'h2', 'h3'):
            self.buf = []
            self.buf_kind = 'h'
        elif tag == 'p':
            self.buf = []
            self.buf_kind = 'p'
        elif tag == 'li':
            self.buf = []
            self.buf_kind = 'li'
        elif tag == 'pre':
            self.buf = []
            self.buf_kind = 'pre'
        elif tag == 'span' and self.buf is not None:
            c = a.get('class', '')
            if c and not c.startswith('hanchor'):
                self.buf.append('{%s|' % c)
                self.span_stack.append(True)
            else:
                self.span_stack.append(False)

    def handle_endtag(self, tag):
        if tag == 'div':
            if self.in_body and self.div_depth == self.depth_at_body:
                self.in_body = False
            self.div_depth -= 1
        if not self.in_body and tag != 'div':
            return
        if tag in ('h1', 'h2', 'h3') and self.buf_kind == 'h':
            text = ''.join(self.buf).strip()
            if text:
                self.out.append(f"\n# {text}\n")
            self.buf = None
            self.buf_kind = None
        elif tag == 'p' and self.buf_kind == 'p':
            text = ' '.join(''.join(self.buf).split())
            if text:
                self.out.append(text)
            self.buf = None
            self.buf_kind = None
        elif tag == 'li' and self.buf_kind == 'li':
            text = ' '.join(''.join(self.buf).split())
            if text:
                self.out.append(f"  - {text}")
            self.buf = None
            self.buf_kind = None
        elif tag == 'pre' and self.buf_kind == 'pre':
            self.out.append('```\n' + ''.join(self.buf).strip() + '\n```')
            self.buf = None
            self.buf_kind = None
        elif tag == 'span' and self.buf is not None and self.span_stack:
            if self.span_stack.pop():
                self.buf.append('}')

    def handle_data(self, data):
        if self.buf is not None:
            self.buf.append(data)


def strip_file(path: Path) -> str:
    raw = path.read_text(encoding='utf-8')
    title = re.search(r'<h1 class="post_title">([^<]*)</h1>', raw)
    date = re.search(r'<div class="post_date">([^<]*)</div>', raw)
    s = Stripper()
    s.feed(raw)
    head = [f"TITLE: {html.unescape(title.group(1)) if title else path.stem}",
            f"DATE: {date.group(1).strip() if date else '?'}",
            f"FIGURES: {s.fig_count}", ""]
    return '\n'.join(head) + '\n\n'.join(s.out)


if __name__ == '__main__':
    for p in sorted(Path('.').glob('*.html')):
        txt = strip_file(p)
        Path(p.stem + '.txt').write_text(txt, encoding='utf-8')
        words = len(txt.split())
        print(f"{p.stem:32s} {words:>6d} words")
