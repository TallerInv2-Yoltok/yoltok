export type Ejercicio = {
  id: string
  tipo: string
  instruccion: string
  opciones: unknown
  respuesta_correcta: string | null
  puntos: number
  orden: number
  palabra: Vocablo | null
}

export type Vocablo = { palabra_nahuat: string; traduccion_espanol: string; audio_path?: string | null; descripcion?: string | null }
export type Par = { nahuat: string; espanol: string; audio_path?: string | null; descripcion?: string | null }
export type Contenido =
  | { clase: 'opciones'; opciones: string[]; correcta: string }
  | { clase: 'pares'; pares: Par[] }

// opcion_multiple y comprension_auditiva comparten forma: lista de opciones + respuesta.
export function contenido(e: Ejercicio): Contenido {
  if (e.tipo === 'emparejar_pares') return { clase: 'pares', pares: (e.opciones as { pares: Par[] }).pares }
  return { clase: 'opciones', opciones: e.opciones as string[], correcta: e.respuesta_correcta ?? '' }
}

// Palabras de la lección en el orden de los ejercicios, sin repetir: las ligadas por palabra_id y las de opciones.pares
// (Ajayo' solo llega en los pares). Si una palabra aparece dos veces, se completa el audio/descripción que falte.
export function vocabulario(ejercicios: Ejercicio[]): Vocablo[] {
  const mapa = new Map<string, Vocablo>()
  for (const e of [...ejercicios].sort((a, b) => a.orden - b.orden)) {
    const c = contenido(e)
    const deLosPares = c.clase === 'pares'
      ? c.pares.map((p) => ({ palabra_nahuat: p.nahuat, traduccion_espanol: p.espanol, audio_path: p.audio_path, descripcion: p.descripcion }))
      : []
    for (const v of [...(e.palabra ? [e.palabra] : []), ...deLosPares]) {
      const previo = mapa.get(v.palabra_nahuat)
      mapa.set(v.palabra_nahuat, previo ? { ...previo, audio_path: previo.audio_path || v.audio_path, descripcion: previo.descripcion || v.descripcion } : v)
    }
  }
  return [...mapa.values()]
}

export type Sesion = {
  cola: string[] // ids pendientes; el primero es el ejercicio en pantalla
  fallados: string[] // fallados alguna vez (ya no dan XP)
  aciertos: number // correctos al primer intento
  intentos: number
  xp: number
}

export const nuevaSesion = (ejercicios: Ejercicio[]): Sesion => ({
  cola: [...ejercicios].sort((a, b) => a.orden - b.orden).map((e) => e.id),
  fallados: [],
  aciertos: 0,
  intentos: 0,
  xp: 0,
})

// Correcto: sale de la cola. Incorrecto: va al final ("se agregará al repaso final de la lección").
export function responder(s: Sesion, e: Ejercicio, correcto: boolean): Sesion {
  const [actual, ...resto] = s.cola
  if (actual !== e.id) throw new Error('El ejercicio respondido no es el actual')
  const primeraVez = !s.fallados.includes(e.id)
  if (correcto) {
    return {
      ...s,
      cola: resto,
      intentos: s.intentos + 1,
      aciertos: s.aciertos + (primeraVez ? 1 : 0),
      xp: s.xp + (primeraVez ? e.puntos : 0),
    }
  }
  return { ...s, cola: [...resto, e.id], intentos: s.intentos + 1, fallados: primeraVez ? [...s.fallados, e.id] : s.fallados }
}

export function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
