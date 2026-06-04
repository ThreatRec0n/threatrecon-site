const host = window.location.hostname;
const isLocal =
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '::1' ||
  host.endsWith('.local');

function appendScript(src, attrs = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  for (const [key, value] of Object.entries(attrs)) {
    script.dataset[key] = value;
  }
  document.head.appendChild(script);
}

if (!isLocal) {
  appendScript('/_vercel/insights/script.js', {
    sdkn: '@vercel/analytics/react',
    sdkv: '2.0.1',
  });
  appendScript('/_vercel/speed-insights/script.js', {
    sdkn: '@vercel/speed-insights/next',
    sdkv: '2.0.0',
  });
}
