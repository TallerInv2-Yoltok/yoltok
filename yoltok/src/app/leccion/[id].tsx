import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BotonAudio, detener, reproducir } from '@/components/audio'
import { HojaInferior } from '@/components/hoja'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { contenido, mezclar, nuevaSesion, responder, vocabulario, type Ejercicio, type Par, type Sesion, type Vocablo } from '@/lib/quiz'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Resultado = { correcto: boolean; detalle: string }
type Guardado = 'no' | 'guardando' | 'si' | 'error'

const ETIQUETA: Record<string, string> = {
  opcion_multiple: 'VOCABULARIO BÁSICO',
  comprension_auditiva: 'COMPRENSIÓN AUDITIVA',
  emparejar_pares: 'EMPAREJAR',
}
// En los auditivos la pregunta no menciona la expresión: se evalúa lo que se escucha, no lo que se lee.
const INSTRUCCION_AUDITIVA = 'Escucha el audio y selecciona su significado en español'

// Lección: tarjetas de estudio, quiz 2x2 con repaso y vidas, y victoria (diseños de Stitch).
export default function Leccion() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const userId = session!.user.id
  const [ejercicios, setEjercicios] = useState<Record<string, Ejercicio> | null>(null)
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [perfil, setPerfil] = useState<{ vidas: number; puntos: number } | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<Guardado>('no')
  const guardando = useRef(false) // evita dos envíos si se pulsa «Reintentar» varias veces
  const [inicio, setInicio] = useState(() => Date.now())
  const [segundos, setSegundos] = useState(0)
  // Tarjetas de «palabra nueva» antes del quiz (diseño "tarjeta_de_estudio_kowit"); null = ya en el quiz.
  const [tarjeta, setTarjeta] = useState<number | null>(0)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [sinVidas, setSinVidas] = useState(false)
  // Cada reinicio cambia la key de Opciones/Pares: borra selecciones, pares unidos y errores del intento anterior.
  const [reinicios, setReinicios] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase
        .from('ejercicios')
        .select('id, tipo, instruccion, opciones, respuesta_correcta, puntos, orden, palabra:palabras(palabra_nahuat, traduccion_espanol, audio_path, descripcion)')
        .eq('leccion_id', id)
        .order('orden'),
      supabase.from('usuarios').select('vidas, puntos').eq('id', userId).single(),
    ]).then(([e, u]) => {
      const fallo = e.error ?? u.error
      if (fallo) return setError(fallo.message)
      // Un auditivo sin audio no se puede resolver: no se presenta como si estuviera listo.
      const lista = ((e.data ?? []) as unknown as Ejercicio[]).filter((x) => {
        const sinAudio = x.tipo === 'comprension_auditiva' && !x.palabra?.audio_path
        if (sinAudio) console.warn(`Ejercicio auditivo ${x.id} sin audio_path: se omite.`)
        return !sinAudio
      })
      if (!lista.length) return setError('Esta lección todavía no tiene ejercicios.')
      setEjercicios(Object.fromEntries(lista.map((x) => [x.id, x])))
      setSesion(nuevaSesion(lista))
      // Si salió de una lección con 0 vidas, empieza esta con 5.
      if (u.data?.vidas === 0) {
        setPerfil({ puntos: u.data.puntos, vidas: 5 })
        supabase.from('usuarios').update({ vidas: 5 }).eq('id', userId).then()
      } else setPerfil(u.data)
    })
  }, [id, userId])

  // Al salir de la lección se corta cualquier audio (p. ej. el de una ficha de pares).
  useEffect(() => () => detener(), [])

  const terminada = sesion?.cola.length === 0
  const enCurso = !!sesion && !error && !terminada

  // Durante la práctica, el Atrás de Android pide confirmación igual que la ✕ (gestureEnabled solo cubre iOS).
  // Mientras carga, si hay error o al terminar, Atrás sale normalmente.
  useEffect(() => {
    if (!enCurso) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmarSalida(true)
      return true
    })
    return () => sub.remove()
  }, [enCurso])

  // Progreso y XP son dos escrituras independientes: si falla la segunda, «Reintentar» repite ambas
  // (son idempotentes: upsert y puntos = base + xp). shortcut: para guardarlas juntas hace falta una función transaccional en Supabase.
  async function guardar(s: Sesion) {
    if (!perfil || guardando.current) return
    guardando.current = true
    setGuardado('guardando')
    try {
      const p = await supabase.from('progreso_usuarios').upsert(
        {
          usuario_id: userId,
          leccion_id: id,
          completada: true,
          aciertos: s.aciertos,
          intentos: s.intentos,
          puntuacion: s.xp,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: 'usuario_id,leccion_id' },
      )
      if (p.error) throw p.error
      // shortcut: repetir una lección vuelve a sumar XP; limitarlo si se vuelve un problema en la evaluación.
      // Terminar una lección recarga las vidas a 5 (decisión del equipo para la evaluación).
      const u = await supabase.from('usuarios').update({ puntos: perfil.puntos + s.xp, vidas: 5 }).eq('id', userId)
      if (u.error) throw u.error
      setGuardado('si')
    } catch (e) {
      console.warn('No se pudo guardar el avance:', e)
      setGuardado('error')
    } finally {
      guardando.current = false
    }
  }

  function evaluar(correcto: boolean, detalle: string) {
    setResultado({ correcto, detalle })
    if (!correcto && perfil) {
      // Una vida por ejercicio fallado (en emparejar: al terminar el conjunto con errores); en 0 la lección se reinicia.
      const vidas = Math.max(0, perfil.vidas - 1)
      setPerfil({ ...perfil, vidas })
      supabase.from('usuarios').update({ vidas }).eq('id', userId).then()
    }
  }

  // El tiempo de la victoria mide solo los ejercicios, no el estudio de tarjetas.
  function empezarQuiz() {
    setTarjeta(null)
    setInicio(Date.now())
  }

  function reiniciar() {
    if (!ejercicios || !perfil) return
    setPerfil({ ...perfil, vidas: 5 })
    supabase.from('usuarios').update({ vidas: 5 }).eq('id', userId).then()
    setSesion(nuevaSesion(Object.values(ejercicios)))
    setReinicios(reinicios + 1)
    setResultado(null)
    setSinVidas(false)
    setInicio(Date.now())
  }

  function continuar() {
    // Chequeo explícito en vez de `!`: el React Compiler lee `resultado!.correcto` al renderizar y truena si es null.
    if (!resultado || !sesion || !ejercicios || !perfil) return
    if (!resultado.correcto && perfil.vidas === 0) return setSinVidas(true)
    const nueva = responder(sesion, ejercicios[sesion.cola[0]], resultado.correcto)
    setSesion(nueva)
    setResultado(null)
    if (nueva.cola.length === 0) {
      setSegundos(Math.round((Date.now() - inicio) / 1000))
      guardar(nueva)
    }
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <Text style={styles.error}>{error}</Text>
        <Button variant="text" title="Volver" onPress={() => router.back()} />
      </SafeAreaView>
    )
  }
  if (!sesion || !ejercicios || !perfil) {
    return <SafeAreaView style={[styles.safe, styles.centro]}><ActivityIndicator color={colors.primary} /></SafeAreaView>
  }

  const total = Object.keys(ejercicios).length
  const palabras = vocabulario(Object.values(ejercicios))

  if (terminada) {
    return <Victoria sesion={sesion} total={total} vocablos={palabras} segundos={segundos} guardado={guardado} reintentar={() => guardar(sesion)} />
  }

  const salida = (
    <HojaInferior
      visible={confirmarSalida}
      onCerrar={() => setConfirmarSalida(false)}
      icono={<Text style={{ fontSize: 48 }}>🥺</Text>}
      titulo="¿Seguro que quieres salir?"
      texto="Si sales ahora, perderás el progreso y los puntos XP obtenidos en esta lección."
    >
      <Button variant="secondary" title="Seguir aprendiendo" onPress={() => setConfirmarSalida(false)} />
      <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.salidaSalir}>SALIR A LA RUTA DE APRENDIZAJE</Text>
      </Pressable>
    </HojaInferior>
  )

  if (tarjeta !== null && tarjeta < palabras.length) {
    const p = palabras[tarjeta]
    const ultima = tarjeta === palabras.length - 1
    return (
      <SafeAreaView style={styles.safe}>
        <Cabecera avance={(tarjeta + 1) / palabras.length} etiqueta={`Palabra ${tarjeta + 1} de ${palabras.length}`} vidas={perfil.vidas} onSalir={() => setConfirmarSalida(true)} />
        <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: 40, alignItems: 'center' }]}>
          <Text style={styles.chipNueva}>✨ PALABRA NUEVA · {tarjeta + 1}/{palabras.length}</Text>
          <View style={styles.estudio}>
            {p.audio_path && (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <BotonAudio key={p.palabra_nahuat} audioPath={p.audio_path} etiqueta={p.palabra_nahuat} tamano={96} />
                <Text style={styles.escuchar}>TOCA PARA ESCUCHAR</Text>
              </View>
            )}
            <Text style={styles.estudioPalabra}>{p.palabra_nahuat}</Text>
            <Text style={styles.estudioTraduccion}>{p.traduccion_espanol}</Text>
            {p.descripcion && (
              <View style={styles.estudioNota}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.secondaryLip} />
                <Text style={styles.estudioNotaTexto}>{p.descripcion}</Text>
              </View>
            )}
          </View>
          <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 24 }}>
            <Button title={ultima ? '¡A practicar!' : 'Continuar'} onPress={() => (ultima ? empezarQuiz() : setTarjeta(tarjeta + 1))} />
            <View style={styles.navTarjetas}>
              {tarjeta > 0 ? <Button variant="text" title="← Palabra anterior" onPress={() => setTarjeta(tarjeta - 1)} /> : <View />}
              {!ultima && <Button variant="text" title="Saltar y practicar" onPress={empezarQuiz} />}
            </View>
          </View>
        </ScrollView>
        {salida}
      </SafeAreaView>
    )
  }

  const actual = ejercicios[sesion.cola[0]]
  const hechos = total - new Set(sesion.cola).size
  const c = contenido(actual)
  const auditivo = actual.tipo === 'comprension_auditiva'
  const audio = actual.palabra?.audio_path
  // Un ejercicio ya fallado no vuelve a dar XP en el repaso.
  const daXp = !sesion.fallados.includes(actual.id)
  const llave = `${actual.id}-${sesion.intentos}-${reinicios}`

  return (
    <SafeAreaView style={styles.safe}>
      <Cabecera avance={hechos / total} etiqueta={`${hechos} de ${total} ejercicios`} vidas={perfil.vidas} onSalir={() => setConfirmarSalida(true)} />

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.chips}>
          <Text style={styles.chipTipo}>{ETIQUETA[actual.tipo] ?? 'EJERCICIO'}</Text>
          <Text style={[styles.chipXp, !daXp && styles.chipRepaso]}>{daXp ? `+${actual.puntos} XP` : 'REPASO · SIN XP'}</Text>
        </View>
        <Text style={styles.pregunta}>{auditivo ? INSTRUCCION_AUDITIVA : actual.instruccion}</Text>
        {auditivo && audio ? (
          <View style={styles.audioCentral}>
            <BotonAudio key={llave} audioPath={audio} etiqueta="la expresión del ejercicio" tamano={112} />
            <Text style={styles.escuchar}>TOCA PARA ESCUCHAR LA PALABRA</Text>
          </View>
        ) : (
          // En vocabulario solo si la pregunta muestra la palabra; si la palabra es la respuesta, el audio la delataría.
          audio && actual.palabra && actual.instruccion.includes(actual.palabra.palabra_nahuat) && (
            <View style={styles.audio}>
              <BotonAudio audioPath={audio} etiqueta={actual.palabra.palabra_nahuat} tamano={64} />
              <Text style={styles.audioTexto}>Toca para escuchar</Text>
            </View>
          )
        )}
        {c.clase === 'opciones' ? (
          <Opciones key={llave} opciones={c.opciones} correcta={c.correcta} bloqueado={!!resultado} onEvaluar={evaluar} />
        ) : (
          <Pares key={llave} pares={c.pares} bloqueado={!!resultado} onEvaluar={evaluar} />
        )}
      </ScrollView>

      {resultado && (
        <View style={[styles.hoja, resultado.correcto ? styles.hojaBien : styles.hojaMal]} accessibilityLiveRegion="assertive">
          <View style={styles.hojaFila}>
            <View style={[styles.hojaIcono, { backgroundColor: resultado.correcto ? colors.primary : colors.error }]}>
              <MaterialCommunityIcons name={resultado.correcto ? 'check-bold' : 'close-thick'} size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hojaTitulo, { color: resultado.correcto ? colors.primaryDark : colors.errorLip }]}>
                {resultado.correcto ? '¡Kwali! Excelente trabajo' : 'Respuesta incorrecta'}
              </Text>
              <Text style={[styles.hojaDetalle, { color: resultado.correcto ? colors.text : colors.errorLip }]}>{resultado.detalle}</Text>
              {!resultado.correcto && <Text style={styles.hojaNota}>Se agregará al repaso final de la lección.</Text>}
            </View>
            {/* Volver a escuchar la expresión antes de seguir (refuerza la retención). */}
            {c.clase === 'opciones' && audio && actual.palabra && (
              <BotonAudio audioPath={audio} etiqueta={actual.palabra.palabra_nahuat} tamano={44} />
            )}
          </View>
          <BotonHoja correcto={resultado.correcto} onPress={continuar} />
        </View>
      )}
      {salida}
      <HojaInferior
        visible={sinVidas}
        icono={<MaterialCommunityIcons name="heart-broken" size={52} color={colors.error} />}
        fondoIcono={colors.errorTint}
        titulo="¡Te quedaste sin corazones!"
        texto="Repasemos desde el inicio con tus 5 vidas restauradas."
      >
        <Button title="Reiniciar lección" onPress={reiniciar} />
      </HojaInferior>
    </SafeAreaView>
  )
}

