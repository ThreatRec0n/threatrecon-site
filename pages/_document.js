import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Cache-Control" content="no-store" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
        <style jsx global>{`
          .pulse-glow {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          body {
            background-color: #030712;
            color: #e5e7eb;
            font-family: system-ui, -apple-system, sans-serif;
          }
        `}</style>
      </Head>
      <body className="bg-gray-950 text-gray-200 min-h-screen flex flex-col font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

