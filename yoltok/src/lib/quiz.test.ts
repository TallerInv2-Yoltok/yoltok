// Ejecutar con: node src/lib/quiz.test.ts
import { contenido, mezclar, nuevaSesion, responder, vocabulario, type Ejercicio } from './quiz.ts'

function igual(real: unknown, esperado: unknown, que: string) {
  if (JSON.stringify(real) !== JSON.stringify(esperado)) throw new Error(`${que}: esperaba ${JSON.stringify(esperado)}, salió ${JSON.stringify(real)}`)
}

const ej = (id: string, orden: number, puntos = 10): Ejercicio => ({
  id, tipo: 'opcion_multiple', instruccion: '', opciones: ['a', 'b'], respuesta_correcta: 'a', puntos, orden, palabra: null,
})
const a = ej('a', 1, 15)
const b = ej('b', 2, 20)

let s = nuevaSesion([b, a])
igual(s.cola, ['a', 'b'], 'ordena por orden')

s = responder(s, a, false) // falla a -> repaso al final
igual(s.cola, ['b', 'a'], 'fallado va al final')
s = responder(s, b, true)
s = responder(s, a, true) // acierta en el repaso: no da XP ni cuenta como acierto
igual([s.cola, s.aciertos, s.intentos, s.xp], [[], 1, 3, 20], 'resultado final')

let lanzo = false
try { responder(nuevaSesion([a, b]), b, true) } catch { lanzo = true }
igual(lanzo, true, 'rechaza responder un ejercicio que no es el actual')

igual(contenido({ ...a, tipo: 'emparejar_pares', opciones: { pares: [{ nahuat: 'x', espanol: 'y' }] } }).clase, 'pares', 'pares')
igual(contenido({ ...a, tipo: 'comprension_auditiva' }).clase, 'opciones', 'auditiva como opciones')
const pal = (n: string, audio: string | null = null) => ({ palabra_nahuat: n, traduccion_espanol: n + '-es', audio_path: audio })
const voc = vocabulario([
  { ...a, orden: 2, palabra: pal('Tago') },
  { ...a, orden: 1, palabra: pal('Ximotali') },
  { ...b, orden: 3, tipo: 'emparejar_pares', palabra: pal('Wewehcho'), opciones: { pares: [
    { nahuat: 'Ximotali', espanol: 'Siéntate', audio_path: 'x.mp3' },
    { nahuat: 'Ajayo’', espanol: 'Frijol', audio_path: 'ajayo_frijol.mp3', descripcion: 'd' },
  ] } },
])
igual(voc.map((v) => v.palabra_nahuat), ['Ximotali', 'Tago', 'Wewehcho', 'Ajayo’'], 'vocabulario: orden, pares incluidos, sin duplicados')
igual(voc[3].audio_path, 'ajayo_frijol.mp3', 'vocabulario: la palabra que solo viene en pares conserva su audio')
igual(voc[0].audio_path, 'x.mp3', 'vocabulario: completa el audio que faltaba')
igual(mezclar([1, 2, 3, 4]).sort(), [1, 2, 3, 4], 'mezclar conserva elementos')
console.log('quiz.test.ts OK')
