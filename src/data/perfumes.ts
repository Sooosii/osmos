import type { Perfume } from './types';
import { hasNote } from './notes';
import { OSMOS_EXPANSION, OSMOS_LEGACY } from './osmos-catalog';
import { TENANT_CATALOGS } from './tenants/catalogs';
import { OSMOS_TENANT_ID } from './tenants/registry';
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

export const PERFUME_SPACES =
  TENANT.id === OSMOS_TENANT_ID
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
