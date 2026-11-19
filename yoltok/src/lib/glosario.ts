export type Palabra = { id: string; palabra_nahuat: string; traduccion_espanol: string; categoria_id: string | null; audio_path?: string | null }

// Valor del chip «Con audio» (los demás chips usan el id de la categoría).
export const CON_AUDIO = 'con-audio'

// Sin acentos ni mayúsculas, para que «nahuatl» encuentre «Náhuatl».
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function filtrarPalabras(palabras: Palabra[], texto: string, filtro: string | null) {
  const q = normalizar(texto)
  return palabras.filter(
    (p) =>
      (!filtro || (filtro === CON_AUDIO ? !!p.audio_path : p.categoria_id === filtro)) &&
      (!q || normalizar(p.palabra_nahuat).includes(q) || normalizar(p.traduccion_espanol).includes(q)),
  )
}

// Primero las palabras con audio o ya practicadas; dentro de cada grupo se conserva el orden recibido (alfabético).
export function ordenarPalabras(palabras: Palabra[], practicadas: Set<string>) {
  const destacada = (p: Palabra) => !!p.audio_path || practicadas.has(p.palabra_nahuat)
  return [...palabras.filter(destacada), ...palabras.filter((p) => !destacada(p))]
}
