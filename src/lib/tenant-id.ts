/**
 * Bu derlemenin kiracı kimliği — ortamı okuyan TEK yer.
 *
 * ⚠️ **Ayrı bir dosya olmasının sebebi bir ithal döngüsü.** `locale.ts` artık
 * varsayılan dili kiracıdan alıyor, ama `tenant.ts` de `locale.ts`ten `LOCALES`
 * okuyor. Ikisi birbirini değer olarak ithal etseydi çalışma zamanında döngü
 * kurulurdu. Ortam okuması buraya çıkınca zincir düzleşti:
 *
 *     tenant-id  ←  locale  ←  tenant
 *     tenant-id  ←  tenant
 *
 * Bu dosya hiçbir şey ithal etmiyor ve etmemeli.
 *
 * ⚠️ **Tam ad kalıp olarak yazılmak ZORUNDA.** Next `NEXT_PUBLIC_*`i derlemede
 * satıra gömüyor ve bunu metinsel eşleşmeyle yapıyor: `process.env[key]` ya da
 * yeniden adlandırılmış bir okuma gömülmez, tarayıcıda `undefined` çıkar ve
 * kiracı sitesi sessizce OSMOS'a döner.
 */
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT?.trim() || 'osmos';
