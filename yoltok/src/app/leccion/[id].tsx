import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { contenido, mezclar, nuevaSesion, responder, type Ejercicio, type Par, type Sesion } from '@/lib/quiz'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Resultado = { correcto: boolean; detalle: string }

const ETIQUETA: Record<string, string> = {
  opcion_multiple: 'VOCABULARIO BÁSICO',
  comprension_auditiva: 'COMPRENSIÓN',
  emparejar_pares: 'EMPAREJAR',
}

// Lección: quiz 2x2, respuesta incorrecta y victoria (diseños de Stitch).
export default function Leccion() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const userId = session!.user.id
  const [ejercicios, setEjercicios] = useState<Record<string, Ejercicio> | null>(null)
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [perfil, setPerfil] = useState<{ vidas: number; puntos: number } | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<'no' | 'guardando' | 'si' | 'error'>('no')
  const [inicio] = useState(() => Date.now())
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase
        .from('ejercicios')
        .select('id, tipo, instruccion, opciones, respuesta_correcta, puntos, orden, palabra:palabras(palabra_nahuat, traduccion_espanol)')
        .eq('leccion_id', id)
        .order('orden'),
      supabase.from('usuarios').select('vidas, puntos').eq('id', userId).single(),
    ]).then(([e, u]) => {
      const fallo = e.error ?? u.error
      if (fallo) return setError(fallo.message)
      const lista = (e.data ?? []) as unknown as Ejercicio[]
      if (!lista.length) return setError('Esta lección todavía no tiene ejercicios.')
      setEjercicios(Object.fromEntries(lista.map((x) => [x.id, x])))
      setSesion(nuevaSesion(lista))
      setPerfil(u.data)
    })
  }, [id, userId])

  const terminada = sesion?.cola.length === 0

  async function guardar(sesion: Sesion) {
    if (!perfil) return
    setGuardado('guardando')
    const p = await supabase.from('progreso_usuarios').upsert(
      {
        usuario_id: userId,
        leccion_id: id,
        completada: true,
        aciertos: sesion.aciertos,
        intentos: sesion.intentos,
        puntuacion: sesion.xp,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'usuario_id,leccion_id' },
    )
    // shortcut: repetir una lección vuelve a sumar XP; limitarlo si se vuelve un problema en la evaluación.
    // Terminar una lección recarga las vidas a 5 (decisión del equipo para la evaluación).
    const u = p.error ? p : await supabase.from('usuarios').update({ puntos: perfil.puntos + sesion.xp, vidas: 5 }).eq('id', userId)
    setGuardado(u.error ? 'error' : 'si')
  }

  function salir() {
    Alert.alert('¿Salir de la lección?', 'Perderás el avance de esta lección.', [
      { text: 'Seguir aprendiendo', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => router.back() },
    ])
  }

  function evaluar(correcto: boolean, detalle: string) {
    setResultado({ correcto, detalle })
    if (!correcto && perfil) {
      // Las vidas bajan 1 por intento fallido (también en emparejar) y no bloquean; se recargan al terminar.
      const vidas = Math.max(0, perfil.vidas - 1)
      setPerfil({ ...perfil, vidas })
      supabase.from('usuarios').update({ vidas }).eq('id', userId).then()
    }
  }

  function continuar() {
    // Chequeo explícito en vez de `!`: el React Compiler lee `resultado!.correcto` al renderizar y truena si es null.
    if (!resultado || !sesion || !ejercicios) return
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

  if (terminada) {
    return <Victoria sesion={sesion} ejercicios={Object.values(ejercicios)} segundos={segundos} guardado={guardado} reintentar={() => guardar(sesion)} />
  }

  const actual = ejercicios[sesion.cola[0]]
  const hechos = total - new Set(sesion.cola).size
  const c = contenido(actual)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={salir} accessibilityRole="button" accessibilityLabel="Salir de la lección" hitSlop={10}>
          <MaterialCommunityIcons name="close" size={28} color={colors.textMuted} />
        </Pressable>
        <View style={styles.progreso} accessible accessibilityLabel={`${hechos} de ${total} ejercicios`}>
          <View style={[styles.progresoLleno, { width: `${(hechos / total) * 100}%` }]} />
        </View>
        <View style={styles.vidas} accessible accessibilityLabel={`${perfil.vidas} vidas`}>
          <MaterialCommunityIcons name="heart" size={18} color={colors.error} />
          <Text style={styles.vidasTexto}>{perfil.vidas}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.chips}>
          <Text style={styles.chipTipo}>{ETIQUETA[actual.tipo] ?? 'EJERCICIO'}</Text>
          <Text style={styles.chipXp}>+{actual.puntos} XP</Text>
        </View>
        <Text style={styles.pregunta}>{actual.instruccion}</Text>
        {/* key: cada intento (incluido el repaso) empieza sin selección */}
        {c.clase === 'opciones' ? (
          <Opciones key={`${actual.id}-${sesion.intentos}`} opciones={c.opciones} correcta={c.correcta} bloqueado={!!resultado} onEvaluar={evaluar} />
        ) : (
          <Pares key={`${actual.id}-${sesion.intentos}`} pares={c.pares} bloqueado={!!resultado} onEvaluar={evaluar} />
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
          </View>
          <BotonHoja correcto={resultado.correcto} onPress={continuar} />
        </View>
      )}
    </SafeAreaView>
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
              <Text style={[styles.opcionTexto, sel && { color: '#0369A1' }, bien && { color: colors.primaryDark }, mal && { color: colors.errorLip }]}>
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
  const [izq] = useState(() => mezclar(pares.map((p) => p.nahuat)))
  const [der] = useState(() => mezclar(pares.map((p) => p.espanol)))
  const [elegido, setElegido] = useState<string | null>(null)
  const [unidos, setUnidos] = useState<string[]>([])
  const [errores, setErrores] = useState(0)
  const [fallo, setFallo] = useState<string | null>(null)

  function tocarDerecha(espanol: string) {
    if (!elegido) return
    const correcto = pares.some((p) => p.nahuat === elegido && p.espanol === espanol)
    if (!correcto) {
      setErrores(errores + 1)
      setFallo(espanol)
      setTimeout(() => setFallo(null), 600)
      setElegido(null)
      return
    }
    const nuevos = [...unidos, elegido]
    setUnidos(nuevos)
    setElegido(null)
    if (nuevos.length === pares.length) {
      onEvaluar(errores === 0, errores === 0 ? '¡Uniste todos los pares sin errores!' : `Completaste los pares con ${errores} ${errores === 1 ? 'error' : 'errores'}.`)
    }
  }

  const unidoDer = (espanol: string) => pares.some((p) => p.espanol === espanol && unidos.includes(p.nahuat))

  return (
    <View style={styles.pares}>
      <View style={styles.columna}>
        {izq.map((n) => {
          const hecho = unidos.includes(n)
          return (
            <Pressable
              key={n}
              disabled={hecho || bloqueado}
              onPress={() => setElegido(n)}
              accessibilityRole="button"
              accessibilityState={{ selected: elegido === n, disabled: hecho }}
              style={[styles.ficha, elegido === n && styles.opcionSel, hecho && styles.fichaHecha]}
            >
              <Text style={[styles.fichaTexto, styles.fichaNahuat, hecho && { color: colors.primaryDark }]}>{n}</Text>
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
              style={[styles.ficha, fallo === e && styles.opcionMal, hecho && styles.fichaHecha]}
            >
              <Text style={[styles.fichaTexto, hecho && { color: colors.primaryDark }]}>{e}</Text>
            </Pressable>
          )
        })}
      </View>
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

function Victoria({ sesion, ejercicios, segundos, guardado, reintentar }: {
  sesion: Sesion; ejercicios: Ejercicio[]; segundos: number; guardado: string; reintentar: () => void
}) {
  const precision = Math.round((sesion.aciertos / ejercicios.length) * 100)
  const tiempo = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
  const vocablos = [...new Map(ejercicios.filter((e) => e.palabra).map((e) => [e.palabra!.palabra_nahuat, e.palabra!])).values()]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.contenido, { alignItems: 'center' }]}>
        <View style={styles.medalla}>
          <MaterialCommunityIcons name="medal" size={64} color={colors.tertiary} />
        </View>
        <Text style={styles.finalizada}>LECCIÓN FINALIZADA</Text>
        <Text style={styles.victoriaTitulo}>¡Módulo completado!</Text>
        <Text style={styles.victoriaTexto}>Has practicado con éxito el vocabulario básico de náhuat del sur de Veracruz.</Text>

        <View style={styles.stats}>
          <Stat titulo="XP GANADOS" valor={`+${sesion.xp}`} icono="lightning-bolt" color={colors.tertiary} fondo={colors.tertiaryTint} />
          <Stat titulo="PRECISIÓN" valor={`${precision}%`} icono="target" color={colors.primary} fondo={colors.primaryTint} />
          <Stat titulo="TIEMPO" valor={tiempo} icono="timer-outline" color={colors.secondary} fondo={colors.secondaryTint} />
        </View>

        {vocablos.length > 0 && (
          <View style={styles.vocablos}>
            <Text style={styles.vocablosTitulo}>Vocablos aprendidos · {vocablos.length}</Text>
            <View style={styles.vocablosLista}>
              {vocablos.map((v) => (
                <Text key={v.palabra_nahuat} style={styles.vocablo}>
                  {v.palabra_nahuat} <Text style={{ color: colors.textMuted }}>({v.traduccion_espanol})</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 8 }}>
          {guardado === 'error' && <Text style={styles.error}>No se pudo guardar tu avance. Revisa tu conexión.</Text>}
          {guardado === 'error' ? (
            <Button title="Reintentar guardar" onPress={reintentar} />
          ) : (
            <Button title={guardado === 'si' ? 'Continuar' : 'Guardando…'} disabled={guardado !== 'si'} onPress={() => router.back()} />
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
  pregunta: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.text, marginVertical: 20 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  opcion: {
    width: '47%', flexGrow: 1, minHeight: 96, justifyContent: 'center', padding: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4,
  },
  opcionSel: { backgroundColor: '#F0F9FF', borderColor: colors.secondary, borderBottomColor: colors.secondaryLip },
  opcionBien: { backgroundColor: '#ECFDF5', borderColor: colors.primary, borderBottomColor: colors.primaryLip },
  opcionMal: { backgroundColor: '#FEF2F2', borderColor: colors.error, borderBottomColor: colors.errorLip },
  opcionTexto: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, color: colors.text, textAlign: 'center' },
  pares: { flexDirection: 'row', gap: 12 },
  columna: { flex: 1, gap: 12 },
  ficha: {
    minHeight: 64, justifyContent: 'center', padding: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4,
  },
  fichaHecha: { backgroundColor: '#ECFDF5', borderColor: colors.primary, borderBottomColor: colors.primaryLip },
  fichaTexto: { fontFamily: fonts.body, fontSize: 15, color: colors.text, textAlign: 'center' },
  fichaNahuat: { fontFamily: fonts.bodyBold },
  hoja: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 32, gap: 16, borderTopWidth: 2 },
  hojaBien: { backgroundColor: '#ECFDF5', borderTopColor: '#A7F3D0' },
  hojaMal: { backgroundColor: '#FEF2F2', borderTopColor: '#FECACA' },
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
  victoriaTitulo: { fontFamily: fonts.heading, fontSize: 28, color: colors.text, marginTop: 10 },
  victoriaTexto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 24, alignSelf: 'stretch' },
  stat: { flex: 1, borderRadius: 16, padding: 10, gap: 6, alignItems: 'center', borderBottomWidth: 4 },
  statTitulo: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 0.4 },
  statValor: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  vocablos: { alignSelf: 'stretch', backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, gap: 12, marginBottom: 16 },
  vocablosTitulo: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  vocablosLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vocablo: {
    fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, overflow: 'hidden',
  },
})
