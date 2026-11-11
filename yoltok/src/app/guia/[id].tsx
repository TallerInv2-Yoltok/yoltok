import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BotonAudio } from '@/components/audio'
import { Button } from '@/components/ui'
import type { Ejercicio } from '@/lib/quiz'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Palabra = NonNullable<Ejercicio['palabra']>

// Guía de la lección (diseño "guia_de_la_etapa_1_yoltok"): notas fijas + las expresiones de la lección.
// Los textos fijos vienen del diseño de Stitch; validarlos con el equipo y los hablantes.
export default function Guia() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [titulo, setTitulo] = useState('')
  const [palabras, setPalabras] = useState<Palabra[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('lecciones').select('titulo').eq('id', id).maybeSingle(),
      supabase.from('ejercicios').select('orden, palabra:palabras(palabra_nahuat, traduccion_espanol, audio_path, descripcion)').eq('leccion_id', id).order('orden'),
    ]).then(([l, e]) => {
      const fallo = l.error ?? e.error
      if (fallo) return setError(fallo.message)
      setTitulo(l.data?.titulo ?? '')
      const lista = ((e.data ?? []) as unknown as Pick<Ejercicio, 'palabra'>[]).flatMap((x) => (x.palabra ? [x.palabra] : []))
      setPalabras([...new Map(lista.map((p) => [p.palabra_nahuat, p])).values()])
    })
  }, [id])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cerrar guía" hitSlop={10}>
          <MaterialCommunityIcons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>📖 Guía de la lección</Text>
        <View style={{ width: 28 }} />
      </View>

      {error ? (
        <View style={styles.centro}><Text style={styles.error}>Error: {error}</Text></View>
      ) : !palabras ? (
        <View style={styles.centro}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.hero}>
            <Text style={styles.heroChip}>📘 {titulo.toUpperCase()}</Text>
            <Text style={styles.heroTitulo}>Notas del náhuatl del sur de Veracruz</Text>
            <Text style={styles.heroTexto}>Consejos rápidos y fonética clave antes de iniciar tu práctica.</Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.chipTip}>💡 TIP DE PRONUNCIACIÓN</Text>
            <Text style={styles.cuerpo}>
              En la variante del sur de Veracruz, muchas palabras terminan en <Text style={styles.negrita}>«-t»</Text> en lugar de la terminación
              clásica <Text style={styles.negrita}>«-tl»</Text> del náhuatl central. Por regla general, el acento recae con fuerza en la penúltima sílaba.
            </Text>
          </View>

          <View style={styles.seccionFila}>
            <Text style={styles.seccion}>Expresiones clave</Text>
            <Text style={styles.contador}>{palabras.length} términos</Text>
          </View>
          {palabras.map((p) => (
            <View key={p.palabra_nahuat} style={styles.expresion}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.nahuatl}>{p.palabra_nahuat}</Text>
                <Text style={styles.espanol}>{p.traduccion_espanol}</Text>
              </View>
              {p.audio_path && <BotonAudio audioPath={p.audio_path} etiqueta={p.palabra_nahuat} />}
            </View>
          ))}

          <View style={[styles.tarjeta, styles.variantes]}>
            <Text style={styles.variantesTitulo}>🔎 Variantes de la Sierra de Santa Marta</Text>
            <Text style={styles.cuerpoChico}>
              Las comunidades de Pajapan y Mecayapan preservan esta riqueza viva. En este curso adoptamos la convención ortográfica comunitaria para
              facilitar tu escritura y tu reconocimiento auditivo.
            </Text>
          </View>

          <Button title="¡Entendido!" onPress={() => router.back()} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitulo: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  contenido: { padding: 16, gap: 14, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 18, borderBottomWidth: 4, borderBottomColor: colors.primaryLip },
  heroChip: {
    alignSelf: 'flex-start', fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.5, color: colors.primaryTint,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, overflow: 'hidden',
  },
  heroTitulo: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: '#FFFFFF', marginTop: 10 },
  heroTexto: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#ECFDF5', marginTop: 4 },
  tarjeta: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, padding: 16, gap: 10 },
  chipTip: {
    alignSelf: 'flex-start', fontFamily: fonts.heading, fontSize: 12, letterSpacing: 0.5, color: colors.tertiaryLip,
    backgroundColor: colors.tertiaryTint, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999, overflow: 'hidden',
  },
  cuerpo: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  cuerpoChico: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  negrita: { fontFamily: fonts.bodyBold },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  seccion: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  contador: {
    fontFamily: fonts.heading, fontSize: 12, color: colors.secondaryLip, backgroundColor: colors.secondaryTint,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, overflow: 'hidden',
  },
  expresion: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4, padding: 16,
  },
  nahuatl: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  espanol: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  variantes: { backgroundColor: '#EEF2FF', borderColor: '#EEF2FF' },
  variantesTitulo: { fontFamily: fonts.heading, fontSize: 16, color: colors.secondaryLip },
})
