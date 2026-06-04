# Security Model — ThreatRecon.io

ThreatRecon.io is a browser based static analysis and analyst training platform.

## Current Design

- Files are processed locally in the browser during local analysis workflows.
- The site does not require a login.
- The site does not require account creation.
- The site does not intentionally collect submitted samples.
- The analyzer does not execute submitted content.
- The current design reduces exposure by avoiding server side sample upload workflows.

## Telemetry

ThreatRecon.io uses Vercel Web Analytics and Speed Insights for site usage and performance metrics. These telemetry tools are not used to collect submitted samples, decoded payloads, or generated reports.

## External Links

External sandbox and reputation links are manual analyst pivots only. They open only when selected by the user.

## Rendering Safety

User-controlled analyzer output is escaped before HTML rendering or written as text. Decoded content is displayed as inert text and is not executed.

## Content Security Policy

The active CSP is defined in `next.config.js`. `connect-src` remains limited to the exact Vercel Analytics and Speed Insights endpoints currently used by the site.

## Responsible Use

ThreatRecon.io is built for defensive security education, malware triage practice, and analyst workflow training. Users are responsible for using the platform legally and ethically.
