export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const stored = localStorage.getItem('theme');
              const root = document.documentElement;
              
              if (stored === 'light' || stored === 'dark') {
                root.classList.add(stored);
              } else {
                // Default to light mode
                root.classList.add('light');
              }
            } catch (e) {
              console.warn('Theme script error:', e);
            }
          })();
        `,
      }}
    />
  )
}
