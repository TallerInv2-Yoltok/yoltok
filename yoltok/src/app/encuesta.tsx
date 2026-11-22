import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

// Reactivos del cuestionario final (protocolo: 3 bloques ISO 9241-11). La clave es la columna en Supabase.
type Clave = 'navegacion' | 'diseno' | 'instrucciones' | 'audios' | 'tarjetas' | 'retroalimentacion' | 'motivacion' | 'utilidad' | 'volveria'
type Likert = { clave: Clave; texto: string }

const BLOQUES: { titulo: string; preguntas: Likert[] }[] = [
  { titulo: 'Bloque 1. Eficiencia y navegación', preguntas: [
    { clave: 'navegacion', texto: 'Considero que me resultó fácil navegar por las pantallas de la aplicación sin ayuda externa.' },
    { clave: 'diseno', texto: 'Considero que el diseño visual, los botones y los menús son claros e intuitivos.' },
    { clave: 'instrucciones', texto: 'Considero que las instrucciones de los ejercicios se comprendieron con facilidad.' },
  ] },
  { titulo: 'Bloque 2. Eficacia para el aprendizaje del náhuat', preguntas: [
    { clave: 'audios', texto: 'Considero que los audios de pronunciación me ayudaron a identificar cómo suenan las palabras en náhuat.' },
    { clave: 'tarjetas', texto: 'Considero que la estructura de tarjetas y ejercicios interactivos me facilitó recordar el vocabulario básico del módulo.' },
    { clave: 'retroalimentacion', texto: 'Considero que la retroalimentación inmediata al acertar o equivocarme me ayudó a corregir y reforzar lo aprendido.' },
  ] },
  { titulo: 'Bloque 3. Satisfacción y utilidad didáctica', preguntas: [
    { clave: 'motivacion', texto: 'Considero que las mecánicas de gamificación (puntos XP, vidas y barra de progreso) me motivaron a completar la lección.' },
    { clave: 'utilidad', texto: 'Considero que la aplicación es una herramienta útil y recomendable para apoyar el aprendizaje inicial del náhuat de la región sur de Veracruz.' },
    { clave: 'volveria', texto: 'Considero que volvería a utilizar esta aplicación para seguir aprendiendo nuevos módulos de náhuat.' },
  ] },
]
const ESCALA = ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']

// La evaluación corresponde a este módulo: solo se abre después de completarlo.
const MODULO_1 = '11111111-1111-4111-8111-111111111101'

async function moduloCompletado(usuarioId: string) {
  const { data, error } = await supabase
    .from('progreso_usuarios')
    .select('leccion_id')
    .eq('usuario_id', usuarioId)
    .eq('leccion_id', MODULO_1)
    .eq('completada', true)
    .maybeSingle()
  if (error) throw error
  return !!data
}

type Estado = 'cargando' | 'error' | 'bloqueada' | 'llenando' | 'enviando' | 'enviada'

