'use server';

import { revalidatePath } from 'next/cache';
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
 */

type Result = { ok: true } | { ok: false; error: SaveError | 'unauthorized' };

export async function chooseUsernameAction(raw: string): Promise<Result> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  const result = await claimUsername(getDb(), viewer.id, raw);
  if (!result.ok) return result;

  revalidatePath('/', 'layout');
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

  revalidatePath('/', 'layout');
  return { ok: true };
}

type TopResult =
  | { ok: true; ids: readonly string[] }
  | { ok: false; error: 'tooMany' | 'duplicate' | 'unknown' | 'unauthorized' };

export async function setSlotAction(slot: number, perfumeId: string | null): Promise<TopResult> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  const result = await writeSlot(getDb(), viewer.id, slot, perfumeId);
  if (result.ok) revalidatePath('/', 'layout');
  return result;
}

/** Parfüm sayfasındaki düğmenin yolu. */
export async function addToTopFourAction(perfumeId: string): Promise<TopResult> {
  const viewer = await currentViewer();
  if (!viewer) return { ok: false, error: 'unauthorized' };

  const result = await appendToTopFour(getDb(), viewer.id, perfumeId);
  if (result.ok) revalidatePath('/', 'layout');
  return result;
}
