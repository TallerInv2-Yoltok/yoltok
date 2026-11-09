export type Leccion = { id: string; titulo: string; nivel: number; orden: number; activa: boolean }
export type Estado = 'completada' | 'actual' | 'bloqueada' | 'proximamente'

// Las lecciones se desbloquean en orden: la primera activa sin completar es la "actual".
export function estadosRuta(lecciones: Leccion[], completadas: Set<string>) {
  let hayActual = false
  return [...lecciones]
    .sort((a, b) => a.orden - b.orden)
    .map((l) => {
      let estado: Estado
      if (!l.activa) estado = 'proximamente'
      else if (completadas.has(l.id)) estado = 'completada'
      else if (!hayActual) { estado = 'actual'; hayActual = true }
      else estado = 'bloqueada'
      return { ...l, estado }
    })
}
