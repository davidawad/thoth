"""Pull every number shown in the videos from the real repo (git + source files)."""
import re, subprocess, json, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent


def sh(*a):
    return subprocess.run(a, cwd=ROOT, capture_output=True, text=True, check=True).stdout


def git_show(rev, path):
    return sh("git", "show", f"{rev}:{path}")


def ver(pkg_json, name):
    j = json.loads(pkg_json)
    d = {**j.get("dependencies", {}), **j.get("devDependencies", {})}
    return d.get(name, "-").lstrip("^~")


def collect():
    log = sh("git", "log", "--format=%h|%ad|%s", "--date=short").strip().splitlines()
    commits = [l.split("|", 2) for l in log]
    years = collections.Counter(c[1][:4] for c in commits)
    burst = [c for c in commits if c[1] >= "2026-07-27"]
    files = sh("git", "ls-files", "src").split()
    test_files = [f for f in files if ".test." in f]
    src_files = [f for f in files if re.search(r"\.tsx?$", f) and ".test." not in f]

    def cat(fs):
        return "".join((ROOT / f).read_text() for f in fs)

    test_src = cat(test_files)
    n_tests = len(re.findall(r"^\s*(?:it|test)(?:\.each\(.*?\))?\(", test_src, re.M))
    n_props = len(re.findall(r"fc\.assert", test_src))
    bench = json.loads((ROOT / "bench/baseline.json").read_text())
    n_bench = sum(len(g["benchmarks"]) for f in bench["files"] for g in f["groups"])
    ci = (ROOT / ".github/workflows/ci.yml").read_text()
    jobs = re.findall(r"^  ([a-z-]+):\s*$", ci.split("jobs:")[1], re.M)
    rel = re.findall(r"^#+ \[?(\d+\.\d+\.\d+)", (ROOT / "CHANGELOG.md").read_text(), re.M)
    vit = (ROOT / "vitest.config.ts").read_text()
    hundred = len(re.findall(r"lines: 100,", vit))
    strykr = (ROOT / "stryker.config.mjs").read_text()
    m = re.search(r"([\d.]+)% at time of\s*//\s*writing, up from a ([\d.]+)%", strykr)
    brk = re.search(r"break: (\d+)", strykr).group(1)
    n_mutate = len(re.findall(r"^\s+'src/.*',", strykr, re.M))
    fuzz = sorted(p.name for p in (ROOT / "fuzz").glob("*.fuzz.js"))
    books = sorted(p.name for p in (ROOT / "public/sample-books").glob("*.epub"))
    p19 = git_show("7b073dc", "package.json")
    p25 = git_show("82c220c", "package.json")
    pnow = (ROOT / "package.json").read_text()
    return dict(
        total=len(commits), years=dict(sorted(years.items())), burst=len(burst),
        first=commits[-1][1], last=commits[0][1],
        subjects={c[0]: c[2] for c in commits},
        log=[tuple(c) for c in reversed(commits)],  # oldest first: (hash, date, subject)
        n_tests=n_tests, n_props=n_props, n_test_files=len(test_files),
        test_loc=len(test_src.splitlines()), src_loc=len(cat(src_files).splitlines()),
        n_bench=n_bench, ci_jobs=jobs, releases=sorted(set(rel)), n_hundred=hundred,
        mut_to=float(m.group(1)), mut_from=float(m.group(2)),
        mut_break=int(brk), n_mutate=n_mutate, fuzz=fuzz, books=books,
        v={k: (ver(p19, k), ver(p25, k), ver(pnow, k)) for k in
           ["react", "next", "tailwindcss", "daisyui", "typescript", "vitest", "jest"]},
    )


if __name__ == "__main__":
    d = collect()
    d.pop("subjects"); d.pop("log")
    print(json.dumps(d, indent=1))
