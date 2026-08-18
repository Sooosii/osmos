import type { Perfume } from './types';
import { hasNote } from './notes';
import { OSMOS_EXPANSION, OSMOS_LEGACY } from './osmos-catalog';
import { TENANT_CATALOGS } from './tenants/catalogs';
import { activeTenant } from '@/lib/tenant';
import {
  buildPerfumeSpaces,
  buildTenantSpaces,
  findPerfumeSpaceId,
  type PerfumeSpace,
} from './perfume-spaces';

/**
 * Parfüm veritabanı — toplayıcı.
 *
 * Notalarda olduğu gibi veri gruplara bölündü (`perfume-sets/`); 52 parfüm tek
 * dosyada 800 satırı aşıyor. Bu modül onları birleştirip tek giriş noktası
 * sunuyor, böylece `@/data/perfumes` yolu ve `PERFUMES` / `getPerfume`
 * sözleşmesi değişmiyor.
 *
 * ⚠️ **B2B kiracı dikişi tam olarak burası ve yalnızca burası.** 42 dosya
 * `@/data/perfumes`ten okuyor; hepsi bu tek giriş noktasından geçtiği için
 * kiracının katalogunu bağlamak o 42 dosyanın hiçbirine dokunmayı
 * gerektirmiyor. Aşağıdaki dallanma değişirse bütün site başka bir katalog
 * gösterir — dikişin dar olması bu yüzden değerli.
 *
 * ⚠️ **Kalibrasyon bedava geliyor ve bu bir kaza değil.** `buildMarks` kaydıraç
 * eksenlerini `feelUniverse`e göre yayıyor ve ana sayfa oraya `PERFUMES`i
 * geçiyor. Kiracıda `PERFUMES` zaten yalnızca onun katalogu olduğu için eksenler
 * kiracının kendi evreninde normalleşiyor — istenen davranış bu. Ana sitenin
 * global cetveli kiracıya uygulansaydı, hep şarkiyat satan bir dükkanın bütün
 * parfümleri haritanın bir köşesinde kümelenirdi.
 */
const TENANT = activeTenant();

function tenantCatalog(id: string): readonly Perfume[] {
  const catalog = TENANT_CATALOGS[id];
  if (!catalog) {
    throw new Error(`Kiracının katalogu tanımlı değil: ${id}`);
  }
  return catalog;
}

/*
  ⚠️ **Dallanma `TENANT.id` ile DEĞİL, `process.env.NEXT_PUBLIC_TENANT` metniyle
  yazılıyor — ve bu bir üslup tercihi değil, güvenlik gereği.**

  Ölçüldü (2026-08-17, Nischengold yayına verilmeden önceki denetim): koşul bir
  değişken üzerinden yazıldığında paketleyici hangi dalın öleceğini kanıtlayamaz
  ve **ikisini birden** pakete koyar. Sonucu şuydu: kiracı derlemesinde
  `/_next/static/chunks/000-*.js` HTTP 200 dönüyordu, 100 KB'tı ve içinde
  OSMOS'un 154 kaydı — elle yazılmış küratör cümleleri iki dilde — ve öbür
  kiracının katalogu duruyordu. Müşterinin alan adından, tek istekle, herkese
  açık.

  Next `NEXT_PUBLIC_*`i derlemede satıra gömüyor (tam ad kalıbıyla,
  `lib/tenant.ts`teki uyarının aynısı), yani aşağıdaki koşul kiracı
  derlemesinde sabit `false`a düşüyor ve OSMOS katalogu ölü dalla birlikte
  eleniyor. Ana derlemede tersi oluyor: kiracı katalogları osmos.me'nin
  paketinden çıkıyor.

  ⚠️ Metin sabiti `OSMOS_TENANT_ID` yerine elle yazılmış durumda çünkü katlama
  sabitin çözülmesine bağlı kalmasın; ikisinin aynı kaldığını `tenant.test.ts`
  tutuyor. `kiraci-sizinti.test.ts` de kaynak tarafından aynı kapıyı bekliyor.
*/
const OSMOS_DERLEMESI =
  !process.env.NEXT_PUBLIC_TENANT || process.env.NEXT_PUBLIC_TENANT === 'osmos';

