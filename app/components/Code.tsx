import Prism from 'prismjs';
import 'prismjs/components/prism-powershell';
import React, { useEffect } from 'react';

export function Code({ code, language }: { code: string; language: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Prism.highlightAll();
    }
  }, []);

  return (
    <div className="Code">
      <pre>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
