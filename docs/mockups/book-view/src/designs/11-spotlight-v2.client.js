/* eslint-disable -- standalone browser mockup script (inlined into static HTML), not app code */
/* Spotlight v2 behaviour: routing (#read / #landing), settings row, contents drawer, bottom sheet, mini landing demo.
   Runs after the shared engine; talks to it through window.__book (patched at build time). */
(function () {
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var root = document.documentElement;
  var KEY = 'bv2';
  var SIZES = [0.9, 1, 1.12, 1.25, 1.4];
  var THEMES = ['dark', 'light', 'sepia'];
  var st = { pal: 'archive', dim: 'full', ts: 1 };
  try {
    Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {}
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {}
  }

  function boot() {
    var B = window.__book;
    var dock = $('#dock'),
      toc = $('#toc'),
      tocBtnReturn = null;

    /* ---- routing ---- */
    function route() {
      var r = /landing/.test(location.hash) ? 'landing' : 'read';
      root.dataset.route = r;
      document.title =
        r === 'landing'
          ? 'Thoth: landing (mock)'
          : 'Thoth book view 08 v2: Spotlight';
      if (r === 'landing') {
        B.play(false);
        closeToc();
        closeSheet();
        stopDemo();
      } else {
        requestAnimationFrame(function () {
          B.setCur(B.state().ci);
        });
      }
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', route);
    route();

    /* ---- theme (segmented), kept in sync with the engine's T handling ---- */
    function syncTheme() {
      var t = root.getAttribute('data-theme');
      $$('[data-seg=theme] button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.v === t);
      });
      $$('[data-themename]').forEach(function (e) {
        e.textContent = t;
      });
    }
    new MutationObserver(syncTheme).observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    syncTheme();

    /* ---- palette ---- */
    function setPal(p) {
      st.pal = p;
      root.dataset.pal = p;
      save();
      $$('.sw button').forEach(function (b) {
        b.setAttribute('aria-checked', b.dataset.v === p);
      });
      var nm = $('[data-palname]');
      if (nm) nm.textContent = p === 'high-contrast' ? 'high contrast' : p;
    }
    /* ---- spotlight dim ---- */
    function setDim(d) {
      st.dim = d;
      root.dataset.dim = d;
      save();
      $$('[data-seg=dim] button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.v === d);
      });
    }
    /* ---- text size: scale the type and re-paginate so no page overflows ---- */
    function setSize(ts, quiet) {
      var i = SIZES.indexOf(ts);
      if (i < 0) {
        i = 1;
        ts = 1;
      }
      st.ts = ts;
      save();
      root.style.setProperty('--ts', ts);
      B.cfg.wpp = Math.round(110 / (ts * ts));
      B.cfg.wppSingle = Math.round(96 / (ts * ts));
      B.reflow();
      var m = $('[data-act2=smaller]'),
        p = $('[data-act2=larger]');
      if (m) m.disabled = i === 0;
      if (p) p.disabled = i === SIZES.length - 1;
      var o = $('[data-sizename]');
      if (o) o.textContent = Math.round(ts * 100) + '%';
    }
    /* ---- speed ---- */
    var sp = $('#speed');
    function setSpeed(w) {
      B.setRate(60000 / w);
      sp.setAttribute('aria-valuetext', w + ' words per minute');
    }
    sp.value = Math.round(60000 / B.getRate() / 10) * 10;
    sp.addEventListener('input', function () {
      setSpeed(+sp.value);
    });

    /* ---- word stepping (playback strip) ---- */
    function step(d) {
      B.play(false);
      var s = B.state(),
        to = s.ci + d;
      if (to < 0 || to >= B.words) return;
      var sameSpread = B.spreadOf(to) === s.spread;
      if (sameSpread) B.setCur(to);
      else
        B.turn(d, function (ok) {
          if (ok) B.setCur(to);
        });
    }

    /* ---- contents drawer ---- */
    var CH = [
      'The First Book',
      'The Second Book',
      'The Third Book',
      'The Fourth Book',
      'The Fifth Book',
      'The Sixth Book',
      'The Seventh Book',
      'The Eighth Book',
      'The Ninth Book',
      'The Tenth Book',
      'The Eleventh Book',
      'The Twelfth Book',
    ];
    function buildToc() {
      var np = B.state().pages;
      $('#toc-list').innerHTML = CH.map(function (c, i) {
        var pg = Math.max(1, Math.round((i / CH.length) * np) + 1);
        return (
          '<li><button type="button" data-ch="' +
          i +
          '"' +
          (i === 1 ? ' aria-current="true"' : '') +
          '><span class="n">' +
          (i + 1) +
          '</span><span class="t">' +
          c +
          '</span><span class="pgn">p. ' +
          pg +
          '</span></button></li>'
        );
      }).join('');
    }
    function openToc(from) {
      tocBtnReturn = from || null;
      closeSheet();
      buildToc();
      toc.classList.add('open');
      document.body.classList.add('toc-open');
      $$('[data-v2=toc]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'true');
      });
      setTimeout(function () {
        var c = $('#toc-close');
        c && c.focus();
      }, 30);
    }
    function closeToc() {
      if (!toc.classList.contains('open')) return;
      toc.classList.remove('open');
      document.body.classList.remove('toc-open');
      $$('[data-v2=toc]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
      });
      if (tocBtnReturn && root.dataset.route === 'read') tocBtnReturn.focus();
    }
    function openSheet() {
      closeToc();
      dock.classList.add('open');
      $$('[data-v2=sheet]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'true');
      });
    }
    function closeSheet() {
      dock.classList.remove('open');
      $$('[data-v2=sheet]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
      });
    }

    /* ---- clicks ---- */
    document.addEventListener('click', function (e) {
      var a = e.target.closest(
        '[data-v2],[data-act2],[data-seg] button,.sw button,[data-ch],[data-demo]',
      );
      if (!a) return;
      var v = a.dataset.v2,
        a2 = a.dataset.act2;
      if (v === 'wprev') step(-1);
      else if (v === 'wnext') step(1);
      else if (v === 'toc')
        (toc.classList.contains('open') ? closeToc : openToc)(a);
      else if (v === 'tocclose') closeToc();
      else if (v === 'sheet')
        (dock.classList.contains('open') ? closeSheet : openSheet)();
      else if (v === 'sheetclose') closeSheet();
      else if (a2 === 'smaller')
        setSize(SIZES[Math.max(0, SIZES.indexOf(st.ts) - 1)]);
      else if (a2 === 'larger')
        setSize(SIZES[Math.min(SIZES.length - 1, SIZES.indexOf(st.ts) + 1)]);
      else if (a.closest('[data-seg=theme]')) B.theme(a.dataset.v);
      else if (a.closest('[data-seg=dim]')) setDim(a.dataset.v);
      else if (a.closest('.sw')) setPal(a.dataset.v);
      else if (a.dataset.ch !== undefined) {
        var i = +a.dataset.ch;
        B.play(false);
        B.goto(Math.round((i / CH.length) * (B.words - 1)));
        closeToc();
      } else if (a.dataset.demo) demo(a.dataset.demo);
    });

    /* ---- keys: arrows / space / T. Ignored on the landing; Esc closes overlays. ---- */
    window.addEventListener(
      'keydown',
      function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 'Escape') {
          closeToc();
          closeSheet();
          return;
        }
        var tag = e.target.tagName,
          typing =
            /TEXTAREA|SELECT/.test(tag) ||
            (tag === 'INPUT' && e.target.type !== 'range');
        var onBtn = /BUTTON|^A$/.test(tag);
        var cycle = function () {
          B.theme(THEMES[(THEMES.indexOf(root.dataset.theme) + 1) % 3]);
        };
        if (root.dataset.route === 'landing') {
          e.stopImmediatePropagation();
          if (typing) return;
          if (e.key === ' ' && !onBtn) {
            e.preventDefault();
            demo('toggle');
          } else if (e.key === 't' || e.key === 'T') cycle();
          return;
        }
        if (typing) return;
        if (e.key === 't' || e.key === 'T') cycle();
        if (
          e.key === ' ' &&
          (onBtn || tag === 'INPUT') &&
          !(e.target.dataset && e.target.dataset.act === 'play')
        )
          e.stopImmediatePropagation();
      },
      true,
    );

    /* ---- landing demo: tiny RSVP over the textarea ---- */
    var demoT = null,
      demoI = 0,
      demoWords = [];
    var focusIdx = function (w) {
      var f = ((w.length - 1) / 2) | 0,
        j;
      for (j = f; j >= 0; j--)
        if (/[aeiou]/i.test(w[j])) {
          f = j;
          break;
        }
      return f;
    };
    function showDemo() {
      var w = demoWords[demoI] || '';
      var f = focusIdx(w);
      var el = $('#ld-word');
      if (!el) return;
      var esc = function (s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      };
      el.innerHTML =
        '<span class="hl">' +
        esc(w.slice(0, f)) +
        '</span><span class="hf">' +
        esc(w[f] || '') +
        '</span><span class="hr">' +
        esc(w.slice(f + 1)) +
        '</span>';
    }
    function stopDemo() {
      clearInterval(demoT);
      demoT = null;
      var b = $('#ld-play');
      if (b) b.textContent = 'Play';
    }
    function demo(k) {
      demoWords = $('#ld-text').value.trim().split(/\s+/).filter(Boolean);
      if (k === 'reset') {
        stopDemo();
        demoI = 0;
        showDemo();
        return;
      }
      if (k === 'toggle') {
        if (demoT) {
          stopDemo();
          return;
        }
      }
      if (demoT) {
        stopDemo();
        return;
      }
      $('#ld-play').textContent = 'Pause';
      demoT = setInterval(function () {
        demoI = (demoI + 1) % demoWords.length;
        showDemo();
      }, 60000 / 300);
    }
    demoWords = $('#ld-text').value.trim().split(/\s+/);
    showDemo();
    var dz = $('#ld-drop');
    ['dragenter', 'dragover'].forEach(function (n) {
      dz.addEventListener(n, function (e) {
        e.preventDefault();
        dz.classList.add('over');
      });
    });
    ['dragleave', 'drop'].forEach(function (n) {
      dz.addEventListener(n, function (e) {
        e.preventDefault();
        dz.classList.remove('over');
        if (n === 'drop')
          $('#ld-dropmsg').textContent = 'Mock: nothing is uploaded here.';
      });
    });

    /* ---- init ---- */
    setPal(st.pal);
    setDim(st.dim);
    setSpeed(+sp.value);
    var q = new URLSearchParams(location.search);
    if (q.get('pal')) setPal(q.get('pal'));
    if (q.get('dim')) setDim(q.get('dim'));
    setSize(SIZES.indexOf(st.ts) >= 0 ? st.ts : 1);
    if (q.get('ts')) setSize(+q.get('ts'));
    buildToc();
    syncTheme();
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
