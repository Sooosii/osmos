/**
 * Sözlükteki marka adını topluca değiştiren saf geçiş.
 *
 * ⚠️ **Neden `site.name`i ezmek yetmiyor:** ekranda görünen marka yalnızca
 * çerçevede değil, yirmiden fazla BAŞLIK dizesinin içine gömülü —
 * `'${name} — ${brand} · OSMOS'`, `'Settings · OSMOS'`, `'← back to OSMOS'`.
 * Kiracı derlemesinde bunlar olduğu gibi kalıyordu ve sonuç gerçek tarayıcıda
 * görüldü: müşterinin parfüm sayfası sekmede **"Oud Ispahan — Dior · OSMOS"**
 * yazıyordu. Ekranda hiçbir yerde görünmediği için gözle bulunması imkansıza
 * yakındı; sekmede, yer iminde, arama sonucunda ve paylaşılan bağlantıda
 * görünürdü.
 *
 * ⚠️ **Dizeleri düz değiştirmek yetmez, çünkü başlıkların çoğu FONKSİYON**
 * (`(name, brand) => ...`). Bu yüzden geçiş fonksiyonları da sarıyor ve
 * DÖNÜŞLERİNİ değiştiriyor. Dize dönmeyen bir işlev varsa dokunulmadan
 * geçiyor.
 *
 * ⚠️ Ana sitede bu geçiş **hiç çalışmıyor** (`dict.ts` `isOsmos()` ile erken
 * dönüyor): OSMOS'un çıktısı birebir korunuyor.
 */
export function brandStrings<T>(value: T, from: string, to: string): T {
  if (typeof value === 'string') {
    return value.split(from).join(to) as T;
  }

  if (typeof value === 'function') {
    const fn = value as (...args: never[]) => unknown;
    return ((...args: never[]) => {
      const result = fn(...args);
      return typeof result === 'string' ? result.split(from).join(to) : result;
    }) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => brandStrings(item, from, to)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = brandStrings(item, from, to);
    }
    return out as T;
  }

  return value;
}
