#!/usr/bin/env python3
"""Build the thoth stop-motion videos.  usage: build.py [timeline|quality|stack|all] [--fast]"""
import sys, random, functools, pathlib
from lib import *
import data as D

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "out"
TMP = pathlib.Path("/tmp/thoth-videos-frames")
d = D.collect()
LOG = d["log"]


@functools.lru_cache(maxsize=None)
def S(lines, size=64, fnt=HAND, color="yellow", seed=1, ink=INK, pad=34, minw=0):
    return cutout(list(lines) if isinstance(lines, tuple) else lines, size=size, fnt=fnt, color=color, seed=seed,
                  ink=ink, pad=pad, minw=minw)


def L(*lines, **kw):
    return S(tuple(lines), **kw)


def stick(c, t, t0, spr, x, y, ang=0.0, rng=None, dur=0.35, jit=4):
    k = pop(t, t0, dur)
    if k > 0.02:
        place(c, spr, x, y, ang, rng, jit=jit, scale=k)


def tick(t, t0, dur, a, b):
    x = ease_out((on_twos(t, 2) - t0) / dur)
    return int(round(a + (b - a) * x))


def cum(date):
    return sum(1 for h, dt, s in LOG if dt <= date)


def hud(c, t, rng, count, label):
    """Persistent corner counter + date label."""
    place(c, L(f"{count} commits", size=44, color="ink", ink=PAPER, pad=22, seed=3), 1560, 90, 2, rng, jit=2)
    place(c, L(label, size=44, color="white", pad=20, seed=5), 380, 90, -2, rng, jit=2)


def trim(s, n=44):
    s = s.replace("fuck", "f***").replace("FUCK", "F***").replace("shit", "s***")
    return s if len(s) <= n else s[:n - 1].rstrip() + "…"


COL = ["yellow", "pink", "blue", "green", "orange", "teal", "purple", "red"]


def title_card(big, sub, color="red", sub2=None):
    @bg("paper" if False else PAPER)
    def f(c, t, rng, dur):
        x0 = 960 - (len(big) - 1) * 150
        for i, ch in enumerate(big):
            stick(c, t, 0.15 + i * 0.22, S(ch, size=300, fnt=TYPE, color=COL[(i * 3) % len(COL)], pad=36, seed=10 + i,
                                              ink=INK), x0 + i * 300, 430, (-5, 4, -3, 6, -4)[i % 5], rng)
        stick(c, t, 1.5, L(sub, size=62, color="white", seed=21), 960, 760, -1.5, rng)
        if sub2:
            stick(c, t, 2.0, L(sub2, size=44, color="ink", ink=PAPER, seed=22), 960, 900, 1, rng)
    return f


