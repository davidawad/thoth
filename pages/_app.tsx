import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../src/App.css';
import '../src/components/Reader/Reader.css';
import '../src/components/ModalWrapper/ModalWrapper.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
