const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'sha256-/H/6q5dKXGYO6GSU6qEp2Lkl7ctwQw60bw3al9+AwlI='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src https://www.threatrecon.io/_vercel/insights/view https://www.threatrecon.io/_vercel/insights/event https://www.threatrecon.io/_vercel/insights/session https://www.threatrecon.io/_vercel/speed-insights/vitals; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
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
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
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
