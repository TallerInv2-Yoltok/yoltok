import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { mezclar } from '@/lib/quiz'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

// Reactivos del cuestionario final (protocolo: 3 bloques ISO 9241-11). La clave es la columna en Supabase.
type Likert = { clave: 'navegacion' | 'diseno' | 'instrucciones' | 'motivacion' | 'utilidad'; texto: string; ayuda: string }

const BLOQUE_EFICIENCIA: Likert[] = [
  { clave: 'navegacion', texto: 'Fue fácil navegar y usar la aplicación.', ayuda: 'Eficiencia y fluidez de navegación' },
  { clave: 'diseno', texto: 'El diseño visual y los botones son claros e intuitivos.', ayuda: 'Claridad visual de la interfaz' },
  { clave: 'instrucciones', texto: 'Las instrucciones de los ejercicios se entendieron bien.', ayuda: 'Claridad de las instrucciones' },
]
const BLOQUE_SATISFACCION: Likert[] = [
  { clave: 'motivacion', texto: 'Los puntos, vidas y retos me motivaron a seguir aprendiendo.', ayuda: 'Motivación por la gamificación' },
  { clave: 'utilidad', texto: 'La aplicación me sirve para estudiar y preservar el náhuatl.', ayuda: 'Utilidad pedagógica percibida' },
]
// Reactivos de retención léxica inmediata: palabras de la lección 1.
const LEXICOS = [
  { palabra: 'Tasohkamati', correcta: 'Gracias', opciones: ['Gracias', 'Siéntate', 'Estoy bien', 'Hasta mañana'] },
  { palabra: 'Ximotali', correcta: 'Siéntate', opciones: ['Escribe', 'Siéntate', 'Gracias', '¿Cómo estás?'] },
  { palabra: 'Niyegonok', correcta: 'Estoy bien', opciones: ['¿Dónde vas?', 'Mañana nos vemos', 'Estoy bien', 'Siéntate'] },
]

export default function Encuesta() {
  const { session } = useAuth()
  const [estado, setEstado] = useState<'cargando' | 'llenando' | 'enviando' | 'enviada'>('cargando')
  const [likert, setLikert] = useState<Partial<Record<Likert['clave'], number>>>({})
  const [lexicos, setLexicos] = useState<(string | null)[]>(LEXICOS.map(() => null))
  const [opciones] = useState(() => LEXICOS.map((l) => mezclar(l.opciones)))
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    supabase
      .from('encuestas_usabilidad')
      .select('id')
      .eq('usuario_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setEstado(data ? 'enviada' : 'llenando')
      })
  }, [session])

  const claves = [...BLOQUE_EFICIENCIA, ...BLOQUE_SATISFACCION].map((p) => p.clave)
  const completa = claves.every((c) => likert[c]) && lexicos.every(Boolean)

  async function enviar() {
    setEstado('enviando')
    setError(null)
    const { error } = await supabase.from('encuestas_usabilidad').insert({
      ...likert,
      aciertos_lexicos: lexicos.filter((r, i) => r === LEXICOS[i].correcta).length,
      comentario: comentario.trim() || null,
    })
    // 23505 = ya había una respuesta de este usuario: se trata como enviada.
    if (error && error.code !== '23505') {
      setError(`No se pudo enviar: ${error.message}`)
      setEstado('llenando')
    } else setEstado('enviada')
  }

  if (estado === 'cargando') {
    return <SafeAreaView style={[styles.safe, styles.centro]}><ActivityIndicator color={colors.primary} /></SafeAreaView>
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
          <Button title="Volver al inicio" onPress={() => router.dismissTo('/')} />
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
        <Text style={styles.headerTitulo}>Evaluación de usabilidad</Text>
        <Text style={styles.norma}>ISO 9241-11</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={colors.secondaryLip} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTexto}>Ayúdanos a medir la eficacia, eficiencia y satisfacción del módulo de náhuatl.</Text>
            <Text style={styles.introNota}>Tus respuestas son anónimas y solo se usan con fines académicos.</Text>
          </View>
        </View>

        <Text style={styles.bloque}>1. Eficiencia y navegación</Text>
        {BLOQUE_EFICIENCIA.map((p, i) => (
          <Escala key={p.clave} n={i + 1} p={p} valor={likert[p.clave]} onChange={(v) => setLikert({ ...likert, [p.clave]: v })} />
        ))}

        <Text style={styles.bloque}>2. Reconocimiento de palabras</Text>
        {LEXICOS.map((l, i) => (
          <View key={l.palabra} style={styles.tarjeta}>
            <Text style={styles.pregunta}>
              <Text style={styles.numero}>{BLOQUE_EFICIENCIA.length + i + 1}. </Text>¿Qué significa «{l.palabra}»?
            </Text>
            <View style={styles.opciones}>
              {opciones[i].map((op) => {
                const sel = lexicos[i] === op
                return (
                  <Pressable
                    key={op}
                    onPress={() => setLexicos(lexicos.map((r, j) => (j === i ? op : r)))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                    style={[styles.opcion, sel && styles.opcionSel]}
                  >
                    <Text style={[styles.opcionTexto, sel && { color: '#FFFFFF' }]}>{op}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))}

        <Text style={styles.bloque}>3. Satisfacción y utilidad</Text>
        {BLOQUE_SATISFACCION.map((p, i) => (
          <Escala
            key={p.clave}
            n={BLOQUE_EFICIENCIA.length + LEXICOS.length + i + 1}
            p={p}
            valor={likert[p.clave]}
            onChange={(v) => setLikert({ ...likert, [p.clave]: v })}
          />
        ))}

        <View style={styles.tarjeta}>
          <Text style={styles.pregunta}>¿Algún comentario sobre la pronunciación o las palabras?</Text>
          <Text style={styles.ayuda}>Opcional: si notaste alguna variante de Pajapan o Mecayapan, indícalo aquí.</Text>
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
      <Text style={styles.ayuda}>{p.ayuda}</Text>
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
  intro: { flexDirection: 'row', gap: 12, backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16 },
  introTexto: { fontFamily: fonts.title, fontSize: 16, lineHeight: 22, color: colors.text },
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
    backgroundColor: '#EEF2FF', borderBottomWidth: 4, borderBottomColor: colors.outlineLip,
  },
  puntoSel: { backgroundColor: colors.primaryDark, borderBottomColor: '#004D33' },
  puntoTexto: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  opcion: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9999, backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4,
  },
  opcionSel: { backgroundColor: colors.secondary, borderColor: colors.secondary, borderBottomColor: colors.secondaryLip },
  opcionTexto: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
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
