import React from 'react';
import type { AppProps } from 'next/app';
// Self-hosted fonts (OFL), same faces as Seshat: Atkinson Hyperlegible for the
// material being read; Fraunces / Newsreader / IBM Plex Mono for the chrome.
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '../styles/globals.css';
import '../src/App.css';
import '../src/components/SiteChrome/SiteChrome.css';
import '../src/components/palette/palette.css';
import '../src/components/Reader/Reader.css';
import '../src/components/ModalWrapper/ModalWrapper.css';
import '../src/components/Book/Book.css';
import '../src/components/Book/Spread.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
