import React from 'react';

const MonumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-amber-400"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M4.5 2.25a.75.75 0 000 1.5v16.5h-.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5h-.75V3.75a.75.75 0 000-1.5h-15zM9 6a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm-.75 3.75A.75.75 0 019 9h1.5a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM9 12a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm3.75-5.25A.75.75 0 0113.5 6h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12.75 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zM13.5 12a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 01.75-.75v-.008a.75.75 0 01-.75-.75h-.008A.75.75 0 0113.5 12z"
      clipRule="evenodd"
    />
  </svg>
);

export default MonumentIcon;
