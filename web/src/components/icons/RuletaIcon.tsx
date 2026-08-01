import React from 'react';

interface RuletaIconProps {
  size?: number | string;
  className?: string;
  color?: string;
}

export const RuletaIcon: React.FC<RuletaIconProps> = ({ size = 24, className = '', color = 'currentColor' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer wheel */}
      <circle cx="12" cy="12" r="10" />

      {/* 6 segments (3 lines intersecting at center) */}
      <path d="M12 2v20" />
      <path d="M3.34 17l17.32-10" />
      <path d="M3.34 7l17.32 10" />

      {/* Inner circle */}
      <circle cx="12" cy="12" r="3" fill={color} stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
    </svg>
  );
};
