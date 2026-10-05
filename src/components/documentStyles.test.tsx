// @vitest-environment node
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import styled from 'styled-components';
import AppDocument from '../../pages/_document';

const Box = styled.div`
  color: red;
`;

// Regression (found by Bombadil): without a styled-components ServerStyleSheet
// in _document, SSR emitted no styled CSS and the client generated different
// class names, causing a React hydration mismatch (console error) on load.
describe('pages/_document styled-components SSR', () => {
  it('collects styled-components styles into the document head', async () => {
    const ctx = {
      defaultGetInitialProps: async (c: { renderPage: () => unknown }) =>
        c.renderPage(),
      renderPage: (options?: {
        enhanceApp?: (
          App: React.ComponentType<Record<string, unknown>>,
        ) => React.ComponentType<Record<string, unknown>>;
      }) => {
        const App = () => <Box>hi</Box>;
        const Enhanced = options?.enhanceApp ? options.enhanceApp(App) : App;
        return { html: renderToString(<Enhanced />), head: [] };
      },
    };

    const props = await AppDocument.getInitialProps(
      ctx as unknown as Parameters<typeof AppDocument.getInitialProps>[0],
    );

    const styles = renderToString(<>{props.styles}</>);
    expect(styles).toContain('data-styled');
    expect(styles).toContain('color:red');
  });
});
