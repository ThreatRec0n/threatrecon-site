import { THREATRECON_BODY } from './threatReconBody.js';

function bootEngine() {
  const existing = document.querySelector('script[data-threatrecon-app="true"]');
  if (existing) {
    if (window.bootThreatRecon) window.bootThreatRecon();
    return;
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.src = '/assets/js/app.js';
  script.dataset.threatreconApp = 'true';
  script.onload = () => {
    if (window.bootThreatRecon) window.bootThreatRecon();
  };
  document.body.appendChild(script);
}

function mountThreatRecon() {
  const mount = document.getElementById('client-app');
  if (!mount || document.getElementById('threatrecon-client-shell')) return;

  // Static trusted application shell only. Never insert user-controlled analysis content here.
  mount.innerHTML = `<div id="threatrecon-client-shell">${THREATRECON_BODY}</div>`;
  const fallback = document.getElementById('crawler-home');
  if (fallback) fallback.hidden = true;
  document.documentElement.classList.add('tr-hydrated');
  bootEngine();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountThreatRecon, { once: true });
} else {
  mountThreatRecon();
}
