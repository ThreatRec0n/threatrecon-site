"use client";

import { useEffect } from "react";
import { THREATRECON_BODY } from "./threatReconBody";

export default function ThreatReconClientApp() {
  useEffect(() => {
    document.documentElement.classList.add("tr-hydrated");

    if (!document.querySelector('script[data-tr-engine="1"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/assets/js/app.js";
      script.setAttribute("data-tr-engine", "1");
      document.body.appendChild(script);
    }
  }, []);

  // Static trusted application shell only. Never insert user-controlled analysis content here.
  return (
    <div
      id="tr-root"
      dangerouslySetInnerHTML={{ __html: THREATRECON_BODY }}
    />
  );
}
