export const MAX_DISPLAY_SIZE = 8; // max length in characters before separating a word.
export const LARGEST_WORD_SIZE = 10; // number of spaces before / after displayhead
export const DEFAULT_READING_SPEED = 500; // in words-per-minute (wpm)
const SPACE_KEY = 32; // key code for space bar
export const PLAYPAUSE_KEY = SPACE_KEY; // key code for play/pause, space bar by default.
export const START_COLOR = '#FF0000';
export const STOP_COLOR = '#0000FF';

// non-breaking space used to pad the reel / surrounding words in the reader
export const UNICODE_WHITESPACE = '\u00a0';

// Speed Writing (paper \u00a78.4): opt-in text simplification before reading.
// localStorage key used to persist the user's opt-in choice across sessions.
export const SPEED_WRITING_STORAGE_KEY = 'thoth-speed-writing-enabled';

// accepted upload MIME types (single source of truth for file-type checks)
export const PDF_MIME_TYPE = 'application/pdf';
export const EPUB_MIME_TYPE = 'application/epub+zip';
// generous cap for an uploaded book/PDF - large enough for any real e-book,
// small enough to reject something dropped in by mistake before it ever
// reaches pdfjs-dist/epub.js.
export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

// ---------------------------------------------------------------------------
// Sample books - shipped under public/sample-books/ so someone can try the
// reader without hunting down their own file. Each one was individually
// checked for a clean public-domain provenance before being added here (not
// just "the author died a long time ago" - a modern translation/edition can
// carry its own copyright even when the underlying work doesn't). All three
// are Project Gutenberg releases; `source` links to the original Gutenberg
// ebook page for attribution.
export interface SampleBook {
  id: string;
  title: string;
  author: string;
  translator?: string;
  filename: string; // relative to /public/sample-books/
  source: string;
}

export const SAMPLE_BOOKS: SampleBook[] = [
  {
    id: 'phaedo',
    title: 'Phaedo',
    author: 'Plato',
    translator: 'Benjamin Jowett',
    filename: 'phaedo-plato.epub',
    source: 'https://www.gutenberg.org/ebooks/1658',
  },
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    filename: 'meditations-marcus-aurelius.epub',
    source: 'https://www.gutenberg.org/ebooks/2680',
  },
  {
    id: 'zarathustra',
    title: 'Thus Spake Zarathustra',
    author: 'Friedrich Nietzsche',
    translator: 'Thomas Common',
    filename: 'thus-spake-zarathustra-nietzsche.epub',
    source: 'https://www.gutenberg.org/ebooks/1998',
  },
];
export const DEFAULT_AGE = 12;
export const MAX_AGE = 22;
export const AGE_SCALE = 6;

// --- Per-word difficulty scaling (replaces the old fixed 1.5x "unfamiliar
// word" multiplier flagged as a known weakness in the paper's Future Work,
// §8.1 - "Thoth uses fixed assumptions about how much longer to display a
// word that is unfamiliar"). See TextParsingTools.wordDifficultyMultiplier.
// Tunable here rather than hardcoded inside the timing logic.
export const DIFFICULTY_BASE_MULTIPLIER = 1; // multiplier floor - easy, short, familiar words are unaffected
export const DIFFICULTY_SYLLABLE_WEIGHT = 0.15; // extra multiplier per syllable beyond the word's first
export const DIFFICULTY_UNFAMILIAR_WEIGHT = 0.5; // extra multiplier when a word isn't in the dale-chall familiar list
export const DIFFICULTY_HARD_WEIGHT = 0.35; // additional multiplier stacked on when a word is ALSO absent from the (easier) spache list
export const MAX_DIFFICULTY_MULTIPLIER = 3; // cap so pathologically long/rare words don't stall playback

// --- Selectable readability/difficulty metric (paper §6/§8.2 future work:
// Dale-Chall was hardcoded as the default and other formulas were computed
// but never exposed for the reader to choose between).
export const DEFAULT_READABILITY_METRIC = 'average';
export const READABILITY_METRIC_STORAGE_KEY = 'thoth.readabilityMetric';

