'use server';

import { getDb } from '@/db';
import { currentViewer } from '@/lib/dal';
import {
  appendToTopFour,
  claimUsername,
  saveProfile,
  writeSlot,
  type SaveError,
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

type Result = { ok: true } | { ok: false; error: SaveError | 'unauthorized' };

export async function chooseUsernameAction(raw: string): Promise<Result> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  const result = await claimUsername(getDb(), viewer.id, raw);
  if (!result.ok) return result;

  return { ok: true };
}

export async function saveProfileAction(input: {
  bio?: string;
  hidden?: boolean;
  emailOptIn?: boolean;
}): Promise<Result> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  const result = await saveProfile(getDb(), viewer.id, input);
  if (!result.ok) return result;

  return { ok: true };
}

type TopResult =
  | { ok: true; ids: readonly string[] }
  | { ok: false; error: 'tooMany' | 'duplicate' | 'unknown' | 'unauthorized' };

export async function setSlotAction(slot: number, perfumeId: string | null): Promise<TopResult> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  return writeSlot(getDb(), viewer.id, slot, perfumeId);
}

/** Parfüm sayfasındaki düğmenin yolu. */
export async function addToTopFourAction(perfumeId: string): Promise<TopResult> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  return appendToTopFour(getDb(), viewer.id, perfumeId);
}
