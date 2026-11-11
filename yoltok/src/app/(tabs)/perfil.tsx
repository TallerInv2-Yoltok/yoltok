import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState, type ComponentProps } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Encabezado } from '@/components/encabezado'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Icono = ComponentProps<typeof MaterialCommunityIcons>['name']
type Datos = {
  nombre: string
  puntos: number
  vidas: number
  lecciones: number
  completadas: number
  precision: number | null
  dominadas: number
  encuesta: boolean
}

// Metas y progreso (diseño "metas_y_progreso_yoltok").
// Racha y audios del diseño no se muestran: no hay datos para ellos todavía.
export default function Perfil() {
  const { session } = useAuth()
  const [datos, setDatos] = useState<Datos | null>(null)
  const [error, setError] = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    if (!session) return
    const userId = session.user.id
    Promise.all([
      supabase.from('usuarios').select('nombre, puntos, vidas').eq('id', userId).maybeSingle(),
      supabase.from('lecciones').select('id'),
      supabase.from('progreso_usuarios').select('leccion_id, aciertos').eq('usuario_id', userId).eq('completada', true),
      supabase.from('ejercicios').select('leccion_id, palabra_id'),
      supabase.from('encuestas_usabilidad').select('id').eq('usuario_id', userId).maybeSingle(),
    ]).then(([u, l, pr, e, en]) => {
      const fallo = u.error ?? l.error ?? pr.error ?? e.error ?? en.error
      if (fallo) return setError(fallo.message)
      const progreso = pr.data ?? []
      const hechas = new Set(progreso.map((p) => p.leccion_id))
      const ejerciciosHechos = (e.data ?? []).filter((x) => hechas.has(x.leccion_id))
      const aciertos = progreso.reduce((s, p) => s + p.aciertos, 0)
      setDatos({
        nombre: u.data?.nombre || 'Estudiante',
        puntos: u.data?.puntos ?? 0,
        vidas: u.data?.vidas ?? 0,
        lecciones: l.data?.length ?? 0,
        completadas: hechas.size,
        // Aciertos al primer intento sobre ejercicios de lecciones completadas (igual que en la victoria).
        precision: ejerciciosHechos.length ? Math.round((aciertos / ejerciciosHechos.length) * 100) : null,
        dominadas: new Set(ejerciciosHechos.map((x) => x.palabra_id).filter(Boolean)).size,
        encuesta: !!en.data,
      })
    })
  }, [session]))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Encabezado />
      {error ? (
        <View style={styles.centro}><Text style={styles.error}>Error: {error}</Text></View>
      ) : !datos ? (
        <View style={styles.centro}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.perfil}>
            <View style={styles.perfilFila}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="school-outline" size={30} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{datos.nombre}</Text>
                <Text style={styles.correo}>{session?.user.email}</Text>
                <View style={styles.lugar}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.correo}>Instituto Tecnológico de Minatitlán</Text>
                </View>
              </View>
            </View>
            <View style={styles.proyecto}>
              <MaterialCommunityIcons name="check-decagram-outline" size={18} color={colors.secondaryLip} />
              <Text style={styles.proyectoTexto}>Proyecto de investigación M-Learning · Taller de Investigación II</Text>
            </View>
          </View>

          <View style={styles.rejilla}>
            <Stat icono="heart" color={colors.error} fondo={colors.errorTint} titulo="VIDAS" valor={`${datos.vidas} / 5`} pie="Corazones disponibles" />
            <Stat icono="star" color={colors.tertiaryLip} fondo={colors.tertiaryTint} titulo="EXPERIENCIA" valor={`${datos.puntos} XP`} pie="Puntos totales" />
            <Stat
              icono="target"
              color={colors.primaryDark}
              fondo={colors.primaryTint}
              titulo="ACIERTOS"
              valor={datos.precision === null ? '—' : `${datos.precision}%`}
              pie="Precisión al primer intento"
            />
            <Stat icono="book-check-outline" color={colors.secondaryLip} fondo={colors.secondaryTint} titulo="VOCABULARIO" valor={String(datos.dominadas)} pie="Palabras dominadas" />
          </View>

          <View style={styles.metasTitulo}>
            <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.tertiaryLip} />
            <Text style={styles.seccion}>Mis metas</Text>
          </View>

          <Meta
            titulo="Completar las lecciones"
            texto={`${datos.completadas} de ${datos.lecciones} lecciones disponibles`}
            avance={datos.lecciones ? datos.completadas / datos.lecciones : 0}
          />
          <Meta
            titulo="Responder la encuesta de usabilidad"
            texto="Evaluación según la norma ISO 9241-11 para validación académica."
            avance={datos.encuesta ? 1 : 0}
          >
            {!datos.encuesta && <Button title="Ir a la encuesta" onPress={() => router.push('/encuesta')} />}
          </Meta>

          <View style={styles.aviso}>
            <MaterialCommunityIcons name="trophy" size={28} color={colors.tertiary} />
            <Text style={styles.avisoTexto}>
              {datos.encuesta
                ? '¡Tasohkamati! Ya completaste tu evaluación. Tus respuestas fortalecen la preservación del náhuatl.'
                : '¡Estás a un paso de concluir la prueba de Yoltok! Tus respuestas fortalecen la preservación del náhuatl.'}
            </Text>
          </View>

          <Button variant="text" title="Cerrar sesión" onPress={() => supabase.auth.signOut()} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Stat({ icono, color, fondo, titulo, valor, pie }: { icono: Icono; color: string; fondo: string; titulo: string; valor: string; pie: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: fondo, borderBottomColor: color }]} accessible accessibilityLabel={`${titulo}: ${valor}. ${pie}`}>
      <View style={styles.statFila}>
        <MaterialCommunityIcons name={icono} size={24} color={color} />
        <Text style={[styles.statTitulo, { color }]}>{titulo}</Text>
      </View>
      <Text style={[styles.statValor, { color }]}>{valor}</Text>
      <Text style={styles.statPie}>{pie}</Text>
    </View>
  )
}