// --- Lexical density (Ure, 1971): proportion of content words (nouns,
// verbs, adjectives, adverbs) to total words, computed for free from
// compromise's POS tagging. Higher density correlates with denser, harder
// text. These bounds map a density ratio onto the same age scale as the
// other formulas.
export const MIN_LEXICAL_DENSITY = 0.35;
export const MAX_LEXICAL_DENSITY = 0.75;
export const LEXICAL_DENSITY_MIN_AGE = 8;
export const LEXICAL_DENSITY_MAX_AGE = 20;

// ---------------------------------------------------------------------------
// Theming (daisyui `data-theme`) - see src/components/SettingsPanel/SettingsPanel.js
// ---------------------------------------------------------------------------

// localStorage key used to persist the user's chosen theme across visits.
export const THEME_STORAGE_KEY = 'thoth-theme';

// Fallback theme used when nothing is stored yet and the OS has no preference.
export const DEFAULT_THEME = 'light';

// Themes available in the selector. "light" and "dark" are daisyui's built-in
// themes (see tailwind.config.js); "sepia" is a custom warm/paper-like theme
// defined alongside them, tuned for long reading sessions.
export interface ThemeOption {
  id: string;
  label: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'sepia', label: 'Sepia (reading)' },
];

// ---------------------------------------------------------------------------
// Typography attribution + legibility research citations, rendered in
// SettingsPanel so the sources backing the typography choices are visible.
// ---------------------------------------------------------------------------

export interface FontAttribution {
  name: string;
  designer: string;
  source: string;
  url: string;
  license: string;
}

export const FONT_ATTRIBUTION: FontAttribution = {
  name: 'Atkinson Hyperlegible',
  designer:
    'Applied Design Works, commissioned by the Braille Institute of America',
  source: 'Google Fonts',
  url: 'https://fonts.google.com/specimen/Atkinson+Hyperlegible',
  license: 'SIL Open Font License 1.1 (free for commercial & personal use)',
};

export interface LegibilityReference {
  citation: string;
  url: string;
  note: string;
}

