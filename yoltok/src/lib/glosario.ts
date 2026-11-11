export type Palabra = { id: string; palabra_nahuat: string; traduccion_espanol: string; categoria_id: string | null; audio_path?: string | null }

// Sin acentos ni mayúsculas, para que «nahuatl» encuentre «Náhuatl».
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function filtrarPalabras(palabras: Palabra[], texto: string, categoria: string | null) {
  const q = normalizar(texto)
  return palabras.filter(
    (p) =>
      (!categoria || p.categoria_id === categoria) &&
      (!q || normalizar(p.palabra_nahuat).includes(q) || normalizar(p.traduccion_espanol).includes(q)),
  )
}
