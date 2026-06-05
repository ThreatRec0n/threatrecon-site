const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'sha256-RbcaP8HiZdP/O9Jeem4kGPEZmpsGiT7x69dg3mgyDwg=' 'sha256-bNjKW5uWg/vBe6bHfNlE1nVuCluQ7iLn5tzMy6Hk5LA=' 'sha256-6hi1xK2Zv+ZQmYqbdMosLKB1ilUTLLTmoXh0v/0Ugp4=' 'sha256-ILe2inAfkhVEWkAj3dPl+3okv4dFHfwm3V61ArOLym8=' 'sha256-+mKfnYIiPVpGrxfeFCcKAgh4DSEvcXf8R7V2uGoM5Xs=' 'sha256-23gZxYmspPJYXTyrDxKYGj3+o5aZu8kViHwSURUPYsw=' 'sha256-FMjOy4ibwQBAeAEXxUqnQwsEGhnr4f2v9CM8faNAfuM='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src https://www.threatrecon.io/_vercel/insights/view https://www.threatrecon.io/_vercel/insights/event https://www.threatrecon.io/_vercel/insights/session https://www.threatrecon.io/_vercel/speed-insights/vitals; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "no-referrer",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