// Papers + standards consulted for the legibility pass. `note` records what,
// if anything, was actually changed in the app as a result, or why a finding
// was left as a judgment call rather than implemented.
export const LEGIBILITY_REFERENCES: LegibilityReference[] = [
  {
    citation:
      'Wallace, S. et al. (2022). Towards Individuated Reading Experiences: Different Fonts Increase Reading Speed for Different Individuals. ACM TOCHI 29(4).',
    url: 'https://dl.acm.org/doi/full/10.1145/3502222',
    note: 'Optimal font varies by individual (avg. 117 wpm gap between worst/best font per reader); full personalization is out of scope for this pass, noted as a follow-up idea.',
  },
  {
    citation:
      'Wallace, S. et al. (2020). Accelerating Adult Readers with Typeface. CHI EA ’20.',
    url: 'https://dl.acm.org/doi/pdf/10.1145/3334480.3382985',
    note: 'Preferred font is rarely the fastest-reading font for a given person - same individuation caveat as above.',
  },
  {
    citation:
      'Kadner, F. et al. (2021). AdaptiFont: Increasing Individuals’ Reading Speed with a Generative Font Model and Bayesian Optimization. CHI ’21 (free preprint: arXiv:2104.10741).',
    url: 'https://dl.acm.org/doi/fullHtml/10.1145/3411764.3445140',
    note: 'Proposes per-user adaptive font optimization; a good future direction, not implemented here (single fixed sitewide font per project scope).',
  },
  {
    citation:
      'Arditi, A. & Cho, J. (2005). Serifs and Font Legibility. Vision Research 45(23).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4612630/',
    note: 'Found no meaningful legibility difference from serifs themselves; letter spacing mattered more. Supports using a sans-serif with generous spacing (Atkinson Hyperlegible).',
  },
  {
    citation:
      'Dobres, J. et al. (2016). Utilising Psychophysical Techniques to Investigate the Effects of Age, Typeface Design, Size and Display Polarity on Glance Legibility. Ergonomics 60(6).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5213401/',
    note: 'Humanist typefaces with open letterforms beat geometric/grotesque ones, especially for older readers; positive polarity (dark-on-light) read ~39% faster than light-on-dark. Judgment call: dark theme is kept for user preference/eye comfort, but this is a documented tradeoff, not a legibility win.',
  },
  {
    citation:
      'Reimer, B. et al. (2014). Assessing the Impact of Typeface Design in a Text-Rich Automotive User Interface. Ergonomics 57(11).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4267594/',
    note: 'Same humanist-vs-grotesque result as Dobres 2016 in a different setting; Atkinson Hyperlegible’s open, distinct letterforms are consistent with this.',
  },
  {
    citation:
      'Vecino, S. et al. (2022). How Does Serif vs. Sans Serif Typeface Impact the Usability of e-Commerce Websites? PeerJ Computer Science 8:e1139.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9680897/',
    note: 'Found no measurable impact of serif vs. sans-serif on reading speed; only gender predicted preference. No action needed - reinforces that the serif/sans-serif choice is not a legibility-critical variable here.',
  },
  {
    citation:
      'Minakata, K. et al. (2023). The Effect of Serifs and Stroke Contrast on Low-Vision Reading. PMID 36563495.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36563495/',
    note: 'Uniform (low) stroke-width contrast helped low-vision readers most. Atkinson Hyperlegible was designed with low stroke contrast for this reason.',
  },
  {
    citation:
      'Kaspar, K. et al. (2015). The Effect of Serifs on the Evaluation of Scientific Abstracts. PMID 25704872.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25704872/',
    note: 'Sans-serif read faster but serif text was rated more favorably - a preference/perception effect, not a speed-reading concern for this app.',
  },
  {
    citation:
      'Beymer, D., Russell, D. & Orton, P. (2008). An Eye Tracking Study of How Font Size and Type Influence Online Reading. Proc. BCS HCI 2008.',
    url: 'https://dl.acm.org/doi/10.5555/1531826.1531831',
    note: 'Smaller fonts produced longer fixation durations; serif read marginally faster online but not significantly. Reinforces keeping body text at >=16px.',
  },
  {
    citation:
      'Gadhvi, M. et al. (2024). Font Matters: Deciphering the Impact of Font Types on Attention and Working Memory. Cureus 16(5).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11156575/',
    note: 'Serif fonts produced faster letter-cancellation (attention) times than sans-serif or script in this small study; comprehension/working-memory unaffected. Noted, not acted on (single sitewide sans-serif font is the project’s explicit scope).',
  },
  {
    citation:
      'A Review of Text Accessibility Standards, Guidelines, and Font Tool Limitations. ASSETS ’25.',
    url: 'https://dl.acm.org/doi/10.1145/3663547.3759692',
    note: 'Notes most accessibility guidelines (incl. WCAG) under-specify typography beyond color contrast, and that common guidance (e.g. left-alignment) is Western/Latin-script-centric. Informed keeping this pass’s typography changes modest and documented rather than over-prescriptive.',
  },
  {
    citation: 'W3C WCAG 2.1 Success Criterion 1.4.12: Text Spacing.',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing',
    note: 'Requires no loss of content when line-height >=1.5x, paragraph spacing >=2x, letter spacing >=0.12x, and word spacing >=0.16x font size. Implemented: 1.5 line-height on body copy, no fixed-height clipping on reading text.',
  },
  {
    citation: 'Section508.gov: Fonts & Typography guidance.',
    url: 'https://www.section508.gov/develop/fonts-typography/',
    note: 'Recommends sans-serif for body text, 11-12pt/15-16px minimum, and >=4.5:1 contrast. Implemented: Atkinson Hyperlegible sans-serif at 1rem (16px = 12pt), themes chosen for AA contrast.',
  },
];
export const INTRO_TEXT = `Hello!

This is Thoth, an open source speed reading tool inspired by Zethos and Spritz ($3.5mil series A).

It combines a few different features of other powerful speed readers and lets you set options yourself.

It's free and open source on GitHub.  

All you have to do is paste in some text and you'll be breezing through it in no time.

Seek truth, but faster. Enjoy!

- David`;

