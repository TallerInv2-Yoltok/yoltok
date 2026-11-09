// Ejecutar con: node src/lib/ruta.test.ts
import { estadosRuta, type Leccion } from './ruta.ts'

const l = (id: string, orden: number, activa = true): Leccion => ({ id, titulo: id, nivel: 1, orden, activa })

function revisar(ls: Leccion[], hechas: string[], esperado: string[]) {
  const real = estadosRuta(ls, new Set(hechas)).map((x) => x.estado)
  if (JSON.stringify(real) !== JSON.stringify(esperado)) throw new Error(`Esperaba ${esperado}, salió ${real}`)
}

revisar([l('a', 1), l('b', 2), l('c', 3)], [], ['actual', 'bloqueada', 'bloqueada'])
revisar([l('a', 1), l('b', 2), l('c', 3)], ['a'], ['completada', 'actual', 'bloqueada'])
revisar([l('b', 2), l('a', 1)], ['a', 'b'], ['completada', 'completada'])
revisar([l('a', 1), l('b', 2, false)], ['a'], ['completada', 'proximamente'])
console.log('ruta.test.ts OK')
