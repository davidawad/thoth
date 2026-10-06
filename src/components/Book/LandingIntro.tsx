export const PAPER_URL = 'https://arxiv.org/abs/1908.01699';
export const PAPER_TITLE =
  'Improved Rapid Serial Visual Presentation using Natural Language Processing';

/** What Thoth is and how to use it, plus the small credit line. */
export default function LandingIntro() {
  return (
    <section className="landing-about" aria-labelledby="landing-about-title">
      <h2 id="landing-about-title">Read faster, one word at a time</h2>
      <p>
        Thoth is a free, open source speed reader. It shows one word at a time
        in a fixed spot (RSVP, rapid serial visual presentation), so your eyes
        stay still instead of scanning along lines. The red letter in each word
        marks where to rest your eye.
      </p>
      <p>
        Paste text into the box above, drop a PDF or EPUB on the drop zone, or
        try a sample book. Drag the speed slider to set your pace (it starts at
        500 words per minute), and press Space or the Play button to start and
        pause. The difficulty heat map tints each sentence from green (easy) to
        red (hard), so you can see where to slow down; switch it off in
        Settings.
      </p>
      <p className="landing-credit">
        Inspired by Zethos and Spritz. It implements the ideas in the research
        paper{' '}
        <a href={PAPER_URL} target="_blank" rel="noreferrer">
          &ldquo;{PAPER_TITLE}&rdquo;
        </a>
        .
      </p>
    </section>
  );
}