// an excerpt from The Enchiridion : http://classics.mit.edu/Epictetus/epicench.html
// useful for testing.
export const EPICTETUS = `Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion, and, in a word, whatever are our own actions. Things not in our control are body, property, reputation, command, and, in one word, whatever are not our own actions. 

The things in our control are by nature free, unrestrained, unhindered; but those not in our control are weak, slavish, restrained, belonging to others. Remember, then, that if you suppose that things which are slavish by nature are also free, and that what belongs to others is your own, then you will be hindered. You will lament, you will be disturbed, and you will find fault both with gods and men. But if you suppose that only to be your own which is your own, and what belongs to others such as it really is, then no one will ever compel you or restrain you. Further, you will find fault with no one or accuse no one. You will do nothing against your will. No one will hurt you, you will have no enemies, and you not be harmed. 

Aiming therefore at such great things, remember that you must not allow yourself to be carried, even with a slight tendency, towards the attainment of lesser things. Instead, you must entirely quit some things and for the present postpone the rest. But if you would both have these great things, along with power and riches, then you will not gain even the latter, because you aim at the former too: but you will absolutely fail of the former, by which alone happiness and freedom are achieved. 

Work, therefore to be able to say to every harsh appearance, "You are but an appearance, and not absolutely the thing you appear to be." And then examine it by those rules which you have, and first, and chiefly, by this: whether it concerns the things which are in our own control, or those which are not; and, if it concerns anything not in our control, be prepared to say that it is nothing to you. 

2. Remember that following desire promises the attainment of that of which you are desirous; and aversion promises the avoiding that to which you are averse. However, he who fails to obtain the object of his desire is disappointed, and he who incurs the object of his aversion wretched. If, then, you confine your aversion to those objects only which are contrary to the natural use of your faculties, which you have in your own control, you will never incur anything to which you are averse. But if you are averse to sickness, or death, or poverty, you will be wretched. Remove aversion, then, from all things that are not in our control, and transfer it to things contrary to the nature of what is in our control. But, for the present, totally suppress desire: for, if you desire any of the things which are not in your own control, you must necessarily be disappointed; and of those which are, and which it would be laudable to desire, nothing is yet in your possession. Use only the appropriate actions of pursuit and avoidance; and even these lightly, and with gentleness and reservation. 

3. With regard to whatever objects give you delight, are useful, or are deeply loved, remember to tell yourself of what general nature they are, beginning from the most insignificant things. If, for example, you are fond of a specific ceramic cup, remind yourself that it is only ceramic cups in general of which you are fond. Then, if it breaks, you will not be disturbed. If you kiss your child, or your wife, say that you only kiss things which are human, and thus you will not be disturbed if either of them dies. 

4. When you are going about any action, remind yourself what nature the action is. If you are going to bathe, picture to yourself the things which usually happen in the bath: some people splash the water, some push, some use abusive language, and others steal. Thus you will more safely go about this action if you say to yourself, "I will now go bathe, and keep my own mind in a state conformable to nature." And in the same manner with regard to every other action. For thus, if any hindrance arises in bathing, you will have it ready to say, "It was not only to bathe that I desired, but to keep my mind in a state conformable to nature; and I will not keep it if I am bothered at things that happen. 

5. Men are disturbed, not by things, but by the principles and notions which they form concerning things. Death, for instance, is not terrible, else it would have appeared so to Socrates. But the terror consists in our notion of death that it is terrible. When therefore we are hindered, or disturbed, or grieved, let us never attribute it to others, but to ourselves; that is, to our own principles. An uninstructed person will lay the fault of his own bad condition upon others. Someone just starting instruction will lay the fault on himself. Some who is perfectly instructed will place blame neither on others nor on himself. 

6. Don't be prideful with any excellence that is not your own. If a horse should be prideful and say, " I am handsome," it would be supportable. But when you are prideful, and say, " I have a handsome horse," know that you are proud of what is, in fact, only the good of the horse. What, then, is your own? Only your reaction to the appearances of things. Thus, when you behave conformably to nature in reaction to how things appear, you will be proud with reason; for you will take pride in some good of your own. 

7. Consider when, on a voyage, your ship is anchored; if you go on shore to get water you may along the way amuse yourself with picking up a shellfish, or an onion. However, your thoughts and continual attention ought to be bent towards the ship, waiting for the captain to call on board; you must then immediately leave all these things, otherwise you will be thrown into the ship, bound neck and feet like a sheep. So it is with life. If, instead of an onion or a shellfish, you are given a wife or child, that is fine. But if the captain calls, you must run to the ship, leaving them, and regarding none of them. But if you are old, never go far from the ship: lest, when you are called, you should be unable to come in time.
`;
