import '../styles/globals.css';
import { useState } from 'react';

function Boundary({ children }) {
  const [err, setErr] = useState(null);
  if (err) return <div style={{color:'#fff',padding:24}}>System recovered from a render error. Try New Round.</div>;
  return <ErrorCatcher onError={setErr}>{children}</ErrorCatcher>;
}
function ErrorCatcher({ onError, children }) {
  try { return children; } catch (e) { console.error('render error', e); onError(e); return null; }
}
export default function App({ Component, pageProps }) { return <Boundary><Component {...pageProps} /></Boundary>; }

