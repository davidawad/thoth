// Where the sibling tool and the project's reference material live. Thoth is a
// single-page app, so the footer's reference links point at the repo / paper
// rather than in-app pages.
export const SESHAT_URL = 'https://davidawad.gitlab.io/seshat/';

const REPO_URL = 'https://github.com/davidawad/thoth';

export const FOOTER_LINKS = [
  { label: 'Paper', href: 'https://arxiv.org/abs/1908.01699' },
  { label: 'Source', href: REPO_URL },
  { label: 'Release notes', href: `${REPO_URL}/blob/master/CHANGELOG.md` },
  { label: 'License', href: `${REPO_URL}/blob/master/LICENSE` },
  { label: 'Seshat (study)', href: SESHAT_URL },
] as const;
