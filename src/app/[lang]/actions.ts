'use server';

import { getDb } from '@/db';
import { currentViewer, type Viewer } from '@/lib/dal';
import { allow } from '@/lib/rate-limit';
import { isShelfKind, type ShelfKind } from '@/lib/shelf';
import {
  appendToTopFour,
  claimUsername,
  deleteComposition,
  saveComposition,
  saveProfile,
  setShelf,
  writeSlot,
  type SaveError,
  type ShelfError,
} from '@/lib/profile-store';

/**
 * Server Action'lar — profilin bütün yazma yolları.
 *
 * ⚠️ **Her biri kendi yetkisini denetliyor ve bu pazarlık dışı.** Next'in
 * kimlik kılavuzunun kuralı: Server Action'lar herkese açık uçlar sayılır.
 * "Düğme görünmüyor" bir koruma değil — istemci kodunu okuyan biri eylemi
 * doğrudan çağırabilir. Denetim tek satır ve her fonksiyonun ilk satırı:
 * `currentViewer()`.
 *
 * ⚠️ Hiçbiri **kullanıcı kimliğini dışarıdan almıyor.** `userId` parametre
 * olsaydı "başkasının profilini düzenle" tek bir istek olurdu; kimlik
 * yalnızca oturumdan geliyor.
 *
 * ⚠️ **`revalidatePath` YOK ve olmayacak — kaldırıldı.** Başta hepsinde
 * `revalidatePath('/', 'layout')` vardı: tek bir Top 4 dokunuşu bütün rota
 * önbelleğini (402 sayfa) geçersiz kılıyordu. Telefonda ölçüldü — parfüm
 * seçildikten sonra ekran saniyelerce eski hâlinde kalıyor, altta
 * "Rendering…" dönüyordu. Veri anında yazılmıştı; geciken yalnızca ekrandı.
 *
 * Gereksizdi de: bu verinin göründüğü iki sayfa (`/settings`, `/u/[username]`)
 * zaten **dinamik**, yani önbelleğe hiç girmiyorlar. Tazelemeyi istemcideki
 * `router.refresh()` yapıyor. Bir gün bu veriyi gösteren STATİK bir sayfa
 * eklenirse (ör. profil dizini) o zaman hedefli bir `revalidatePath`
 * gerekir — geneli değil.
 */

/**
 * Yazma kapısı — oturum **ve** hız sınırı, tek yerde.
 *
 * ⚠️ Her eylem bunu çağırıyor. Denetimi eylem eylem tekrarlamak, bir gün
 * birinde unutulması demekti; buradaki tek satır bunu imkânsız kılıyor ve
 * `guvenlik.test.ts` her eylemin ilk işinin bu olduğunu tutuyor.
 *
 * Kimlik **kullanıcı kimliği**, IP değil: giriş yapmış birinin ne kadar
 * yazabileceğini sınırlıyoruz ve aynı evden giren iki kişi birbirini
 * kilitlememeli. Girişsizin buraya zaten erişimi yok.
 *
 * Sınır cömert (dakikada 30): gerçek bir kullanıcı Top 4'ünü düzenlerken ya
 * da raf işaretlerken bunu görmez. Durdurduğu şey saniyede yüzlerce yazan
 * bir betik.
 */
const WRITE_LIMIT = 30;
const WRITE_WINDOW = 60;

async function writeGate(): Promise<
  { ok: true; viewer: Viewer } | { ok: false; error: 'unauthorized' | 'tooFast' }
> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  const verdict = await allow('write', viewer.id, WRITE_LIMIT, WRITE_WINDOW);
  if (!verdict.ok) return { ok: false, error: 'tooFast' };

  return { ok: true, viewer };
}

type Gate = 'unauthorized' | 'tooFast';

type Result = { ok: true } | { ok: false; error: SaveError | Gate };

export async function chooseUsernameAction(raw: string): Promise<Result> {
  const gate = await writeGate();
  if (!gate.ok) return gate;

  const result = await claimUsername(getDb(), gate.viewer.id, raw);
  if (!result.ok) return result;

  return { ok: true };
}

export async function saveProfileAction(input: {
  bio?: string;
  hidden?: boolean;
  emailOptIn?: boolean;
}): Promise<Result> {
  const gate = await writeGate();
  if (!gate.ok) return gate;

  const result = await saveProfile(getDb(), gate.viewer.id, input);
  if (!result.ok) return result;

  return { ok: true };
}

type TopResult =
  | { ok: true; ids: readonly string[] }
  | { ok: false; error: 'tooMany' | 'duplicate' | 'unknown' | Gate };

export async function setSlotAction(slot: number, perfumeId: string | null): Promise<TopResult> {
  const gate = await writeGate();
  if (!gate.ok) return gate;

  return writeSlot(getDb(), gate.viewer.id, slot, perfumeId);
}

/**
 * Kompozisyonu kaydeder.
 *
 * ⚠️ Patron sınırı **burada değil, depoda** (`saveComposition`): kural veriye
 * en yakın yerde duruyor ve oradaki sınama onu tutuyor. Bu katmanın işi
 * yalnızca kimliği doğrulamak.
 */
export async function saveCompositionAction(input: {
  name: string;
  notes: readonly { noteId: string; tier: 'top' | 'heart' | 'base'; weight: number }[];
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const gate = await writeGate();
  if (!gate.ok) return gate;

  return saveComposition(getDb(), gate.viewer.id, input);
}

export async function deleteCompositionAction(slug: string): Promise<Result> {
  const gate = await writeGate();
  if (!gate.ok) return gate;

  await deleteComposition(getDb(), gate.viewer.id, slug);
  return { ok: true };
}

/**
 * Künyedeki üç raf düğmesinin yolu — koy, taşı ya da (`null`) çıkar.
 *
 * ⚠️ `kind` **burada da** doğrulanıyor, deponun kapısına güvenilerek
 * geçilmiyor. Tip imzası istemciyi bağlamıyor: bu bir Server Action, yani
 * herkese açık bir uç ve gövdeye ne geleceği belli olmaz.
 */
export async function setShelfAction(
  perfumeId: string,
  kind: ShelfKind | null,
): Promise<{ ok: true } | { ok: false; error: ShelfError | Gate }> {
  const gate = await writeGate();
  if (!gate.ok) return gate;
  if (kind !== null && !isShelfKind(kind)) return { ok: false, error: 'unknownKind' };

  return setShelf(getDb(), gate.viewer.id, perfumeId, kind);
}

/** Parfüm sayfasındaki düğmenin yolu. */
export async function addToTopFourAction(perfumeId: string): Promise<TopResult> {
  const gate = await writeGate();
  if (!gate.ok) return gate;

  return appendToTopFour(getDb(), gate.viewer.id, perfumeId);
}
