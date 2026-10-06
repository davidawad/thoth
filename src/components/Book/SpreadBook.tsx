import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import PageView from './PageView';
import type { PageGeometry } from './spreadGeometry';
import {
  leftPage,
  type BookIndex,
  type Loc,
  type ReadState,
} from './spreadModel';
import type { DimMode } from './readingPrefs';

export const FLIP_MS = 640;

interface Props {
  ix: BookIndex;
  state: ReadState;
  span: 1 | 2;
  geom: PageGeometry;
  dim: DimMode;
  lang: string;
  bookTitle: string;
  reducedMotion: boolean;
  onOverflow: () => void;
  /** a click on a sentence moves the playback head to its first word */
  onPickWord: (pageGlobal: number, word: number) => void;
}

interface Frame {
  ix: BookIndex;
  left: number;
  cursor: Loc;
}

interface PageSpec {
  global: number;
  cursor: Loc | null;
  ix: BookIndex;
}

interface Flip {
  id: number;
  dir: 1 | -1;
  from: Frame;
  to: Frame;
}

const blank = -1;
type Side = 'left' | 'right';

/**
 * The open book: one or two pages, a ribbon at the spine, and a small 3D
 * page-turn (a leaf that rotates about the spine) whenever the visible pages
 * change. The leaf carries the OLD page on its front and the NEW page on its
 * back, so the turn lands exactly on the new spread. Skipped entirely for
 * prefers-reduced-motion.
 */
export default function SpreadBook({
  ix,
  state,
  span,
  geom,
  dim,
  lang,
  bookTitle,
  reducedMotion,
  onOverflow,
  onPickWord,
}: Props) {
  const left = leftPage(ix, state);
  const last = useRef<Frame>({ ix, left, cursor: state.cursor });
  const counter = useRef(0);
  const [flip, setFlip] = useState<Flip | null>(null);

  // Runs before paint: when the visible pages changed, start the turn from the
  // previous frame so there is never a frame of the new spread without it.
  useLayoutEffect(() => {
    const prev = last.current;
    const now: Frame = { ix, left, cursor: state.cursor };
    last.current = now;
    if (reducedMotion || prev.ix !== ix || prev.left === left) {
      if (prev.ix !== ix) {
        setFlip(null);
      }
      return;
    }
    counter.current += 1;
    setFlip({
      id: counter.current,
      dir: left > prev.left ? 1 : -1,
      from: prev,
      to: now,
    });
  }, [ix, left, state.cursor, reducedMotion]);

  const style = {
    '--sp-pw': `${geom.pw}px`,
    '--sp-ph': `${geom.ph}px`,
    '--sp-fs': `${geom.fs}px`,
  } as CSSProperties;

  const page = (spec: PageSpec, side: Side, main: boolean) => (
    <PageView
      ix={spec.ix}
      global={spec.global}
      bookTitle={bookTitle}
      head={side === 'left' ? 'book' : 'chapter'}
      cursor={spec.cursor}
      {...(main ? { onOverflow } : {})}
    />
  );

  // Pages shown under the leaf while it turns.
  const under = ((): { l: PageSpec; r: PageSpec } | null => {
    if (!flip) {
      return null;
    }
    const f = flip.from;
    const t = flip.to;
    const spec = (fr: Frame, offset = 0): PageSpec => ({
      global: fr.left + offset,
      cursor: fr.cursor,
      ix: fr.ix,
    });
    const none: PageSpec = { global: blank, cursor: null, ix: t.ix };
    if (span === 2) {
      return flip.dir === 1
        ? { l: spec(f), r: spec(t, 1) }
        : { l: spec(t), r: spec(f, 1) };
    }
    return { l: spec(flip.dir === 1 ? t : f), r: none };
  })();

  const sheet = (side: Side, spec: PageSpec | null) => (
    <div
      className={`sp-sheet sp-sheet--${side}`}
      data-testid={`book-page-${side}`}
    >
      {page(
        spec ?? {
          global: side === 'left' ? left : left + 1,
          cursor: state.cursor,
          ix,
        },
        side,
        spec === null,
      )}
    </div>
  );

  const onClick = (e: React.MouseEvent): void => {
    const sent = (e.target as HTMLElement).closest<HTMLElement>('[data-first]');
    const pg = sent?.closest<HTMLElement>('[data-page]');
    if (sent && pg && !window.getSelection()?.toString()) {
      onPickWord(Number(pg.dataset['page']) - 1, Number(sent.dataset['first']));
    }
  };

  return (
    <div
      className="sp-spread"
      data-span={span}
      data-dim={dim}
      lang={lang || undefined}
      style={style}
      onClick={onClick}
    >
      {sheet('left', under?.l ?? null)}
      {span === 2 ? sheet('right', under?.r ?? null) : null}
      <span className="sp-ribbon" aria-hidden="true" />
      {flip ? (
        <Leaf
          key={flip.id}
          flip={flip}
          span={span}
          page={page}
          onDone={() => setFlip(null)}
        />
      ) : null}
    </div>
  );
}

interface LeafProps {
  flip: Flip;
  span: 1 | 2;
  page: (spec: PageSpec, side: Side, main: boolean) => React.ReactNode;
  onDone: () => void;
}

function Leaf({ flip, span, page, onDone }: LeafProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { dir, from, to } = flip;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') {
      onDone();
      return;
    }
    const keys: Keyframe[] =
      span === 2
        ? [
            { transform: `rotateY(0deg)` },
            { transform: `rotateY(${dir === 1 ? -180 : 180}deg)` },
          ]
        : dir === 1
          ? [
              { transform: 'rotateY(0deg)', opacity: 1 },
              { transform: 'rotateY(-100deg)', opacity: 0 },
            ]
          : [
              { transform: 'rotateY(-100deg)', opacity: 0 },
              { transform: 'rotateY(0deg)', opacity: 1 },
            ];
    const anim = el.animate(keys, {
      duration: FLIP_MS,
      easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)',
      fill: 'forwards',
    });
    anim.onfinish = onDone;
    anim.oncancel = onDone;
    return () => {
      anim.onfinish = null;
      anim.oncancel = null;
      anim.cancel();
    };
    // the leaf is keyed per turn; it animates once
  }, []);

  // Which pages ride on the leaf (front = what is lifted, back = what lands).
  const of = (fr: Frame, offset = 0): PageSpec => ({
    global: fr.left + offset,
    cursor: fr.cursor,
    ix: fr.ix,
  });
  const front =
    span === 2
      ? dir === 1
        ? page(of(from, 1), 'right', false)
        : page(of(from), 'left', false)
      : page(of(dir === 1 ? from : to), 'left', false);
  const back =
    span === 2
      ? dir === 1
        ? page(of(to), 'left', false)
        : page(of(to, 1), 'right', false)
      : page(of(to), 'left', false);

  const column = span === 2 && dir === 1 ? 'right' : 'left';
  return (
    <div
      className={`sp-leaf sp-leaf--${column} sp-leaf--${dir === 1 ? 'fwd' : 'back'}`}
      ref={ref}
      aria-hidden="true"
      data-testid="book-leaf"
    >
      <div className="sp-face sp-face--front">{front}</div>
      <div className="sp-face sp-face--back">{back}</div>
    </div>
  );
}
