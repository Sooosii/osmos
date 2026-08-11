import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * Güvenlik kapıları — hesaplar turunun sonunda kondu.
 *
 * Buradaki her sınama, **sessizce** kaybolabilecek bir kararı tutuyor.
 * Ortak yanları şu: hiçbiri kırıldığında site çalışmayı bırakmaz. Yetki
 * denetimi düşen bir eylem yine çalışır — yalnızca yanlış kişi için de
 * çalışır. Sızan bir e-posta adresi sayfayı bozmaz. Bu yüzden derleme,
 * lint ve göz bunları yakalamıyor; sınama yakalıyor.
 */

/**
 * ⚠️ **Satır sonları normalize ediliyor ve bu şart.**
 *
 * Bu dosyadaki bazı sınamalar kaynağı satır satır ayrıştırıyor (`\n}\n` gibi
 * sınırlar arıyor). Git, Windows'ta çalışma kopyasını CRLF ile yazıyor;
 * ayrıştırma sessizce boş dönüyor ve sınama **ortama göre** sonuç veriyordu:
 * CI'da (Linux, LF) yeşil, geliştirme makinesinde kırmızı.
 *
 * Bu, kırılmasından daha kötü bir durum: yeşil geçen bir güvenlik sınaması,
 * hiç olmayan bir sınamadan daha tehlikeli çünkü güven veriyor. Ölçüldü ve
 * master'a alındıktan hemen sonra yakalandı.
 */
function read(path: string): string {
  return readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
}

describe('server action yetkileri', () => {
  const source = read('src/app/[lang]/actions.ts');

  test('her eylem ilk isi olarak oturumu dogruluyor', () => {
    /*
      ⚠️ Next'in kimlik kılavuzunun kuralı: Server Action'lar herkese açık
      uçlardır. "Düğme görünmüyor" bir koruma değil — istemci paketini okuyan
      biri eylemi doğrudan çağırabilir.
    */
    const actions = source.match(/export async function (\w+)/g) ?? [];
    expect(actions.length).toBeGreaterThan(0);

    for (const action of actions) {
      const name = action.replace('export async function ', '');
      const body = source.slice(source.indexOf(action));
      const upToNext = body.slice(0, body.indexOf('\n}\n') + 1);
      expect(upToNext, `${name}: currentViewer() çağrısı yok`).toContain('await currentViewer()');
      expect(upToNext, `${name}: yetkisizlik reddedilmiyor`).toContain("error: 'unauthorized'");
    }
  });

  test('hicbir eylem kullanici kimligini disaridan almiyor', () => {
    /*
      ⚠️ `userId` parametresi olsaydı "başkasının profilini düzenle" tek bir
      istek olurdu. Kimlik yalnızca oturumdan geliyor.
    */
    const signatures = source.match(/export async function \w+\([^)]*\)/gs) ?? [];
    for (const signature of signatures) {
      expect(signature.toLowerCase(), signature).not.toMatch(/userid|user_id/);
    }
  });

  test('tek bir use server dosyasi var', () => {
    /*
      Eylemler tek dosyada toplanıyor ki yukarıdaki iki sınama hepsini
      görebilsin. Yeni bir `'use server'` dosyası açılırsa denetimsiz kalır.
    */
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name) && read(full).startsWith("'use server'")) {
          found.push(full);
        }
      }
    };
    walk('src');
    expect(found).toEqual(['src/app/[lang]/actions.ts']);
  });
});

