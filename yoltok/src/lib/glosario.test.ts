// Ejecutar con: node src/lib/glosario.test.ts
import { CON_AUDIO, filtrarPalabras, ordenarPalabras, type Palabra } from './glosario.ts'

const p = (id: string, n: string, e: string, c: string): Palabra => ({ id, palabra_nahuat: n, traduccion_espanol: e, categoria_id: c })
const lista = [p('1', 'Tasohkamati', 'Gracias', 'expr'), p('2', 'Ximotali', 'Siéntate', 'expr'), p('3', 'Petat', 'Petate', 'hogar')]

function ids(texto: string, cat: string | null, esperado: string[]) {
  const real = filtrarPalabras(lista, texto, cat).map((x) => x.id)
  if (JSON.stringify(real) !== JSON.stringify(esperado)) throw new Error(`«${texto}»/${cat}: esperaba ${esperado}, salió ${real}`)
}

ids('', null, ['1', '2', '3'])
ids('sientate', null, ['2']) // sin acento encuentra «Siéntate»
ids('  GRACIAS ', null, ['1'])
ids('pet', 'expr', [])
ids('', 'hogar', ['3'])

const conAudio = [{ ...lista[0] }, { ...lista[1], audio_path: 'x.mp3' }, { ...lista[2] }]
const solo = filtrarPalabras(conAudio, '', CON_AUDIO).map((x) => x.id)
if (JSON.stringify(solo) !== '["2"]') throw new Error(`Con audio: salió ${solo}`)
const orden = ordenarPalabras(conAudio, new Set(['Petat'])).map((x) => x.id)
if (JSON.stringify(orden) !== '["2","3","1"]') throw new Error(`ordenar: esperaba 2,3,1, salió ${orden}`)
console.log('glosario.test.ts OK')
