import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BotonAudio } from '@/components/audio'
import { Encabezado } from '@/components/encabezado'
import { useAuth } from '@/lib/auth'
import { CON_AUDIO, filtrarPalabras, ordenarPalabras, type Palabra } from '@/lib/glosario'
import { vocabulario, type Ejercicio } from '@/lib/quiz'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Categoria = { id: string; nombre: string }

// Glosario «Tlahtolli» (diseño "glosario_de_audios_palabras_yoltok").
export default function Glosario() {
  const { session } = useAuth()
  const [palabras, setPalabras] = useState<Palabra[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [practicadas, setPracticadas] = useState<Set<string>>(new Set())
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    if (!session) return
    Promise.all([
      supabase.from('palabras').select('id, palabra_nahuat, traduccion_espanol, categoria_id, audio_path').neq('palabra_nahuat', '').order('palabra_nahuat'),
      supabase.from('categorias').select('id, nombre').order('orden'),
      supabase.from('progreso_usuarios').select('leccion_id').eq('usuario_id', session.user.id).eq('completada', true),
      supabase.from('ejercicios').select('leccion_id, tipo, opciones, orden, palabra:palabras(palabra_nahuat, traduccion_espanol)'),
    ]).then(([p, c, pr, e]) => {
      const fallo = p.error ?? c.error ?? pr.error ?? e.error
      if (fallo) return setError(fallo.message)
      // «Practicada» = aparece (también dentro de los pares) en una lección que el usuario ya completó.
      const hechas = new Set((pr.data ?? []).map((x) => x.leccion_id))
      const vistas = vocabulario((e.data ?? []).filter((x) => hechas.has(x.leccion_id)) as unknown as Ejercicio[])
      const nuevas = new Set(vistas.map((v) => v.palabra_nahuat))
      setPracticadas(nuevas)
      setPalabras(ordenarPalabras(p.data ?? [], nuevas))
      setCategorias(c.data ?? [])
    })
  }, [session]))

  const visibles = palabras ? filtrarPalabras(palabras, texto, categoria) : []
  const conAudio = palabras?.filter((p) => p.audio_path).length ?? 0
  const chips = [{ id: null, nombre: `Todos (${palabras?.length ?? 0})` }, { id: CON_AUDIO, nombre: `🔊 Con audio (${conAudio})` }, ...categorias]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Encabezado />
      {error ? (
        <View style={styles.centro}><Text style={styles.error}>Error: {error}</Text></View>
      ) : !palabras ? (
        <View style={styles.centro}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: 16 }}>
              <View style={styles.hero}>
                <Text style={styles.heroChip}>TLAHTOLLI · PALABRAS</Text>
                <Text style={styles.heroTitulo}>Glosario de náhuatl</Text>
                <Text style={styles.heroTexto}>Consulta el vocabulario del náhuatl del sur de Veracruz y su significado en español.</Text>
              </View>
              <View style={styles.buscador}>
                <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
                <TextInput
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Buscar en náhuatl o español…"
                  placeholderTextColor={colors.disabledText}
                  accessibilityLabel="Buscar palabra"
                  autoCorrect={false}
                  style={styles.buscadorInput}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {chips.map((c) => {
                  const sel = categoria === c.id
                  return (
                    <Pressable
                      key={c.id ?? 'todos'}
                      onPress={() => setCategoria(c.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      style={[styles.chip, sel && styles.chipSel]}
                    >
                      <Text style={[styles.chipTexto, sel && { color: '#FFFFFF' }]}>{c.nombre}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={<Text style={styles.vacio}>No encontramos «{texto}». Prueba con otra palabra.</Text>}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.nahuatl}>{item.palabra_nahuat}</Text>
                <Text style={styles.espanol}>{item.traduccion_espanol}</Text>
                {practicadas.has(item.palabra_nahuat) && (
                  <View style={styles.dominada}>
                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.primaryDark} />
                    <Text style={styles.dominadaTexto}>Practicada</Text>
                  </View>
                )}
              </View>
              {item.audio_path && <BotonAudio audioPath={item.audio_path} etiqueta={item.palabra_nahuat} />}
            </View>
          )}
          ListFooterComponent={
            <View style={styles.consejo}>
              <MaterialCommunityIcons name="headphones" size={24} color={colors.tertiaryLip} />
              <View style={{ flex: 1 }}>
                <Text style={styles.consejoTitulo}>Consejo de pronunciación</Text>
                <Text style={styles.consejoTexto}>El acento tónico recae casi siempre en la penúltima sílaba.</Text>
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  contenido: { padding: 16, gap: 12, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 18, borderBottomWidth: 4, borderBottomColor: colors.primaryLip },
  heroChip: {
    alignSelf: 'flex-start', fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.5, color: colors.primaryTint,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, overflow: 'hidden',
  },
  heroTitulo: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, color: '#FFFFFF', marginTop: 10 },
  heroTexto: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#ECFDF5', marginTop: 4 },
  buscador: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 9999,
    borderWidth: 2, borderColor: colors.outline, paddingHorizontal: 16, height: 52,
  },
  buscadorInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4,
  },
  chipSel: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, borderBottomColor: colors.text },
  chipTexto: { fontFamily: fonts.title, fontSize: 14, color: colors.text },
  vacio: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  tarjeta: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline,
    borderBottomWidth: 4, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  nahuatl: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.text },
  espanol: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  dominada: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: colors.primaryTint, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999,
  },
  dominadaTexto: { fontFamily: fonts.heading, fontSize: 12, color: colors.primaryDark },
  consejo: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.mutedTint, borderRadius: 16, padding: 16, marginTop: 8 },
  consejoTitulo: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  consejoTexto: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
})