export default function Encuesta() {
  const { session } = useAuth()
  const [estado, setEstado] = useState<Estado>('cargando')
  const [likert, setLikert] = useState<Partial<Record<Clave, number>>>({})
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!session) return
    const uid = session.user.id
    Promise.all([supabase.from('encuestas_usabilidad').select('id').eq('usuario_id', uid).maybeSingle(), moduloCompletado(uid)])
      .then(([enc, completado]) => {
        if (enc.error) throw enc.error
        setEstado(enc.data ? 'enviada' : completado ? 'llenando' : 'bloqueada')
      })
      .catch((e: { message?: string }) => {
        setError(e.message ?? String(e))
        setEstado('error')
      })
  }, [session, intento])

  function reintentar() {
    setError(null)
    setEstado('cargando')
    setIntento(intento + 1)
  }

  const completa = BLOQUES.every((b) => b.preguntas.every((p) => likert[p.clave]))

  async function enviar() {
    if (!session) return
    setEstado('enviando')
    setError(null)
    try {
      // Se vuelve a comprobar por si el progreso cambió desde que se abrió la pantalla.
      if (!(await moduloCompletado(session.user.id))) return setEstado('bloqueada')
      const { error } = await supabase.from('encuestas_usabilidad').insert({
        ...likert,
        comentario: comentario.trim() || null,
      })
      // 23505 = ya había una respuesta de este usuario: se trata como enviada.
      if (error && error.code !== '23505') throw error
      setEstado('enviada')
    } catch (e) {
      setError(`No se pudo enviar: ${(e as { message?: string }).message ?? e}`)
      setEstado('llenando')
    }
  }

  if (estado === 'cargando') {
    return <SafeAreaView style={[styles.safe, styles.centro]}><ActivityIndicator color={colors.primary} /></SafeAreaView>
  }

  if (estado === 'error') {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <Text style={styles.titulo}>No se pudo abrir la evaluación</Text>
        <Text style={styles.texto}>Revisa tu conexión e inténtalo de nuevo. ({error})</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 24, gap: 12 }}>
          <Button title="Reintentar" onPress={reintentar} />
          <Button variant="text" title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  if (estado === 'bloqueada') {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <View style={styles.gracias}>
          <MaterialCommunityIcons name="lock-outline" size={64} color={colors.tertiary} />
        </View>
        <Text style={styles.titulo}>Primero completa el Módulo 1</Text>
        <Text style={styles.texto}>La evaluación mide lo que aprendiste en la lección. Termínala y luego regresa a responderla.</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 24, gap: 12 }}>
          <Button title="Ir al Módulo 1" onPress={() => router.replace({ pathname: '/leccion/[id]', params: { id: MODULO_1 } })} />
          <Button variant="text" title="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  if (estado === 'enviada') {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <View style={styles.gracias}>
          <MaterialCommunityIcons name="check-decagram" size={72} color={colors.primary} />
        </View>
        <Text style={styles.titulo}>¡Tasohkamati!</Text>
        <Text style={styles.texto}>Gracias por evaluar Yoltok. Tus respuestas ayudan a preservar el náhuatl del sur de Veracruz.</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
          <Button title="Volver al inicio" onPress={() => router.dismissAll()} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Evaluación de usabilidad y aprendizaje</Text>
        <Text style={styles.norma}>ISO 9241-11</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={colors.secondaryLip} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introNota}>
              Tus respuestas quedan vinculadas a tu cuenta y se tratan de forma confidencial con fines académicos del TecNM Campus Minatitlán.
            </Text>
            <Text style={[styles.introNota, { marginTop: 8 }]}>
              Preguntas 1 a 9: {ESCALA.map((e, i) => `${i + 1} = ${e}`).join(' · ')}
            </Text>
          </View>
        </View>

        {BLOQUES.map((b, ib) => (
          <View key={b.titulo} style={{ gap: 14 }}>
            <Text style={styles.bloque}>{b.titulo}</Text>
            {b.preguntas.map((p, i) => (
              <Escala key={p.clave} n={ib * 3 + i + 1} p={p} valor={likert[p.clave]} onChange={(v) => setLikert({ ...likert, [p.clave]: v })} />
            ))}
          </View>
        ))}

        <Text style={styles.bloque}>Pregunta abierta</Text>
        <View style={styles.tarjeta}>
          <Text style={styles.pregunta}>
            <Text style={styles.numero}>10. </Text>¿Qué mejorarías de la aplicación, de los audios o de los ejercicios para facilitar el aprendizaje del náhuat?
          </Text>
          <Text style={styles.ayuda}>Opcional, máximo 1000 caracteres.</Text>
          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder="Escribe tus comentarios aquí…"
            placeholderTextColor={colors.disabledText}
            multiline
            maxLength={1000}
            accessibilityLabel="Comentarios"
            style={styles.comentario}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {!completa && <Text style={styles.ayuda}>Responde todas las preguntas para enviar.</Text>}
        <Button title={estado === 'enviando' ? 'Enviando…' : 'Enviar evaluación'} disabled={!completa || estado === 'enviando'} onPress={enviar} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Escala({ n, p, valor, onChange }: { n: number; p: Likert; valor?: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.tarjeta}>
      <Text style={styles.pregunta}><Text style={styles.numero}>{n}. </Text>{p.texto}</Text>
      <View style={styles.extremos}>
        <Text style={styles.extremo}>Muy en desacuerdo</Text>
        <Text style={styles.extremo}>Muy de acuerdo</Text>
      </View>
      <View style={styles.escala} accessibilityRole="radiogroup">
        {[1, 2, 3, 4, 5].map((v) => {
          const sel = valor === v
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              accessibilityRole="radio"
              accessibilityLabel={`${v} de 5`}
              accessibilityState={{ selected: sel }}
              style={[styles.punto, sel && styles.puntoSel]}
            >
              <Text style={[styles.puntoTexto, sel && { color: '#FFFFFF' }]}>{v}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 2, borderBottomColor: colors.outline,
  },
  headerTitulo: { flex: 1, fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  norma: {
    fontFamily: fonts.heading, fontSize: 11, color: colors.secondaryLip, backgroundColor: colors.secondaryTint,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, overflow: 'hidden',
  },
  contenido: { padding: 16, gap: 14, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  intro: { flexDirection: 'row', gap: 12, backgroundColor: colors.mutedTint, borderRadius: 16, padding: 16 },
  introNota: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4 },
  bloque: { fontFamily: fonts.heading, fontSize: 18, color: colors.primaryDark, marginTop: 8 },
  tarjeta: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, padding: 16, gap: 8 },
  pregunta: { fontFamily: fonts.title, fontSize: 16, lineHeight: 22, color: colors.text },
  numero: { color: colors.secondaryLip },
  ayuda: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  extremos: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  extremo: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  escala: { flexDirection: 'row', gap: 8 },
  punto: {
    flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mutedTint, borderBottomWidth: 4, borderBottomColor: colors.outlineLip,
  },
  puntoSel: { backgroundColor: colors.primaryDark, borderBottomColor: colors.text },
  puntoTexto: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  comentario: {
    minHeight: 100, textAlignVertical: 'top', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2,
    borderColor: colors.outlineLip, padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.errorLip, textAlign: 'center' },
  gracias: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFFFFF', borderWidth: 6, borderColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  titulo: { fontFamily: fonts.heading, fontSize: 28, color: colors.text, marginTop: 20 },
  texto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
})
