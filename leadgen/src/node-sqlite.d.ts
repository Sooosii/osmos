/**
 * `node:sqlite` için yerel tip bildirimi.
 *
 * ⚠️ Neden burada: bu modül Node 22.5 ile geldi, deponun `@types/node`u ise
 * v20. Kod ÇALIŞIYOR (Node'un kendi gömülü sürücüsü), yalnız `tsc` modülü
 * tanımıyor ve on beş satır gürültü üretiyor.
 *
 * Alternatif `leadgen`e `@types/node` eklemekti; o da bu projenin tek
 * gerçek özelliğini — hiç `npm install` istememesini — bozardı. Bildirim
 * bilerek DAR: yalnız burada kullanılan yüzey yazılı. Yeni bir API
 * gerekirse buraya eklenecek, gövdesi tahmin edilmeyecek.
 */
declare module 'node:sqlite' {
  type SQLDegeri = string | number | bigint | null | Uint8Array;

  class StatementSync {
    run(...params: readonly SQLDegeri[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: readonly SQLDegeri[]): unknown;
    all(...params: readonly SQLDegeri[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { readonly open?: boolean; readonly readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
