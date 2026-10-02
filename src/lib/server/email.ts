import "server-only";

/**
 * İşlemsel e-posta (şifre sıfırlama vb.). Resend'in HTTP API'si doğrudan
 * `fetch` ile çağrılır; ek paket yok, Cloudflare'de de aynı çalışır.
 *
 * `RESEND_API_KEY` ve `EMAIL_FROM` tanımlı değilse:
 * - geliştirmede e-posta gönderilmez, içerik terminale yazılır;
 * - üretimde hata fırlatılır (kullanıcıya sessizce "gönderildi" denmesin).
 *
 * Not: Resend, alan adı doğrulanmadan yalnızca hesap sahibine gönderebilir.
 * Müşterilere e-posta gidebilmesi için kendi alan adımız gerekiyor.
 */

type Mail = { to: string; subject: string; html: string; text: string };

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(mail: Mail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `\n[e-posta · geliştirme] Kime: ${mail.to}\nKonu: ${mail.subject}\n${mail.text}\n`,
      );
      return;
    }
    throw new Error("E-posta servisi yapılandırılmamış (RESEND_API_KEY / EMAIL_FROM).");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, ...mail }),
  });

  if (!res.ok) {
    throw new Error(`E-posta gönderilemedi (${res.status}): ${await res.text()}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function resetPasswordEmail(firstName: string, url: string): Omit<Mail, "to"> {
  const hello = firstName ? `Merhaba ${firstName},` : "Merhaba,";
  return {
    subject: "452WEAR · Şifre sıfırlama",
    text: `${hello}\n\nŞifreni sıfırlamak için bu bağlantıyı aç (1 saat geçerli):\n${url}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.\n\n452WEAR`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
<p>${escapeHtml(hello)}</p>
<p>Şifreni sıfırlamak için aşağıdaki düğmeye bas. Bağlantı 1 saat geçerli.</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Şifremi sıfırla</a></p>
<p style="color:#666;font-size:13px">Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
<p style="font-weight:700">452WEAR</p>
</div>`,
  };
}
