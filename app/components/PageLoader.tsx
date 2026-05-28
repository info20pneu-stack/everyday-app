'use client';

import { useState, useEffect } from 'react';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 950);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="page-loader">
      <div className="page-loader-logo">
        EVERY <span>DAY</span>
      </div>
    </div>
  );
}
