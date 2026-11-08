#!/usr/bin/env python3
"""
Gera src/data/talents/i18n/pt-BR.json (nomes e descrições dos talentos em português).

Entrada (não versionada, em data-raw/), exportada com o wow.export do cliente
do WoW: Forever em ptBR: Talent, TalentTab, SpellName, Spell, SpellEffect,
SpellMisc, SpellDuration, SpellRadius, SpellRange; e data-raw/enUS/SpellName.csv
(mesma tabela com locale enUS).

Como funciona:
  - liga cada talento do Talents Forever ao feitiço do cliente pelo nome em inglês;
  - usa a frase em português do cliente e os números de cada rank do texto atual
    do Talents Forever (o servidor ajusta valores que o cliente não reflete);
  - se os números/porcentagens não baterem, deixa a descrição como null e a
    calculadora mostra o texto original em inglês.

Uso: python scripts/build-talents-ptbr.py   (depois de npm run talents:fetch)
"""
import csv, json, re, pickle, math, collections, sys
csv.field_size_limit(10**9)
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RAW = os.path.join(ROOT, 'data-raw')
DATA = os.path.join(ROOT, 'src', 'data', 'talents')
OUT = os.path.join(DATA, 'i18n', 'pt-BR.json')

def load(name):
    with open(f'{RAW}/{name}.csv', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f, delimiter=';'))

sp = {r['ID']: r for r in load('Spell')}
eff = {}
for r in load('SpellEffect'): eff.setdefault(r['SpellID'], []).append(r)
misc = {}
for r in load('SpellMisc'): misc.setdefault(r['SpellID'], r)
names = {r['ID']: r['Name_lang'] for r in load('SpellName')}
with open(os.path.join(RAW, 'enUS', 'SpellName.csv'), encoding='utf-8-sig', newline='') as f:
    en = {r['ID']: r['Name_lang'] for r in csv.DictReader(f, delimiter=';')}

durations = {r['ID']: int(r['Duration']) for r in load('SpellDuration')}
radii = {r['ID']: float(r['Radius']) for r in load('SpellRadius')}
ranges = {r['ID']: float(r['RangeMax'].split(',')[0]) for r in load('SpellRange')}
tabs = load('TalentTab')

en_by_name = collections.defaultdict(list)
for sid, n in en.items():
    en_by_name[n.strip().lower()].append(sid)

NUM = re.compile(r'\d+(?:[.,]\d+)?')

def fmt(v, decimals=None):
    if decimals is None:
        if abs(v - round(v)) < 1e-6:
            return str(int(round(v)))
        decimals = 1 if abs(v * 10 - round(v * 10)) < 1e-6 else 2
    s = f'{v:.{decimals}f}'
    return s.replace('.', ',')

