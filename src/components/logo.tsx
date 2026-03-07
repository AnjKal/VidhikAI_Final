import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="200"
    height="150"
    viewBox="0 0 200 150"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fill="#FF6A0D"
      d="M20 10 L100 130 L180 10 L155 10 L100 80 L45 10 Z"
    />
    <g
      stroke="#FF6A0D"
      strokeWidth="4"
      fill="none"
    >
      <path d="M50 30 H 150" />
      <path d="M100 30 V 50" />
      <path d="M60 30 V 50" />
      <path d="M40 70 A 20 20 0 0 1 80 70" strokeWidth="3" />
      <path d="M140 30 V 50" />
      <path d="M120 70 A 20 20 0 0 1 160 70" strokeWidth="3" />
    </g>
  </svg>
);

export default Logo;
