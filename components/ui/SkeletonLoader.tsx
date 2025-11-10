'use client';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', width, height, rounded = true }: SkeletonProps) {
  return (
    <div
      className={`bg-[#161b22] animate-pulse ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="siem-card p-4 space-y-3">
      <Skeleton height="20px" width="60%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="80%" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="siem-card p-4 space-y-3">
      <Skeleton height="24px" width="100%" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton height="20px" width="20%" />
          <Skeleton height="20px" width="30%" />
          <Skeleton height="20px" width="25%" />
          <Skeleton height="20px" width="25%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonIOCPanel() {
  return (
    <div className="siem-card p-4 space-y-4">
      <Skeleton height="24px" width="40%" />
      <div className="flex gap-2">
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
      </div>
      <Skeleton height="40px" width="100%" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="20px" width="70%" />
          <div className="flex gap-2">
            <Skeleton height="28px" width="100px" />
            <Skeleton height="28px" width="100px" />
            <Skeleton height="28px" width="100px" />
          </div>
        </div>
      ))}
    </div>
  );
}

