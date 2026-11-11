import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState, type ComponentProps } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Encabezado } from '@/components/encabezado'
import { Arcos } from '@/components/ornamentos'
import { PalabraDelDia } from '@/components/palabra-del-dia'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Icono = ComponentProps<typeof MaterialCommunityIcons>['name']
type Tarjeta = { id: string; nombre: string; descripcion: string | null; total: number; hechas: number }

const ICONOS: Record<string, Icono> = {
  Expresiones: 'chat-processing-outline',
  Animales: 'paw-outline',
  Alimentos: 'corn',
  Hogar: 'home-outline',
}

// Pantalla de inicio «Aprender» (diseño «Yoltok Login»): el usuario elige primero la categoría.
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
      {/* Detrás de todo y fuera del ScrollView, para que no lo recorte (abajo a la derecha, como en el diseño). */}
      <Arcos estilo={{ right: -170, bottom: 40 }} />
      <Encabezado />
      {error ? (
        <View style={styles.centro}><Text style={styles.error}>Error: {error}</Text></View>
      ) : !tarjetas ? (
        <View style={styles.centro}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={{ gap: 6 }}>
            <Text style={styles.titulo}>¿Qué quieres aprender?</Text>
            <Text style={styles.subtitulo}>Elige una categoría para empezar tu ruta en náhuatl.</Text>
          </View>
          <View style={styles.rejilla}>
            {tarjetas.map((t) => {
              const pronto = !t.total
              return (
                <Pressable
                  key={t.id}
                  onPress={() => abrir(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.nombre}. ${pronto ? 'Próximamente' : `${t.hechas} de ${t.total} lecciones`}`}
                  style={({ pressed }) => [styles.tarjeta, pronto ? styles.tarjetaPronto : styles.tarjetaActiva, pressed && !pronto && { opacity: 0.85 }]}
                >
                  <View style={[styles.iconoCaja, { backgroundColor: pronto ? colors.mutedTint : colors.primaryTint }]}>
                    <MaterialCommunityIcons name={ICONOS[t.nombre] ?? 'book-open-outline'} size={24} color={pronto ? colors.icon : colors.primary} />
                  </View>
                  <Text style={[styles.nombre, pronto && { color: '#3A3E3C' }]}>{t.nombre}</Text>
                  {t.descripcion && <Text style={styles.descripcion} numberOfLines={4}>{t.descripcion}</Text>}
                  <View style={[styles.estado, { backgroundColor: pronto ? colors.mutedTint : colors.primaryTint }]}>
                    <MaterialCommunityIcons name={pronto ? 'lock-outline' : 'check'} size={13} color={pronto ? colors.textMuted : colors.primaryText} />
                    <Text style={[styles.estadoTexto, { color: pronto ? colors.textMuted : colors.primaryText }]}>
                      {pronto ? 'Próximamente' : `${t.hechas} de ${t.total} lecciones`}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
          <PalabraDelDia tarjeta />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  contenido: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 32, gap: 18, maxWidth: 480, width: '100%', alignSelf: 'center' },
  titulo: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: colors.text },
  subtitulo: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tarjeta: { width: '47%', flexGrow: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 14, gap: 10 },
  tarjetaActiva: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary,
    shadowColor: colors.primaryDark, shadowOpacity: 0.1, shadowRadius: 11, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  tarjetaPronto: { backgroundColor: colors.cardMuted, borderWidth: 1, borderColor: colors.outline },
  iconoCaja: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  descripcion: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, flexGrow: 1 },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', height: 26, paddingHorizontal: 10, borderRadius: 9999 },
  estadoTexto: { fontFamily: fonts.title, fontSize: 11.5 },
})
