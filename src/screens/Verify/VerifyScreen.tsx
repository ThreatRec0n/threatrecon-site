import { useParams } from 'react-router-dom';

export function VerifyScreen() {
  const { id } = useParams();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-6 text-center font-mono text-sm text-ink-secondary">
      <p className="text-amber">ThreatRecon verification stub</p>
      <p className="mt-3 max-w-lg">
        Offline deployments cannot validate certificates centrally. Reference ID:{' '}
        <span className="text-ink-primary">{id}</span>
      </p>
    </div>
  );
}
