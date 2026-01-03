export const SeshetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    {/* The Pylon Arch from your sketch */}
    <path d="M3 20V10C3 6 6 4 12 4s9 2 9 6v10" strokeLinecap="round" />
    {/* The Seven-Pointed Seshet Star */}
    <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    <path d="M12 7v10M8.5 8.5l7 7M15.5 8.5l-7 7M7 12h10" />
    {/* The Inverted Horns/Antenna */}
    <path d="M9 3.5c1 1 5 1 6 0" strokeLinecap="round" />
  </svg>
);