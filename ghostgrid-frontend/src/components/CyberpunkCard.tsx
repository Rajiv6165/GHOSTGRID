interface CyberpunkCardProps {
  children: React.ReactNode;
  className?: string;
}

export function CyberpunkCard({ children, className = '' }: CyberpunkCardProps) {
  return (
    <div className={`cyber-card p-6 rounded-lg border ${className}`}>
      {children}
    </div>
  );
}