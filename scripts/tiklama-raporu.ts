import { TENANT_ID } from '../src/lib/tenant-id';
import { PERFUMES } from '../src/data/perfumes';
import { ayDilimi, ayinTiklamalari, type TiklamaSatiri } from '../src/lib/tiklama-store';

/**
 * Aylık turnike raporu — müşteriye gidecek rakam.
 *
 * Kullanım:
 *
 *     NEXT_PUBLIC_TENANT=nischengold npx tsx scripts/tiklama-raporu.ts 2026-08
 *
 * ⚠️ **Kiracı argümandan DEĞİL, `NEXT_PUBLIC_TENANT`ten okunuyor.** Sebebi
 * ikisinin ayrılabilir olmaması: parfüm adları katalogdan geliyor ve katalogu
 * seçen şey aynı değişken. Kiracı argüman olsaydı `nischengold` sayaçlarını
 * OSMOS katalogunun adlarıyla basmak mümkün olurdu — müşteriye onda olmayan
 * parfümlerin adıyla rapor gitmesi demek. Tek kaynak, çelişki yok.
 *
 * ⚠️ **Rakam bir TABAN ve rapor bunu söylüyor.** Sayım tarayıcıdaki
 * `sendBeacon`la başlıyor; engelleyicisi olan ziyaretçi sayılmıyor. Gerçek
 * sayı bundan yüksek. Müşteriye "en az" demek, sonradan düzeltilecek bir
 * iddiadan iyidir — ve bu deponun duran kuralı.
 */

function kullanim(mesaj: string): never {
  console.error(`\n${mesaj}\n`);
  console.error('Kullanım:');
  console.error('  NEXT_PUBLIC_TENANT=<kiracı> npx tsx scripts/tiklama-raporu.ts <YYYY-MM>');
  console.error('');
  console.error(`Şu anki NEXT_PUBLIC_TENANT: ${TENANT_ID}`);
  process.exit(1);
}

const ay = process.argv[2] ?? ayDilimi(new Date());
if (!/^\d{4}-\d{2}$/.test(ay)) kullanim(`Ay biçimi YYYY-MM olmalı, gelen: "${ay}"`);

/** Kimlik → okunabilir ad. Katalogdan düşmüş parfüm kimliğiyle basılıyor. */
function baslik(perfumeId: string): string {
  const perfume = PERFUMES.find((p) => p.id === perfumeId);
  if (!perfume) return `${perfumeId} (katalogda yok)`;
  return `${perfume.brand} — ${perfume.name}`;
}

function toplam(satirlar: readonly TiklamaSatiri[]): number {
  return satirlar.reduce((sum, satir) => sum + satir.sayi, 0);
}

/** Aynı parfümün farklı satıcıları tek satırda toplanıyor — müşteriyi ilgilendiren parfüm. */
function parfumBazinda(satirlar: readonly TiklamaSatiri[]): readonly (readonly [string, number])[] {
  const toplamlar = new Map<string, number>();
  for (const satir of satirlar) {
    toplamlar.set(satir.perfumeId, (toplamlar.get(satir.perfumeId) ?? 0) + satir.sayi);
  }
  return [...toplamlar.entries()].toSorted((a, b) => b[1] - a[1]);
}

async function main(): Promise<void> {
  const satirlar = await ayinTiklamalari(TENANT_ID, ay);
  const gecis = toplam(satirlar);

  console.log(`\n=== ${TENANT_ID} · ${ay} ===\n`);

  if (gecis === 0) {
    console.log('Bu ay hiç çıkış tıklaması sayılmadı.');
    console.log('');
    console.log('⚠️ Sıfır iki farklı şey olabilir ve ayırt edilmeden rapor gönderilmemeli:');
    console.log('   · gerçekten kimse tıklamadı (site yeni, ziyaretçi yok)');
    console.log('   · sayaç ulaşmıyor (KV değişkenleri kiracı Vercel projesinde eksik)');
    console.log('   Ayırmanın yolu: siteye gir, bir satıcı bağlantısına bas, bu raporu tekrar çalıştır.');
    console.log('');
    return;
  }

  console.log(`Toplam çıkış tıklaması: ${gecis}\n`);

  console.log('Parfüm bazında:');
  for (const [perfumeId, sayi] of parfumBazinda(satirlar)) {
    console.log(`  ${String(sayi).padStart(4)}  ${baslik(perfumeId)}`);
  }

  console.log('\nSatıcı kırılımı:');
  for (const satir of satirlar) {
    console.log(`  ${String(satir.sayi).padStart(4)}  ${baslik(satir.perfumeId)} → ${satir.retailer}`);
  }

  const enler = parfumBazinda(satirlar).slice(0, 3).map(([id]) => baslik(id));

  console.log('\n--- müşteriye gidecek metin (EN) ---\n');
  console.log(`Your scent map sent at least ${gecis} visitors to your product pages in ${ay}.`);
  console.log(`The fragrances they came from most: ${enler.join(', ')}.`);
  console.log('');
  console.log('"At least" is literal: the count comes from the browser, so visitors with an');
  console.log('ad blocker are not counted. The real number is higher than this one.');

  console.log('\n--- müşteriye gidecek metin (DE) ---\n');
  console.log(`Ihre Duftkarte hat im ${ay} mindestens ${gecis} Besucher auf Ihre Produktseiten geführt.`);
  console.log(`Am häufigsten von diesen Düften aus: ${enler.join(', ')}.`);
  console.log('');
  console.log('„Mindestens" ist wörtlich gemeint: gezählt wird im Browser, Besucher mit');
  console.log('Werbeblocker werden nicht erfasst. Die tatsächliche Zahl liegt höher.');
  console.log('');
}

main().catch((error: unknown) => {
  console.error('Rapor üretilemedi:', error);
  process.exit(1);
});