function Meta({ titulo, texto, avance, children }: { titulo: string; texto: string; avance: number; children?: React.ReactNode }) {
  const lista = avance >= 1
  return (
    <View style={styles.meta}>
      <View style={styles.metaFila}>
        {lista && <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />}
        <Text style={styles.metaTitulo}>{titulo}</Text>
        <Text style={[styles.metaEstado, lista && styles.metaEstadoListo]}>{lista ? '✓ Completado' : `${Math.round(avance * 100)}%`}</Text>
      </View>
      <Text style={styles.metaTexto}>{texto}</Text>
      <View style={styles.barra}>
        <View style={[styles.barraLlena, { width: `${Math.min(avance, 1) * 100}%` }]} />
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  contenido: { padding: 16, gap: 14, paddingBottom: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
  perfil: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4, padding: 16, gap: 12 },
  perfilFila: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  correo: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  lugar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  proyecto: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12 },
  proyectoTexto: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.text },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '47%', flexGrow: 1, borderRadius: 16, padding: 14, gap: 4, borderBottomWidth: 4 },
  statFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statTitulo: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 0.5 },
  statValor: { fontFamily: fonts.heading, fontSize: 26, marginTop: 4 },
  statPie: { fontFamily: fonts.body, fontSize: 12, color: colors.text },
  metasTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  seccion: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  meta: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4, padding: 16, gap: 10 },
  metaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaTitulo: { flex: 1, fontFamily: fonts.title, fontSize: 16, color: colors.text },
  metaEstado: {
    fontFamily: fonts.heading, fontSize: 12, color: colors.textMuted, backgroundColor: colors.outline,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, overflow: 'hidden',
  },
  metaEstadoListo: { color: colors.primaryDark, backgroundColor: colors.primaryTint },
  metaTexto: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  barra: { height: 12, borderRadius: 9999, backgroundColor: colors.outline, overflow: 'hidden' },
  barraLlena: { height: '100%', backgroundColor: colors.primary, borderRadius: 9999 },
  aviso: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16 },
  avisoTexto: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
})
