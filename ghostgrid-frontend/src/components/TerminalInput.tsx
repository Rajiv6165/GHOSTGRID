interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TerminalInput({ 
  value, 
  onChange, 
  onEnter, 
  placeholder = '$ ',
  className = '' 
}: TerminalInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onEnter(value);
      onChange('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center ${className}`}>
      <span className="text-cyber-green mr-2">{placeholder}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="terminal-input flex-1 bg-transparent outline-none"
        autoFocus
      />
      <button type="submit" className="ml-2 text-cyber-blue hover:text-cyber-green">
        ↵
      </button>
    </form>
  );
}