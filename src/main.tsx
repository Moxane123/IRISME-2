// Ensure compatibility with older third-party polyfills in strict sandboxed iframe contexts
(() => {
  try {
    const props = ['fetch', 'Headers', 'Request', 'Response', 'DOMException'] as const;
    props.forEach((prop) => {
      try {
        let currentVal = (window as any)[prop];
        const desc =
          Object.getOwnPropertyDescriptor(window, prop) ||
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), prop);
        if (desc && (!desc.writable && !desc.set)) {
          Object.defineProperty(window, prop, {
            get() {
              return currentVal;
            },
            set(v) {
              currentVal = v;
            },
            configurable: true,
            enumerable: true,
          });
        }
      } catch {}
    });
  } catch {}
})();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
