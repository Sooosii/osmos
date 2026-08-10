/**
 * Sitenin zemini — JavaScript'in görebildiği hâli.
 *
 * ⚠️ **İkizi `globals.css`teki `--background`.** CSS değişkenini sunucuda
 * okuyamıyoruz; telefon tarayıcısının çubuğunu boyayan `themeColor` ise bir
 * üstveri alanı, yani JavaScript değeri olmak zorunda. İki yer değişirken
 * birlikte değişmeli — ayrışırlarsa telefonda sayfanın üstünde başka renkte
 * bir şerit belirir ve bunu masaüstünde kimse görmez.
 *
 * `logo.ts`teki `LOGO_BACKGROUND` da aynı siyah ama oradan çağrılmıyor: o,
 * simgenin kendi zemini ve simge sitenin dışında da (sekme, ana ekran) tek
 * başına duruyor.
 */
export const SITE_BACKGROUND = '#050507';