function Cabecera({ avance, etiqueta, vidas, onSalir }: { avance: number; etiqueta: string; vidas: number; onSalir: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onSalir} accessibilityRole="button" accessibilityLabel="Salir de la lección" hitSlop={10}>
        <MaterialCommunityIcons name="close" size={28} color={colors.textMuted} />
      </Pressable>
      <View style={styles.progreso} accessible accessibilityLabel={etiqueta}>
        <View style={[styles.progresoLleno, { width: `${avance * 100}%` }]} />
      </View>
      <View style={styles.vidas} accessible accessibilityLabel={`${vidas} vidas`}>
        <MaterialCommunityIcons name="heart" size={18} color={colors.error} />
        <Text style={styles.vidasTexto}>{vidas}</Text>
      </View>
    </View>
  )
}

function Opciones({ opciones, correcta, bloqueado, onEvaluar }: {
  opciones: string[]; correcta: string; bloqueado: boolean; onEvaluar: (correcto: boolean, detalle: string) => void
}) {
  const [orden] = useState(() => mezclar(opciones))
  const [elegida, setElegida] = useState<string | null>(null)

  return (
    <>
      <View style={styles.rejilla}>
        {orden.map((op) => {
          const sel = elegida === op
          const mal = bloqueado && sel && op !== correcta
          const bien = bloqueado && op === correcta
          return (
            <Pressable
              key={op}
              disabled={bloqueado}
              onPress={() => setElegida(op)}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              style={[styles.opcion, sel && styles.opcionSel, bien && styles.opcionBien, mal && styles.opcionMal]}
            >
              <Text style={[styles.opcionTexto, sel && { color: colors.secondaryLip }, bien && { color: colors.primaryDark }, mal && { color: colors.errorLip }]}>
                {op}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {!bloqueado && (
        <View style={{ marginTop: 24 }}>
          <Button
            title="Comprobar"
            disabled={!elegida}
            onPress={() => onEvaluar(elegida === correcta, elegida === correcta ? `«${correcta}» es correcto.` : `Respuesta correcta: ${correcta}`)}
          />
        </View>
      )}
    </>
  )
}

function Pares({ pares, bloqueado, onEvaluar }: {
  pares: Par[]; bloqueado: boolean; onEvaluar: (correcto: boolean, detalle: string) => void
}) {
  const [izq] = useState(() => mezclar(pares))
  const [der] = useState(() => mezclar(pares.map((p) => p.espanol)))
  const [elegido, setElegido] = useState<string | null>(null)
  const [unidos, setUnidos] = useState<string[]>([])
  const [errores, setErrores] = useState(0)
  const [fallo, setFallo] = useState<{ nahuat: string; espanol: string } | null>(null)

  // Tocar la palabra en náhuat la pronuncia: sonido + escritura + significado.
  function tocarIzquierda(p: Par) {
    setElegido(p.nahuat)
    setFallo(null)
    if (p.audio_path) reproducir(p.audio_path)
  }

  function tocarDerecha(espanol: string) {
    if (!elegido) return
    const correcto = pares.some((p) => p.nahuat === elegido && p.espanol === espanol)
    if (!correcto) {
      setErrores(errores + 1)
      setFallo({ nahuat: elegido, espanol })
      setElegido(null)
      return
    }
    const nuevos = [...unidos, elegido]
    setUnidos(nuevos)
    setElegido(null)
    setFallo(null)
    if (nuevos.length === pares.length) {
      onEvaluar(errores === 0, errores === 0 ? '¡Uniste todos los pares sin errores!' : `Completaste los pares con ${errores} ${errores === 1 ? 'error' : 'errores'}.`)
    }
  }

  const unidoDer = (espanol: string) => pares.some((p) => p.espanol === espanol && unidos.includes(p.nahuat))

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.paresNota}>Si te equivocas en algún par, perderás una vida al terminar el conjunto.</Text>
      <View style={styles.pares}>
        <View style={styles.columna}>
          {izq.map((p) => {
            const hecho = unidos.includes(p.nahuat)
            const sel = elegido === p.nahuat
            return (
              <Pressable
                key={p.nahuat}
                disabled={hecho || bloqueado}
                onPress={() => tocarIzquierda(p)}
                accessibilityRole="button"
                accessibilityHint={p.audio_path ? 'Reproduce su pronunciación' : undefined}
                accessibilityState={{ selected: sel, disabled: hecho }}
                style={[styles.ficha, sel && styles.opcionSel, hecho && styles.fichaHecha]}
              >
                <View style={styles.fichaFila}>
                  <Text style={[styles.fichaTexto, styles.fichaNahuat, hecho && { color: colors.primaryDark }]}>{p.nahuat}</Text>
                  {sel && p.audio_path && <MaterialCommunityIcons name="volume-high" size={16} color={colors.secondaryLip} />}
                </View>
              </Pressable>
            )
          })}
        </View>
        <View style={styles.columna}>
          {der.map((e) => {
            const hecho = unidoDer(e)
            return (
              <Pressable
                key={e}
                disabled={hecho || bloqueado}
                onPress={() => tocarDerecha(e)}
                accessibilityRole="button"
                accessibilityState={{ disabled: hecho }}
                style={[styles.ficha, fallo?.espanol === e && styles.opcionMal, hecho && styles.fichaHecha]}
              >
                <Text style={[styles.fichaTexto, hecho && { color: colors.primaryDark }]}>{e}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      {/* El rojo de la ficha se acompaña de un mensaje que también leen los lectores de pantalla. */}
      {fallo && (
        <View style={styles.paresFallo} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.errorLip} />
          <Text style={styles.paresFalloTexto}>«{fallo.nahuat}» no significa «{fallo.espanol}». Intenta con otra pareja.</Text>
        </View>
      )}
    </View>
  )
}

function BotonHoja({ correcto, onPress }: { correcto: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.botonHoja,
        { backgroundColor: correcto ? colors.primary : colors.error, borderBottomColor: correcto ? colors.primaryLip : colors.errorLip },
        pressed && { transform: [{ translateY: 4 }], borderBottomWidth: 0 },
      ]}
    >
      <Text style={styles.botonHojaTexto}>{correcto ? 'CONTINUAR' : 'ENTENDIDO'}</Text>
      <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" />
    </Pressable>
  )
}

// Victoria cultural: lema, desglose de XP y precisión, y las palabras practicadas con su audio para repasar.
function Victoria({ sesion, total, vocablos, segundos, guardado, reintentar }: {
  sesion: Sesion; total: number; vocablos: Vocablo[]; segundos: number; guardado: Guardado; reintentar: () => void
}) {
  const precision = Math.round((sesion.aciertos / total) * 100)
  const tiempo = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.contenido, { alignItems: 'center' }]}>
        <View style={styles.medalla}>
          <MaterialCommunityIcons name="flower-tulip-outline" size={64} color={colors.tertiary} />
        </View>
        <Text style={styles.finalizada}>LECCIÓN FINALIZADA</Text>
        <Text style={styles.victoriaTitulo}>¡Omoxochiyoti motlahtol!</Text>
        <Text style={styles.victoriaLema}>¡Tu palabra ha florecido!</Text>
        <Text style={styles.victoriaTexto}>Practicaste {vocablos.length} palabras del náhuatl del sur de Veracruz.</Text>

        <View style={styles.stats}>
          <Stat titulo="XP GANADOS" valor={`+${sesion.xp}`} icono="lightning-bolt" color={colors.tertiary} fondo={colors.tertiaryTint} />
          <Stat titulo="PRECISIÓN" valor={`${precision}%`} icono="target" color={colors.primary} fondo={colors.primaryTint} />
          <Stat titulo="TIEMPO" valor={tiempo} icono="timer-outline" color={colors.secondary} fondo={colors.secondaryTint} />
        </View>
        <Text style={styles.desglose}>
          {sesion.aciertos} de {total} ejercicios correctos al primer intento · {sesion.intentos} respuestas en total
        </Text>

        {vocablos.length > 0 && (
          <View style={styles.vocablos}>
            <Text style={styles.vocablosTitulo}>Palabras practicadas · {vocablos.length}</Text>
            {vocablos.map((v) => (
              <View key={v.palabra_nahuat} style={styles.vocablo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vocabloNahuat}>{v.palabra_nahuat}</Text>
                  <Text style={styles.vocabloEspanol}>{v.traduccion_espanol}</Text>
                </View>
                {v.audio_path && <BotonAudio audioPath={v.audio_path} etiqueta={v.palabra_nahuat} tamano={36} />}
              </View>
            ))}
          </View>
        )}

        <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 8 }} accessibilityLiveRegion="polite">
          {guardado === 'guardando' && <Text style={styles.estadoGuardado}>Guardando tu avance…</Text>}
          {guardado === 'si' && <Text style={[styles.estadoGuardado, { color: colors.primaryText }]}>✓ Avance guardado</Text>}
          {guardado === 'error' && <Text style={styles.error}>No se pudo guardar tu avance. Revisa tu conexión e inténtalo de nuevo.</Text>}
          {guardado === 'error' ? (
            <Button title="Reintentar guardar" onPress={reintentar} />
          ) : (
            <>
              <Button title={guardado === 'si' ? 'Responder la evaluación' : 'Guardando…'} disabled={guardado !== 'si'} onPress={() => router.replace('/encuesta')} />
              <Button variant="text" title="Volver a la ruta sin evaluar" disabled={guardado !== 'si'} onPress={() => router.back()} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ titulo, valor, icono, color, fondo }: {
  titulo: string; valor: string; icono: 'lightning-bolt' | 'target' | 'timer-outline'; color: string; fondo: string
}) {
  return (
    <View style={[styles.stat, { backgroundColor: fondo, borderBottomColor: color }]}>
      <Text style={[styles.statTitulo, { color }]}>{titulo}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <MaterialCommunityIcons name={icono} size={20} color={color} />
        <Text style={styles.statValor}>{valor}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 },
  error: { fontFamily: fonts.body, color: colors.errorLip, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  progreso: { flex: 1, height: 16, borderRadius: 9999, backgroundColor: colors.outline, overflow: 'hidden' },
  progresoLleno: { height: '100%', backgroundColor: colors.primary, borderRadius: 9999 },
  vidas: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vidasTexto: { fontFamily: fonts.heading, fontSize: 16, color: colors.error },
  contenido: { padding: 16, paddingBottom: 220, maxWidth: 480, width: '100%', alignSelf: 'center' },
  chips: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipTipo: {
    fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.5, color: colors.text,
    backgroundColor: colors.secondaryTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, overflow: 'hidden',
  },
  chipXp: {
    fontFamily: fonts.heading, fontSize: 12, color: colors.tertiaryLip,
    backgroundColor: colors.tertiaryTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, overflow: 'hidden',
  },
  chipRepaso: { color: colors.textMuted, backgroundColor: colors.mutedTint },
  pregunta: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.text, marginVertical: 20 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  audio: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: -8, marginBottom: 20 },
  audioCentral: { alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 24 },
  chipNueva: {
    fontFamily: fonts.heading, fontSize: 13, letterSpacing: 0.5, color: colors.tertiaryLip, backgroundColor: colors.tertiaryTint,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, overflow: 'hidden', marginBottom: 16,
  },
  estudio: {
    alignSelf: 'stretch', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 6, borderBottomColor: colors.outlineLip,
  },
  navTarjetas: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  escuchar: { fontFamily: fonts.heading, fontSize: 13, letterSpacing: 0.5, color: colors.secondaryLip },
  estudioPalabra: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 48, color: colors.text, textAlign: 'center', marginTop: 8 },
  estudioTraduccion: { fontFamily: fonts.body, fontSize: 22, color: colors.textMuted, textAlign: 'center' },
  estudioNota: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', backgroundColor: colors.mutedTint, borderRadius: 16, padding: 14, marginTop: 8 },
  estudioNotaTexto: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  salidaSalir: { fontFamily: fonts.heading, fontSize: 15, letterSpacing: 0.5, color: colors.error, textAlign: 'center', paddingVertical: 8 },
  audioTexto: { fontFamily: fonts.title, fontSize: 15, color: colors.secondaryLip },
  opcion: {
    width: '47%', flexGrow: 1, minHeight: 96, justifyContent: 'center', padding: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4,
  },
  opcionSel: { backgroundColor: colors.secondaryTint, borderColor: colors.secondary, borderBottomColor: colors.secondaryLip },
  opcionBien: { backgroundColor: colors.primaryTint, borderColor: colors.primary, borderBottomColor: colors.primaryLip },
  opcionMal: { backgroundColor: colors.errorTint, borderColor: colors.error, borderBottomColor: colors.errorLip },
  opcionTexto: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, color: colors.text, textAlign: 'center' },
  paresNota: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: -8 },
  pares: { flexDirection: 'row', gap: 12 },
  columna: { flex: 1, gap: 12 },
  ficha: {
    minHeight: 64, justifyContent: 'center', padding: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4,
  },
  fichaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  fichaHecha: { backgroundColor: colors.primaryTint, borderColor: colors.primary, borderBottomColor: colors.primaryLip },
  fichaTexto: { fontFamily: fonts.body, fontSize: 15, color: colors.text, textAlign: 'center' },
  fichaNahuat: { fontFamily: fonts.bodyBold, flexShrink: 1 },
  paresFallo: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.errorTint, borderRadius: 12, padding: 12 },
  paresFalloTexto: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.errorLip },
  hoja: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 32, gap: 16, borderTopWidth: 2 },
  hojaBien: { backgroundColor: colors.primaryTint, borderTopColor: colors.primary },
  hojaMal: { backgroundColor: colors.errorTint, borderTopColor: colors.error },
  hojaFila: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  hojaIcono: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  hojaTitulo: { fontFamily: fonts.heading, fontSize: 20 },
  hojaDetalle: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22, marginTop: 2 },
  hojaNota: { fontFamily: fonts.body, fontSize: 13, color: colors.errorLip, marginTop: 4 },
  botonHoja: {
    height: 52, borderRadius: 9999, borderBottomWidth: 4, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
  },
  botonHojaTexto: { fontFamily: fonts.heading, fontSize: 15, letterSpacing: 0.5, color: '#FFFFFF' },
  medalla: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFFFFF', borderWidth: 6, borderColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  finalizada: {
    fontFamily: fonts.heading, fontSize: 13, letterSpacing: 0.5, color: colors.primaryDark, marginTop: 20,
    backgroundColor: colors.secondaryTint, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999, overflow: 'hidden',
  },
  victoriaTitulo: { fontFamily: fonts.heading, fontSize: 28, color: colors.text, marginTop: 10, textAlign: 'center' },
  victoriaLema: { fontFamily: fonts.title, fontSize: 17, color: colors.tertiaryLip, marginTop: 2, textAlign: 'center' },
  victoriaTexto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 24, marginBottom: 10, alignSelf: 'stretch' },
  stat: { flex: 1, borderRadius: 16, padding: 10, gap: 6, alignItems: 'center', borderBottomWidth: 4 },
  statTitulo: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 0.4 },
  statValor: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  desglose: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  vocablos: { alignSelf: 'stretch', backgroundColor: colors.mutedTint, borderRadius: 16, padding: 16, gap: 10, marginBottom: 16 },
  vocablosTitulo: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  vocablo: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: colors.outline, borderBottomWidth: 3, paddingVertical: 10, paddingHorizontal: 14,
  },
  vocabloNahuat: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  vocabloEspanol: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  estadoGuardado: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
})
