export function createAudioContext(){
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  return AC ? new AC() : null;
}


