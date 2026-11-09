import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState, type ComponentProps } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Encabezado } from '@/components/encabezado'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Icono = ComponentProps<typeof MaterialCommunityIcons>['name']
type Tarjeta = { id: string; nombre: string; descripcion: string | null; total: number; hechas: number }

const ICONOS: Record<string, Icono> = {
  Expresiones: 'chat-processing',
  Animales: 'paw',
  Alimentos: 'corn',
  Hogar: 'home-variant',
}

const TONOS = [
  { fondo: colors.primaryTint, icono: colors.primaryDark },
  { fondo: colors.secondaryTint, icono: colors.secondaryLip },
  { fondo: colors.tertiaryTint, icono: colors.tertiaryLip },
]

// Pantalla de inicio: el usuario elige primero la categoría (retroalimentación del taller).
export default function Categorias() {
  const { session } = useAuth()
  const [tarjetas, setTarjetas] = useState<Tarjeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    if (!session) return // al cerrar sesión la pantalla aún se pinta una vez sin sesión
    Promise.all([
      supabase.from('categorias').select('id, nombre, descripcion').order('orden'),
      supabase.from('lecciones').select('id, categoria_id'),
      supabase.from('progreso_usuarios').select('leccion_id').eq('usuario_id', session.user.id).eq('completada', true),
    ]).then(([c, l, pr]) => {
      const fallo = c.error ?? l.error ?? pr.error
      if (fallo) return setError(fallo.message)
      const completadas = new Set((pr.data ?? []).map((x) => x.leccion_id))
      // La política RLS solo deja ver lecciones activas: total 0 = categoría sin contenido aún.
      setTarjetas(
        (c.data ?? []).map((cat) => {
          const suyas = (l.data ?? []).filter((x) => x.categoria_id === cat.id)
          return { ...cat, total: suyas.length, hechas: suyas.filter((x) => completadas.has(x.id)).length }
        }),
      )
    })
  }, [session]))

  function abrir(t: Tarjeta) {
    if (!t.total) return Alert.alert('Próximamente', `Las lecciones de «${t.nombre}» todavía se están preparando.`)
    router.push({ pathname: '/ruta/[categoria]', params: { categoria: t.id } })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Encabezado />
      {error ? (
        <View style={styles.centro}><Text style={styles.error}>Error: {error}</Text></View>
      ) : !tarjetas ? (
        <View style={styles.centro}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido}>
          <Text style={styles.titulo}>¿Qué quieres aprender?</Text>
          <Text style={styles.subtitulo}>Elige una categoría para empezar tu ruta en náhuat.</Text>
          <View style={styles.rejilla}>
            {tarjetas.map((t, i) => {
              const tono = TONOS[i % TONOS.length]
              const pronto = !t.total
              return (
                <Pressable
                  key={t.id}
                  onPress={() => abrir(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.nombre}. ${pronto ? 'Próximamente' : `${t.hechas} de ${t.total} lecciones`}`}
                  style={({ pressed }) => [styles.tarjeta, pronto && styles.tarjetaPronto, pressed && !pronto && styles.presionada]}
                >
                  <View style={[styles.iconoCaja, { backgroundColor: pronto ? colors.outline : tono.fondo }]}>
                    <MaterialCommunityIcons
                      name={ICONOS[t.nombre] ?? 'book-open-variant'}
                      size={30}
                      color={pronto ? colors.disabledText : tono.icono}
                    />
                  </View>
                  <Text style={styles.nombre}>{t.nombre}</Text>
                  {t.descripcion && <Text style={styles.descripcion} numberOfLines={3}>{t.descripcion}</Text>}
                  <View style={[styles.estado, pronto ? styles.estadoPronto : styles.estadoActivo]}>
                    {pronto && <MaterialCommunityIcons name="lock" size={12} color={colors.textMuted} />}
                    <Text style={[styles.estadoTexto, { color: pronto ? colors.textMuted : colors.primaryDark }]}>
                      {pronto ? 'Próximamente' : `${t.hechas} de ${t.total} lecciones`}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  contenido: { padding: 16, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  titulo: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34, color: colors.text },
  subtitulo: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tarjeta: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.outline,
    borderBottomWidth: 5,
    borderBottomColor: colors.outlineLip,
    padding: 14,
    gap: 8,
  },
  tarjetaPronto: { backgroundColor: colors.surface },
  presionada: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  iconoCaja: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  descripcion: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted, flexGrow: 1 },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  estadoActivo: { backgroundColor: colors.primaryTint },
  estadoPronto: { backgroundColor: colors.outline },
  estadoTexto: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.3 },
})
