/**
 * Overlay layout: no nav, no header, transparent background.
 * Optimized for OBS browser source.
 */
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent !important; overflow: hidden; }
        `}</style>
      </head>
      <body style={{ background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