# ====================================================================== VIDEO 1: timeline
def v_timeline():
    c19, c22, c25 = cum("2019-12-31"), cum("2022-12-31"), cum("2025-12-31")
    c_pre, c_total = cum("2026-07-26"), d["total"]
    subj = lambda h: next(s for hh, _, s in LOG if hh == h)

    def s2019(c, t, rng, dur):
        hud(c, t, rng, tick(t, 0.3, 2.0, 1, c19), "JUN 2019")
        stick(c, t, 0.1, L("Create React App", "React 16.8.6", size=70, color="blue", ink=PALETTE["white"], seed=31), 960, 300, -2, rng)
        items = [("7b073dc", 30, -4, 480, 560), ("e732399", 60, 3, 1380, 560), ("df358de", 40, -2, 480, 760),
                 ("581dfd8", 40, 3, 1380, 760), ("8a1ecb7", 40, -3, 960, 920)]
        for i, (h, sz, a, x, y) in enumerate(items):
            stick(c, t, 1.0 + i * 0.8, L(trim(subj(h).replace("FEAT: ", ""), 34), size=sz + 6, color=COL[i], seed=40 + i, pad=24), x, y, a, rng)
        stick(c, t, 5.0, L("47 commits in the first year", size=54, color="ink", ink=PAPER, seed=39), 960, 430, 1, rng)

    def s2022(c, t, rng, dur):
        hud(c, t, rng, tick(t, 0.3, 1.0, c19 + 1, c22), "NOV 2022")
        stick(c, t, 0.1, L("10 commits, one day", "(2022-11-23)", size=72, color="orange", seed=51), 960, 300, 2, rng)
        for i, h in enumerate(["65047d1", "2089085", "56f1eee", "b861c66"]):
            stick(c, t, 0.9 + i * 0.7, L(trim(subj(h), 40), size=40, color=COL[i + 2], seed=60 + i, pad=24),
                  960 + (-1) ** i * 330, 560 + i * 110, (-3, 3)[i % 2], rng)

    def s2025(c, t, rng, dur):
        hud(c, t, rng, tick(t, 0.3, 2.5, c22 + 1, c25), "FEB-APR 2025")
        stick(c, t, 0.1, L("Tailwind + daisyUI + Docker", "Next 15 / React 19 / Jest", size=62, color="teal", seed=71), 960, 290, -1.5, rng)
        stick(c, t, 1.3, L("\"" + subj("82c220c") + "\"", size=64, color="yellow", seed=72, fnt=CHALK), 960, 520, 2, rng)
        stick(c, t, 2.6, L("PR #40  color-modes  merged", size=50, color="pink", seed=73), 600, 740, -3, rng)
        stick(c, t, 3.4, L("GitLab CI + GitHub Actions", size=50, color="green", seed=74), 1330, 740, 3, rng)
        stick(c, t, 4.4, L("18 commits in 2025", size=50, color="ink", ink=PAPER, seed=75), 960, 910, -1, rng)

    def sgap(c, t, rng, dur):
        hud(c, t, rng, c25, "2025 - 2026")
        stick(c, t, 0.2, L("Apr 2025 - Mar 2026", size=76, color="white", seed=81), 960, 360, -2, rng)
        stick(c, t, 1.0, L("0 commits", size=140, color="ink", ink=PAPER, fnt=TYPE, seed=82), 960, 560, 1.5, rng)
        stick(c, t, 2.2, L("Mar 28 2026:  \"noop\"", size=60, color="yellow", seed=83), 960, 800, -1, rng)

    burst = [(h, dt, s) for h, dt, s in LOG if dt >= "2026-07-27" and "release" not in s][:15]

    def sburst(c, t, rng, dur):
        n = tick(t, 0.2, dur - 1.5, c_pre, c_total)
        hud(c, t, rng, n, "27-29 JUL 2026")
        stick(c, t, 0.0, L("44 commits in 3 days", size=76, color="red", ink=PALETTE["white"], seed=91), 960, 220, 1.5, rng)
        r = random.Random(5)
        for i, (h, dt, s) in enumerate(burst):
            col, row = i % 3, i // 3
            x = 400 + col * 560 + r.uniform(-20, 20)
            y = 430 + row * 140 + r.uniform(-12, 12)
            stick(c, t, 0.7 + i * 0.55, L(trim(s.split(": ", 1)[-1], 30), size=32, color=COL[i % 8], seed=100 + i, pad=20), x, y,
                  r.uniform(-4, 4), rng, jit=3)

    def srel(c, t, rng, dur):
        hud(c, t, rng, c_total, "RELEASES")
        stick(c, t, 0.1, L("semantic-release: 6 versions", size=66, color="green", seed=111), 960, 250, -1.5, rng)
        notes = {"1.0.0": "baseline", "1.1.0": "Makefile + justfile", "1.1.1": "accessible nav, EPUB fixes",
                 "1.2.0": "cites the RSVP paper", "1.2.1": "close button on settings", "1.2.2": "remove broken Highlight"}
        for i, v in enumerate(d["releases"]):
            x, y = 560 + (i % 2) * 800, 440 + (i // 2) * 200
            stick(c, t, 0.8 + i * 0.5, L(f"v{v}", notes[v], size=50, color=COL[i], seed=120 + i), x, y, (-3, 2, 4)[i % 3], rng)

    def send(c, t, rng, dur):
        stick(c, t, 0.1, L("THOTH", size=240, fnt=TYPE, color="red", ink=PALETTE["white"], seed=131), 960, 330, -2, rng)
        stick(c, t, 0.9, L(f"{d['total']} commits", size=88, color="yellow", seed=132), 600, 620, -3, rng)
        stick(c, t, 1.5, L("7 years", size=88, color="blue", ink=PALETTE["white"], seed=133), 1320, 620, 3, rng)
        stick(c, t, 2.1, L("one word at a time", size=70, color="white", seed=134), 960, 830, -1, rng)

    return [(4, title_card("THOTH", "a speed-reading app, hand-built", sub2="June 2019 - July 2026")), (7, s2019),
            (4.5, s2022), (6, s2025), (4, sgap), (11, sburst), (5, srel), (4, send)]


# ====================================================================== VIDEO 2: quality stack
def v_quality():
    def head(c, t, rng, txt, col, sd):
        stick(c, t, 0.0, L(txt, size=80, color=col, seed=sd), 960, 170, -1.5, rng)

    def stests(c, t, rng, dur):
        head(c, t, rng, "TESTS", "blue", 201)
        n = tick(t, 0.4, 2.5, 0, d["n_tests"])
        text(c, str(n), 620, 520, size=300, fnt=TYPE, rng=rng, jit=3)
        text(c, "test cases", 620, 700, size=60, rng=rng)
        stick(c, t, 1.2, L(f"{d['n_test_files']} test files", size=50, color="yellow", seed=202), 1300, 400, 3, rng)
        stick(c, t, 2.4, L(f"{d['n_props']} property-based", "fast-check assertions", size=50, color="pink", seed=203), 1300, 560, -3, rng)
        stick(c, t, 3.6, L(f"{d['test_loc']} lines of tests", f"vs {d['src_loc']} lines of source", size=50, color="green", seed=204), 1300, 760, 2, rng)
        stick(c, t, 5.0, L("Jest -> Vitest", size=50, color="orange", seed=205), 600, 900, -2, rng)

    def scov(c, t, rng, dur):
        head(c, t, rng, "COVERAGE GATES", "teal", 211)
        stick(c, t, 0.6, L(f"{d['n_hundred']} modules", "held at 100% lines", size=80, color="white", seed=212), 960, 460, 2, rng)
        for i, (m, col) in enumerate([("utils.ts", "yellow"), ("schemas.ts", "pink"), ("extractText.ts", "blue")]):
            stick(c, t, 1.6 + i * 0.7, L(m, size=56, fnt=TYPE, color=col, seed=213 + i), 480 + i * 480, 700, (-3, 2, 4)[i], rng)
        stick(c, t, 4.0, L("thresholds enforced in vitest.config.ts", size=44, color="ink", ink=PAPER, seed=218), 960, 900, -1, rng)

    def smut(c, t, rng, dur):
        head(c, t, rng, "MUTATION TESTING", "red", 221)
        stick(c, t, 0.3, L("Stryker", f"{d['n_mutate']} core files mutated", size=50, color="yellow", seed=222), 480, 380, -3, rng)
        x0, x1, y, h = 260, 1660, 640, 120
        place(c, rect_scrap(x1 - x0 + 30, h + 30, "ink", 9), 960, y, 0, rng, jit=2, rot_jit=0.3)
        v = d["mut_from"] + (d["mut_to"] - d["mut_from"]) * ease_out((on_twos(t, 2) - 2.2) / 3.0) if t > 2.2 else 0
        v = min(v, d["mut_to"]) if t > 2.2 else d["mut_from"] * clamp((t - 0.8) / 1.2)
        wid = max(10, int((x1 - x0) * v / 100))
        col = "red" if v < 50 else ("orange" if v < 65 else "green")
        place(c, rect_scrap(wid, h, col, 11, 4), x0 + wid / 2, y, 0, rng, jit=2, rot_jit=0.2, shadow=False)
        text(c, f"{v:.2f}%", 960, 820, size=130, fnt=TYPE, rng=rng)
        bx = x0 + (x1 - x0) * d["mut_break"] / 100
        place(c, rect_scrap(10, 190, "white", 12, 2), bx, y, 0, rng, jit=2, rot_jit=0.5, shadow=False)
        text(c, f"break gate: {d['mut_break']}%", bx, 500, size=40, rng=rng)
        stick(c, t, 5.5, L(f"from {d['mut_from']}% baseline", "to %.2f%%" % d["mut_to"], size=46, color="white", seed=223), 1480, 340, 3, rng)

    def sfuzz(c, t, rng, dur):
        head(c, t, rng, "FUZZING", "purple", 231)
        stick(c, t, 0.4, L("jazzer.js", "random garbage in, no crashes out", size=54, color="white", seed=232), 960, 380, -1.5, rng)
        for i, f in enumerate(d["fuzz"]):
            stick(c, t, 1.4 + i, L(f.replace(".fuzz.js", ""), size=50, fnt=TYPE, color=COL[i + 2], seed=233 + i), 560 + i * 800, 640, (-3, 3)[i], rng)
        r = random.Random(int(t * 10))
        junk = "".join(r.choice("0123456789abcdef#%&@!?") for _ in range(46))
        text(c, junk, 960, 870, size=48, fnt=TYPE, fill=(120, 60, 60), rng=rng, jit=5)

    def sbench(c, t, rng, dur):
        head(c, t, rng, "BENCHMARKS", "orange", 241)
        n = tick(t, 0.4, 1.2, 0, d["n_bench"])
        text(c, str(n), 620, 520, size=320, fnt=TYPE, rng=rng, jit=3)
        text(c, "tracked benchmarks", 620, 720, size=56, rng=rng)
        stick(c, t, 1.6, L("tinybench via Vitest", size=50, color="yellow", seed=242), 1300, 430, 2, rng)
        stick(c, t, 2.6, L("bench/baseline.json", "compared on every run", size=50, color="blue", ink=PALETTE["white"], seed=243), 1300, 630, -2, rng)
        stick(c, t, 3.6, L("slower? it shows.", size=50, color="pink", seed=244), 1300, 830, 3, rng)

    def sci(c, t, rng, dur):
        head(c, t, rng, f"CI: {len(d['ci_jobs'])} JOBS", "green", 251)
        for i, j in enumerate(d["ci_jobs"]):
            x, y = 400 + (i % 3) * 560, 390 + (i // 3) * 190
            stick(c, t, 0.7 + i * 0.5, L(j, size=54, fnt=TYPE, color=COL[i % 8], seed=252 + i), x, y, (-4, 3, 5)[i % 3], rng)
        stick(c, t, 5.6, L("+ commitlint + semantic-release", size=48, color="ink", ink=PAPER, seed=261), 960, 960, -1, rng)

    def send(c, t, rng, dur):
        stick(c, t, 0.1, L("shipped like it matters", size=90, color="red", ink=PALETTE["white"], seed=271), 960, 420, -1.5, rng)
        stick(c, t, 1.0, L(f"{d['n_tests']} tests", f"{d['mut_to']}% mutation score", f"{len(d['ci_jobs'])} CI jobs", size=62, color="yellow", seed=272), 960, 700, 1.5, rng)

    return [(4, title_card("QA", "what 124 commits of rigor looks like")), (7.5, stests), (6, scov), (8, smut), (5, sfuzz),
            (5.5, sbench), (7.5, sci), (4, send)]


# ====================================================================== VIDEO 3: stack upgrades
def v_stack():
    V = d["v"]

    def swap(name, old, new, olab, nlab, col):
        def f(c, t, rng, dur):
            stick(c, t, 0.0, L(name, size=88, color=col, seed=hash(name) % 997), 960, 190, -1.5, rng)
            stick(c, t, 0.5, L(*[x for x in (old, olab) if x], size=84, fnt=TYPE, color="white", seed=301), 540, 560, -3, rng)
            stick(c, t, 1.6, L("->", size=140, color="ink", ink=PAPER, seed=303, pad=24), 960, 580, 0, rng)
            stick(c, t, 2.3, L(*[x for x in (new, nlab) if x], size=96, fnt=TYPE, color="green", seed=302), 1380, 560, 2, rng)
        return f

    def swap_simple(name, old, new, col, olab="", nlab=""):
        return swap(name, old, new, olab, nlab, col)

    def sthemes(c, t, rng, dur):
        stick(c, t, 0.0, L("THREE THEMES", "Atkinson Hyperlegible type", size=62, color="pink", seed=311), 960, 200, -1, rng)
        sw = [("light", (252, 250, 245), INK), ("dark", (36, 38, 48), (235, 232, 225)), ("sepia", (236, 216, 178), (80, 52, 30))]
        for i, (n, bgc, fg) in enumerate(sw):
            x = 440 + i * 520
            stick(c, t, 0.8 + i * 0.9, S(("Read.", "One word.", f"{n}"), size=64, fnt=TYPE, color=bgc, ink=fg, seed=312 + i, minw=300, pad=50),
                  x, 620, (-3, 2, -2)[i], rng)
        stick(c, t, 3.9, L("daisyUI 5 data-theme, saved in localStorage", size=42, color="ink", ink=PAPER, seed=319), 960, 930, 1, rng)

    words = "Reading speed is a feature not a trait".split()

    def srsvp(c, t, rng, dur):
        stick(c, t, 0.0, L("THE READER", "one word at a time (RSVP)", size=60, color="blue", ink=PALETTE["white"], seed=321), 960, 200, 1, rng)
        place(c, rect_scrap(1100, 330, "white", 322), 960, 560, 0, rng, jit=3, rot_jit=0.4)
        w = words[int(t * 5) % len(words)]
        piv = len(w) // 2 - (1 if len(w) > 3 else 0) if len(w) > 1 else 0
        f = font(TYPE, 150)
        full = ImageDraw.Draw(c).textlength(w, font=f)
        left = ImageDraw.Draw(c).textlength(w[:piv], font=f)
        pw = ImageDraw.Draw(c).textlength(w[piv], font=f)
        x = 960 - left - pw / 2
        ImageDraw.Draw(c).text((x + rng.uniform(-3, 3), 560 + rng.uniform(-3, 3)), w[:piv], font=f, fill=INK, anchor="lm")
        ImageDraw.Draw(c).text((x + left, 560), w[piv], font=f, fill=PALETTE["red"], anchor="lm")
        ImageDraw.Draw(c).text((x + left + pw, 560), w[piv + 1:], font=f, fill=INK, anchor="lm")
        stick(c, t, 1.0, L("PDF + EPUB upload", size=46, color="yellow", seed=323), 480, 840, -3, rng)
        stick(c, t, 1.8, L("3 public-domain sample books", size=46, color="green", seed=324), 1400, 840, 2, rng)
        stick(c, t, 2.8, L("slows down on hard words", size=46, color="orange", seed=325), 960, 940, -1, rng)

    def send(c, t, rng, dur):
        stick(c, t, 0.1, L("same app.", "new bones.", size=130, fnt=TYPE, color="red", ink=PALETTE["white"], seed=331), 960, 450, -2, rng)
        stick(c, t, 1.2, L("JS -> TypeScript  |  yarn -> pnpm  |  oxlint gate", size=46, color="white", seed=332), 960, 800, 1, rng)

    r, n, tw, dy, ts = V["react"], V["next"], V["tailwindcss"], V["daisyui"], V["typescript"]
    return [(3.5, title_card("NEW", "the stack, rebuilt", sub2="2019 -> 2026")),
            (4.5, swap_simple("REACT", r[0], r[2], "red", "2019 (CRA)", "2026")),
            (4.5, swap_simple("NEXT.JS", n[1], n[2], "blue", "Mar 2025", "Jul 2026")),
            (4.5, swap_simple("TAILWIND", tw[1], tw[2], "teal", "Mar 2025", "Jul 2026")),
            (4.5, swap_simple("DAISYUI", dy[1], dy[2], "pink", "Mar 2025", "Jul 2026")),
            (4.5, swap_simple("TYPESCRIPT", ts[1], ts[2], "purple", "Mar 2025", "Jul 2026")),
            (4.5, swap_simple("TEST RUNNER", "Jest " + V["jest"][1], "Vitest " + V["vitest"][2], "orange")),
            (6, sthemes), (6, srsvp), (4, send)]


VIDEOS = dict(timeline=("01-timeline", v_timeline), quality=("02-quality-stack", v_quality), stack=("03-stack-upgrades", v_stack))

if __name__ == "__main__":
    which = [a for a in sys.argv[1:] if not a.startswith("--")] or ["all"]
    for k, (name, fn) in VIDEOS.items():
        if "all" in which or k in which:
            render(fn(), OUT / f"{name}.mp4", TMP / name)
