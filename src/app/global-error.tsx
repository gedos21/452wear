"use client";

/**
 * Kök şablonun kendisi çökerse burası çizilir; bu yüzden kendi <html>/<body>
 * etiketlerini taşır ve site bileşenlerine bağlı değildir. Stil, globals.css
 * yüklenmemiş olabileceği için satır içi verilir.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f5",
          color: "#1a1a1a",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>
            452WEAR
          </h1>
          <p style={{ marginTop: "1rem", color: "#5a5754" }}>
            Beklenmeyen bir hata oluştu.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "3rem",
              padding: "0 1.75rem",
              borderRadius: "9999px",
              border: 0,
              background: "#1a1a1a",
              color: "#faf9f5",
              fontSize: "0.8125rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
