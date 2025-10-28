# ThreatRecon Labs Backend Deployment (Render)

This service is the live-fire range controller. It:
- Hosts Socket.IO for attacker/defender sessions
- Tracks session state in memory
- Drives AI actions
- Generates timeline + AAR data back to the client

## Deploy on Render

1. Push this repo to GitHub (labs-migration branch is fine for now).

2. In Render:
   - Click "New +" -> "Web Service"
   - Connect this GitHub repo
   - When Render asks which directory:
     - Set Root Directory to `labs-backend`
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment Variable:
     - KEY: `PORT`
     - VALUE: `8080`  (Render will expose it publicly)

3. After deploy, Render will give you a public URL like:
   `https://threatrecon-labs-backend.onrender.com`

4. Set up a custom domain (optional but recommended):
   - Add `labs-api.threatrecon.io` in Render dashboard as a custom domain
   - Add a CNAME in your DNS:
     `labs-api.threatrecon.io` -> `threatrecon-labs-backend.onrender.com`

5. After DNS propagates, the browser client at https://threatrecon.io/labs.html can talk to
   `https://labs-api.threatrecon.io` over Socket.IO polling/websocket.

## Local test

```bash
cd labs-backend
npm install
PORT=8080 npm start

Then open DevTools Console on https://threatrecon.io/labs.html and run:
window.overrideLabsBackend("http://localhost:8080");

Then click "attacker" or "defender". You should see the terminal come alive.