describe('disari sizan veri', () => {
  const dal = read('src/lib/dal.ts');

  test('erisim katmani e-posta okumuyor', () => {
    /*
      ⚠️ DTO kuralı: dışarı yalnızca gerekli alanlar. E-posta adresi profil
      sayfasına, paylaşım kartına ya da istemci paketine hiçbir yoldan
      çıkmamalı — sızması sessiz olur ve geri alınamaz.
    */
    expect(dal).not.toMatch(/schema\.user\.email/);
    expect(dal).not.toMatch(/\bemail\b\s*:/);
  });

  test('gizli profil null donuyor, "gizli" sayfasi degil', () => {
    /*
      "Bu kullanıcı profilini gizlemiş" demek, kullanıcının var olduğunu
      söylemektir — gizlemenin amacı tam olarak bunu söylememek.
    */
    expect(dal).toContain('found.hidden');
    expect(dal).toMatch(/if \(!found\?\.username \|\| found\.hidden\) return null/);
  });

  test('gizli profilin paylasim karti da uretilmiyor', () => {
    /*
      Kart ayrı bir rota; profil 404 dönerken kartın çizilmesi, gizlenmiş bir
      profilin varlığını paylaşım önizlemesinden sızdırırdı.
    */
    const card = read('src/app/[lang]/u/[username]/opengraph-image.tsx');
    expect(card).toContain('if (!profile)');
  });

  test('gizli profilin rafi, raporu ve raporun karti da acilmiyor', () => {
    /*
      ⚠️ Raflar ve burun raporu **iki yeni herkese açık adres** ve bir kart
      daha açtı; üçü de gizli profilin varlığını sızdırabilecek yeni yüzey.
      Kart 404 veremiyor, o yüzden düz siyah kare basıyor — olmayan
      kullanıcıyla gizli kullanıcı ayırt edilemiyor.
    */
    expect(read('src/app/[lang]/u/[username]/shelf/page.tsx')).toContain(
      'if (!profile) notFound()',
    );
    expect(read('src/app/[lang]/u/[username]/nose/page.tsx')).toContain('if (!nose) notFound()');
    expect(read('src/app/[lang]/u/[username]/nose/opengraph-image.tsx')).toContain(
      'if (!nose?.report)',
    );

    /*
      Üçü de gizliliği tek bir yerden devralıyor: `publicNose` kendi sorgusunu
      açmıyor, `publicProfile`ı çağırıyor. Ayrı bir sorgu açsaydı `hidden`
      denetimini bir gün orada unutmak mümkün olurdu.
    */
    expect(dal).toMatch(/publicNose[\s\S]{0,600}await publicProfile\(username\)/);
  });

  test('istemciye inen parfum karti yalniz cizim alanlarini tasiyor', () => {
    /* Ayrıntı `perfume-cards.test.ts`te; burada yalnızca varlığı hatırlatılıyor. */
    expect(read('src/lib/perfume-cards.ts')).toContain('search');
  });
});

describe('kimlik kurulumu', () => {
  const auth = read('src/lib/auth.ts');

  test('e-posta dogrulamasi zorunlu', () => {
    /*
      ⚠️ Kapalıyken herkes başkasının e-postasıyla hesap açabilir ve adresin
      sahibi durumu ancak profilini birinin aldığını görünce anlar.
    */
    expect(auth).toMatch(/requireEmailVerification:\s*true/);
  });

  test('hiz siniri acik', () => {
    /* Giriş uçları herkese açık ve şifre denemesi ucuz. */
    expect(auth).toMatch(/rateLimit:\s*\{[\s\S]*?enabled:\s*true/);
  });

  test('guvenilir kaynaklar tanimli', () => {
    /* Liste boşken CSRF koruması gevşiyor. */
    expect(auth).toContain('trustedOrigins');
  });

  test('sifre en az sekiz karakter', () => {
    expect(auth).toMatch(/minPasswordLength:\s*8/);
  });

  test('google profil fotografi alinmiyor', () => {
    /*
      "Sitede hiç fotoğraf yok" sözü README'de, duyuru metinlerinde ve Show HN
      kancasında yazılı. Eşleme açılırsa fotoğraf sessizce veriye girer.
    */
    expect(auth).toContain('mapProfileToUser');
    const map = auth.slice(auth.indexOf('mapProfileToUser'), auth.indexOf('mapProfileToUser') + 220);
    expect(map).not.toContain('image');
    expect(map).not.toContain('picture');
  });

  test('gizli anahtarlar koda gomulmemis', () => {
    for (const path of ['src/lib/auth.ts', 'src/lib/mail.ts', 'src/db/index.ts']) {
      const source = read(path);
      expect(source, path).not.toMatch(/re_[A-Za-z0-9]{16}/);
      expect(source, path).not.toMatch(/postgres(ql)?:\/\/[^'"\s]+/);
      expect(source, path).not.toMatch(/npg_[A-Za-z0-9]{10}/);
    }
  });
});

describe('posta', () => {
  const mail = read('src/lib/mail.ts');

  test('uretimde anahtar yoksa sessizce yutulmuyor', () => {
    /*
      ⚠️ Sessiz başarı en kötü seçenek: kayıt olan kişi hiç gelmeyecek bir
      mektubu bekler ve bizim haberimiz olmaz.
    */
    expect(mail).toMatch(/NODE_ENV === 'production'/);
    expect(mail).toMatch(/throw new Error\('RESEND_API_KEY/);
  });

  test('hata govdesi loglanmiyor', () => {
    /* Gövdede adres ve tek kullanımlık bağlantı var. */
    expect(mail).not.toMatch(/console\.(log|error)\([^)]*response/);
  });

  test('sunucuya kilitli', () => {
    expect(mail.startsWith("import 'server-only';")).toBe(true);
  });
});
