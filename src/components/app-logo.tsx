import React from 'react';

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <path
        d="M32 2C15.432 2 2 15.432 2 32s13.432 30 30 30 30-13.432 30-30S48.568 2 32 2zm0 54c-13.255 0-24-10.745-24-24S18.745 8 32 8s24 10.745 24 24-10.745 24-24 24z"
        fill="url(#logo-gradient)"
        fillOpacity="0.3"
      />
      <path
        d="M32 12c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20zm0 34c-7.732 0-14-6.268-14-14s6.268-14 14-14 14 6.268 14 14-6.268 14-14 14z"
        fill="url(#logo-gradient)"
        fillOpacity="0.6"
      />
      <path
        d="M32 22c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z"
        fill="url(#logo-gradient)"
      />
    </svg>
  );
};

export default AppLogo;
