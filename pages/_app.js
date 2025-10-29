import '../styles/globals.css';
import Head from 'next/head';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Cache-Control" content="no-store" />
        <title>ThreatRecon.io SOC Simulator</title>
      </Head>
      {/* Tone.js for audio effects */}
      <Script src="https://unpkg.com/tone@14.8.49/build/Tone.js" strategy="lazyOnload" />
      <Component {...pageProps} />
    </>
  );
}

