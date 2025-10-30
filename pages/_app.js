import Head from 'next/head';
import Script from 'next/script';
import ErrorBoundary from '../components/ErrorBoundary';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Cache-Control" content="no-store" />
        <title>ThreatRecon.io SOC Simulator</title>
      </Head>
      {/* Tone.js for audio effects */}
      <Script src="https://unpkg.com/tone@14.8.49/build/Tone.js" strategy="lazyOnload" />
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

