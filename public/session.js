(function(){
  const sid = location.pathname.split('/').pop();
  const urlParams = new URLSearchParams(location.search);
  const isFac = (urlParams.get('role') === 'facilitator');

  const joinCard = document.getElementById('joinCard');
  const facCard  = document.getElementById('facCard');
  const timeline = document.getElementById('timeline');
  const joinBtn  = document.getElementById('joinBtn');
  const nameEl   = document.getElementById('name');
  const roleEl   = document.getElementById('role');
  const joinStatus = document.getElementById('joinStatus');

  const sendInject = document.getElementById('sendInject');
  const injSeverity = document.getElementById('injSeverity');
  const injMessage  = document.getElementById('injMessage');
  const endSession  = document.getElementById('endSession');
  const genReport   = document.getElementById('genReport');

  const decCard   = document.getElementById('decCard');
  const decMessage= document.getElementById('decMessage');
  const decStatus = document.getElementById('decStatus');
  const sendDecision = document.getElementById('sendDecision');

  if (isFac) {
    joinCard.style.display = 'none';
    facCard.style.display = 'block';
  }

  function renderEvent(ev) {
    const d = document.createElement('div');
    d.className = `event ${ev.type}`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const ts = new Date(ev.ts || Date.now()).toLocaleTimeString();
    meta.textContent = `[${ts}] ${ev.type.toUpperCase()} ${ev.severity ? '('+ev.severity+')' : ''} ${ev.author ? '— ' + ev.author : ''}`;
    const msg = document.createElement('div');
    msg.textContent = ev.message;
    d.appendChild(meta);
    d.appendChild(msg);
    timeline.appendChild(d);
    timeline.scrollTop = timeline.scrollHeight;
  }

  async function bootstrap() {
    const r = await fetch(`/api/sessions/${sid}`);
    if (!r.ok) { alert('Session not found'); return; }
    const data = await r.json();
    data.events.forEach(renderEvent);

    const es = new EventSource(`/api/sessions/${sid}/stream`);
    es.addEventListener('message', (e)=>{
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'bootstrap') {
          (msg.events||[]).forEach(renderEvent);
        } else if (msg.type === 'event') {
          renderEvent(msg.event);
        } else if (msg.type === 'participant_joined') {
          renderEvent({ type:'system', message: `${msg.participant.name} joined as ${msg.participant.role}`, ts: Date.now() });
        } else if (msg.type === 'system' && msg.message === 'ended') {
          renderEvent({ type:'system', message: 'Session ended', ts: Date.now() });
          sendInject?.setAttribute('disabled','disabled');
          sendDecision?.setAttribute('disabled','disabled');
          endSession?.setAttribute('disabled','disabled');
        }
      } catch {}
    });
    es.onerror = ()=>{ /* auto reconnect by browser */ };
  }

  // Join
  joinBtn?.addEventListener('click', async ()=>{
    const name = (nameEl.value||'').trim();
    const role = (roleEl.value||'').trim();
    if (!name || !role) { joinStatus.textContent='Enter name & role.'; return; }
    const r = await fetch(`/api/sessions/${sid}/participants`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, role })
    });
    if (!r.ok) { joinStatus.textContent='Join failed.'; return; }
    joinStatus.textContent='Joined.';
    joinCard.style.display='none';
  });

  // Facilitator: inject
  sendInject?.addEventListener('click', async ()=>{
    const message = (injMessage.value||'').trim();
    if(!message) return;
    await fetch(`/api/sessions/${sid}/injects`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ severity: injSeverity.value, message })
    });
    injMessage.value='';
  });

  // End session
  endSession?.addEventListener('click', async ()=>{
    await fetch(`/api/sessions/${sid}/end`, { method:'POST' });
  });

  // Update report link
  genReport.href = `/example-aar.pdf.html?sessionId=${encodeURIComponent(sid)}`;

  // Decision
  sendDecision?.addEventListener('click', async ()=>{
    const message = (decMessage.value||'').trim();
    if(!message) { decStatus.textContent='Type your decision.'; return; }
    await fetch(`/api/sessions/${sid}/decisions`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message })
    });
    decMessage.value='';
    decStatus.textContent='Submitted.';
    setTimeout(()=>decStatus.textContent='', 1200);
  });

  bootstrap();

  // If the session was opened from the home page as facilitator, auto-hide join.
  if (isFac) {
    decStatus.textContent = 'Facilitator mode.';
    setTimeout(()=>decStatus.textContent='', 1200);
  }
})();

