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
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.classList.add(prefersDark ? 'dark' : 'light');
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