def fmt_dur(ms):
    s = ms / 1000
    if s >= 60 and abs(s % 60) < 1e-6:
        m = int(s // 60)
        return f'{m} min'
    return f'{fmt(s)} s'

def effects(sid):
    return {int(e['EffectIndex']) + 1: e for e in eff.get(sid, [])}

def base_val(sid, letter, idx, scale):
    e = effects(sid).get(idx)
    if letter in 'smSM':
        if not e: return None
        v = abs(float(e['EffectBasePointsF']))
        return v * scale if v != 0 else None
    if letter == 't':
        if not e: return None
        p = int(e['EffectAuraPeriod'])
        return p / 1000 if p else None
    if letter == 'o':
        if not e: return None
        p = int(e['EffectAuraPeriod']); m = misc.get(sid)
        d = durations.get(m['DurationIndex']) if m else None
        v = abs(float(e['EffectBasePointsF']))
        if p and d and v: return v * scale * (d / p)
        return None
    if letter == 'a':
        if not e: return None
        ri = e['EffectRadiusIndex'].split(',')[0]
        return radii.get(ri)
    if letter == 'e':
        if not e: return None
        v = float(e['EffectAmplitude']);
        return v or None
    return None

TOKEN = re.compile(r'\$(\d+)?([smoatSMe])([1-3])')

import itertools

TOKEN = re.compile(r'\$(\d+)?([smoatSMe])([1-3])')

def nums(s):
    return [float(x.replace(',', '.')) for x in NUM.findall(s)]

def candidates(name):
    ids = en_by_name.get(name.strip().lower(), [])
    return [i for i in ids if sp.get(i, {}).get('Description_lang')]

EN_NUM = re.compile(r'(\d+(?:\.\d+)?)(\s*(?:sec|min|yd|yards?)\b)?', re.I)

SLOT = re.compile(
    r'\$\{(?P<expr>[^}]*)\}(?P<dec>\.\d)?'
    r'|\$(?P<op>[/*])(?P<n>[\d.]+);(?P<ref1>\d+)?(?P<l1>[smoatSMe])(?P<i1>[1-3])'
    r'|\$(?P<ref2>\d+)?(?P<l2>[smoatSMe])(?P<i2>[1-3])'
    r'|\$(?P<ref3>\d+)?(?P<dur>[dD])(?![a-z])'
    r'|\$(?P<ref4>\d+)?(?P<rng>r)(?![a-z])'
    r'|\$(?P<other>(?:\d+)?[a-zA-Z]+\d?)'
)

def clean(text):
    text = re.sub(r'\$[lL]([^:;]*):([^;]*);', r'\2', text)
    text = re.sub(r'\$[gG]([^:;]*):([^;]*);', r'\1', text)
    for _ in range(3):
        text = re.sub(r'\$\?[^\[]*\[([^\[\]]*)\]\[([^\[\]]*)\]', r'\2', text)
    return text

def client_value(m, sid, scale):
    """Valor do cliente para a lacuna (só para decidir a ordem), ou None."""
    g = m.groupdict()
    def val(ref, letter, idx):
        return base_val(ref or sid, letter, int(idx), scale if not ref else 1.0)
    if g['expr'] is not None:
        ok = True
        def sub(t):
            nonlocal ok
            v = val(t.group(1), t.group(2), t.group(3))
            if v is None: ok = False; return '0'
            return repr(v)
        py = TOKEN.sub(sub, g['expr'])
        if not ok or re.search(r'[^0-9.+\-*/() eE]', py): return None
        try: return eval(py, {'__builtins__': {}})
        except Exception: return None
    if g['op']:
        v = val(g['ref1'], g['l1'], g['i1'])
        if v is None: return None
        n = float(g['n']); return v / n if g['op'] == '/' else v * n
    if g['l2']:
        return val(g['ref2'], g['l2'], g['i2'])
    if g['dur']:
        mm = misc.get(g['ref3'] or sid); d = durations.get(mm['DurationIndex']) if mm else None
        return d / 1000 if d and d > 0 else None
    if g['rng']:
        mm = misc.get(g['ref4'] or sid); return ranges.get(mm['RangeIndex']) if mm else None
    return None

RANGE = re.compile(r'(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)')

def en_numbers(text):
    out = []
    # faixas "421 to 439" viram uma lacuna só: "421 a 439"
    for m in RANGE.finditer(text):
        out.append((f'{m.group(1)}–{m.group(2)}', 'range', m.start(), False))
    text_wo = RANGE.sub(lambda m: ' ' * len(m.group(0)), text)
    for m in EN_NUM.finditer(text_wo):
        unit = (m.group(2) or '').strip().lower()
        pct = text_wo[m.end(1):m.end(1) + 1] == '%'
        out.append((m.group(1), unit, m.start(), pct))
    out.sort(key=lambda x: x[2])
    return [(n, u, p) for n, u, _, p in out]
    for m in EN_NUM.finditer(text):
        unit = (m.group(2) or '').strip().lower()
        out.append((m.group(1), unit))
    return out

def num_value(n):
    if '–' in n:
        a, b = n.split('–'); return (float(a) + float(b)) / 2
    return float(n)

def pt_fmt(num, unit, kind):
    if '–' in num:
        a, b = num.split('–'); return f"{a.replace('.', ',')} a {b.replace('.', ',')}"
    s = num.replace('.', ',')
    if kind == 'dur':
        if unit.startswith('min'): return f'{s} min'
        return f'{s} s'
    return s

def fill(tpl, sid, scale, en_text):
    tpl = clean(tpl)
    slots = list(SLOT.finditer(tpl))
    # números literais do texto PT (ex.: "50% de chance") também aparecem no EN
    literal = [x.replace(',', '.') for x in NUM.findall(SLOT.sub(' ', tpl))]
    pool = en_numbers(en_text)
    rest = list(pool)
    for lit in literal:
        for i, (n, u, _p) in enumerate(rest):
            if '–' not in n and abs(float(n) - float(lit)) < 1e-6: rest.pop(i); break
        else:
            return None, 0  # literal do PT não existe no EN → template diferente
    if len(rest) != len(slots):
        return None, 0
    if not slots:
        return tpl, 1.0
    cvals = [client_value(m, sid, scale) for m in slots]
    best = None
    perms = itertools.permutations(range(len(rest))) if len(rest) <= 5 else [tuple(range(len(rest)))]
    for p in perms:
        cost = 0.0
        for si, ri in enumerate(p):
            cv = cvals[si]; ev = num_value(rest[ri][0])
            slot_pct = tpl[slots[si].end():slots[si].end() + 1] == '%'
            if slot_pct != rest[ri][2]: cost += 5
            if bool(slots[si].group('dur')) != rest[ri][1] in ('sec', 'min'): cost += 5
            if cv and ev: cost += abs(math.log(abs(cv) / ev))
            elif cv is not None and cv != ev: cost += 3
            cost += 0.001 * abs(si - ri)  # empate → mantém ordem
        if not best or cost < best[0]: best = (cost, p)
    cost, p = best
    out, last = [], 0
    for si, m in enumerate(slots):
        n, u, _p = rest[p[si]]
        kind = 'dur' if m.group('dur') else 'num'
        out.append(tpl[last:m.start()]); out.append(pt_fmt(n, u, kind)); last = m.end()
    out.append(tpl[last:])
    text = ''.join(out)
    # confiança: média de proximidade dos valores conhecidos
    known = [c for c in cvals if c]
    conf = 1.0 / (1.0 + cost / max(1, len(known))) if known else 0.6
    return text, conf

# feitiços que o cliente usa em talentos (layout Classic) — bons candidatos
TALENT_SPELLS = {}
_tabmask = {t['ID']: int(t['ClassMask']) for t in load('TalentTab')}
for row in load('Talent'):
    for x in row['SpellRank'].split(','):
        if x != '0': TALENT_SPELLS[x] = _tabmask.get(row['TabID'], 0)

CURRENT_MASK = 0

def talent_bonus(sid):
    if sid in TALENT_SPELLS: return 3 if TALENT_SPELLS[sid] == CURRENT_MASK else 2
    mm = misc.get(sid)
    passive = mm is not None and mm['DurationIndex'] in ('0', '') and int(sid) >= 1_300_000
    return 1 if passive else 0

def translate_talent(t):
    cands = candidates(t['name'])
    best = None
    for sid in cands:
        tpl = sp[sid]['Description_lang']
        ranks, conf_sum, ok = [], 0, 0
        for r in range(1, t['max'] + 1):
            en_text = t['desc'][r - 1] if r - 1 < len(t['desc']) else ''
            text, conf = fill(tpl, sid, r / t['max'], en_text)
            if text is not None:
                e = sorted(re.findall(r'(\d+(?:\.\d+)?)%', en_text))
                p = sorted(x.replace(',', '.') for x in re.findall(r'(\d+(?:,\d+)?)%', text))
                if e != p: text = None  # texto do cliente descreve outra coisa
            ranks.append(text); conf_sum += conf; ok += text is not None
        score = (ok, talent_bonus(sid), conf_sum)
        if not best or score > best[0]: best = (score, sid, ranks)
    if not best: return None
    (ok, _bonus, conf), sid, ranks = best
    return {'spell': int(sid), 'name': names.get(sid), 'ranks': ranks, 'ok': ok, 'conf': conf / max(1, len(ranks))}

CLS = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid']
CLASSMASK = {'warrior': 1, 'paladin': 2, 'hunter': 4, 'rogue': 8, 'priest': 16, 'shaman': 64, 'mage': 128, 'warlock': 256, 'druid': 1024}
out = {'_meta': {
    'locale': 'pt-BR',
    'source': 'Textos do cliente do WoW: Forever em pt-BR (extraídos com wow.export); números de cada rank conferidos com Talents Forever (CC BY 4.0).',
    'note': 'Nomes e textos de talentos pertencem à Blizzard Entertainment. Descrição null = usar o texto original (inglês).',
}, 'classes': {}}
stats = collections.Counter(); report = []
for cls in CLS:
    d = json.load(open(os.path.join(DATA, f'{cls}.json'), encoding='utf-8'))
    ctabs = sorted([t for t in tabs if int(t['ClassMask']) == CLASSMASK[cls]], key=lambda t: int(t['OrderIndex']))
    c = {'trees': [t['Name_lang'] for t in ctabs], 'talents': {}}
    CURRENT_MASK = CLASSMASK[cls]
    for tr in d['trees']:
        for t in tr['talents']:
            stats['total'] += 1
            res = translate_talent(t)
            if not res or not res['name']:
                stats['sem_nome'] += 1; report.append(('SEM NOME', cls, t['name'])); continue
            full = res['ok'] == t['max']
            stats['desc_completa' if full else 'desc_parcial' if res['ok'] else 'so_nome'] += 1
            if not full: report.append(('DESC', cls, t['name'], res['name'], f"{res['ok']}/{t['max']}"))
            if full and res['conf'] < 0.5: report.append(('BAIXA CONF', cls, t['name'], round(res['conf'], 2)))
            c['talents'][t['name']] = {'name': res['name'], 'desc': res['ranks']}
    out['classes'][cls] = c
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dict(stats))
for r in report:
    if r[0] != 'BAIXA CONF': print(r)
print(f'Salvo em {OUT}')
