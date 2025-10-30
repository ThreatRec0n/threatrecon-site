export function safeDate(msOrIso) {
  const d = new Date(msOrIso);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function safeIso(msOrIso) {
  return safeDate(msOrIso).toISOString();
}


