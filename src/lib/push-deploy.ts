interface LivePerfume {
  readonly id: string;
  readonly name: string;
}

interface WaitUntilPerfumeIsLiveOptions {
  readonly baseUrl: string;
  readonly perfume: LivePerfume;
  readonly attempts?: number;
  readonly intervalMs?: number;
  readonly requestTimeoutMs?: number;
  readonly fetcher?: typeof fetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/** Prevents a push from linking to the previous deployment's 404 page. */
export async function waitUntilPerfumeIsLive({
  baseUrl,
  perfume,
  attempts = 30,
  intervalMs = 10_000,
  requestTimeoutMs = 5_000,
  fetcher = fetch,
  sleep = wait,
}: WaitUntilPerfumeIsLiveOptions): Promise<void> {
  if (attempts < 1) throw new Error('Canlı yayın deneme sayısı en az 1 olmalı');
  const url = `${baseUrl.replace(/\/+$/, '')}/perfume/${perfume.id}`;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetcher(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      const body = await response.text();
      if (response.status === 200 && (body.includes(perfume.id) || body.includes(perfume.name))) return;
    } catch {
      // Deployment may be between revisions; the bounded loop owns the retry.
    }

    if (attempt < attempts) await sleep(intervalMs);
  }

  throw new Error(`Canlı yayın ${perfume.id} kaydını göstermedi`);
}