export const PERFUME_SPACES = OSMOS_DERLEMESI
  ? buildPerfumeSpaces(OSMOS_LEGACY, OSMOS_EXPANSION)
  : buildTenantSpaces(tenantCatalog(TENANT.id));

export const PERFUMES: readonly Perfume[] = PERFUME_SPACES.flatMap((space) => space.perfumes);

const PERFUME_BY_ID = new Map<string, Perfume>();
for (const perfume of PERFUMES) {
  // Aynı kimlik iki grupta birden tanımlanırsa sessizce biri kazanır ve uzayda
  // bir nokta eksik çıkar. Erken ve gürültülü patlamak daha iyi.
  if (PERFUME_BY_ID.has(perfume.id)) {
    throw new Error(`Parfüm kimliği iki kez tanımlanmış: ${perfume.id}`);
  }
  PERFUME_BY_ID.set(perfume.id, perfume);

  // Nota kimliği yanlış yazılırsa `getNote` ancak o parfüm ekrana geldiğinde
  // patlıyordu — 52 parfümde bir harf hatası fark edilmeden kalabilir.
  // Yükleme anında hepsi birden denetleniyor.
  for (const entry of perfume.notes) {
    if (!hasNote(entry.noteId)) {
      throw new Error(`${perfume.id} bilinmeyen notaya işaret ediyor: ${entry.noteId}`);
    }
  }
}

/**
 * Kimlik veride var mı — `hasNote`in parfüm karşılığı.
 *
 * Kullanıcıdan gelen kimliği doğrulayan her kapı (Top 4, raflar) buradan
 * geçiyor. Ayrı ayrı `PERFUMES.some(...)` yazmak hem üç kopya hem her
 * çağrıda 52'lik bir tarama demekti; harita zaten kurulu.
 */
export function hasPerfume(id: string): boolean {
  return PERFUME_BY_ID.has(id);
}

export function getPerfume(id: string): Perfume {
  const perfume = PERFUME_BY_ID.get(id);
  if (!perfume) {
    throw new Error(`Bilinmeyen parfüm: ${id}`);
  }
  return perfume;
}

/**
 * Kimliklerden parfümlere — bilinmeyeni sessizce atlayarak, sıra korunarak.
 *
 * ⚠️ **Sessiz atlama bilinçli ve `signatureOf`ten devralındı.** Veriden
 * çıkarılmış bir parfüm kimsenin profilini çökertmemeli; hepsi bilinmiyorsa
 * dönen liste boş ve imzayı çizen taraf zaten "imza yok" diyor.
 *
 * ⚠️ **Bu çözüm SUNUCUDA yapılıyor ve öyle kalmalı.** `signatureOf` eskiden
 * kimlik alıp katalogda kendisi arıyordu; o yüzden imzayı çizen üç istemci
 * bileşeni katalogu tarayıcıya çekiyordu (bkz. `kiraci-sizinti.test.ts`).
 * Artık çözüm sayfada, istemciye yalnızca dört parfüm iniyor.
 */
export function perfumesOf(ids: readonly string[]): readonly Perfume[] {
  return ids
    .map((id) => PERFUME_BY_ID.get(id))
    .filter((perfume): perfume is Perfume => perfume !== undefined);
}

export function getPerfumeSpaceId(id: string): number {
  return getPerfumeSpace(id).id;
}

export function getPerfumeSpace(id: string): PerfumeSpace {
  const spaceId = findPerfumeSpaceId(PERFUME_SPACES, id);
  const space = PERFUME_SPACES.find((candidate) => candidate.id === spaceId);
  if (!space) {
    throw new Error(`Bilinmeyen parfüm: ${id}`);
  }
  return space;
}
