"use client";

import { useEffect } from "react";
import { THREATRECON_BODY } from "./threatReconBody";

export default function ThreatReconClientApp() {
  useEffect(() => {
    document.documentElement.classList.add("tr-hydrated");

    const existing = document.querySelector('script[data-threatrecon-app="true"]');
    if (!existing) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/assets/js/app.js";
      script.dataset.threatreconApp = "true";
      script.onload = () => {
        if (window.bootThreatRecon) window.bootThreatRecon();
      };
      document.body.appendChild(script);
    } else if (window.bootThreatRecon) {
      window.bootThreatRecon();
    }
  }, []);

  // Static trusted application shell only. Never insert user-controlled analysis content here.
  return (
    <div
      id="threatrecon-client-shell"
      dangerouslySetInnerHTML={{ __html: THREATRECON_BODY }}
    />
  );
}
