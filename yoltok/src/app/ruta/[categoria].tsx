import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Encabezado } from '@/components/encabezado'
import { useAuth } from '@/lib/auth'
import { estadosRuta, type Estado, type Leccion } from '@/lib/ruta'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Categoria = { nombre: string; descripcion: string | null }
type Palabra = { palabra_nahuat: string; traduccion_espanol: string }
type Nodo = Leccion & { estado: Estado }

// Zigzag del camino, como en el diseño de Stitch.
const DESPLAZAMIENTO = [0, 56, 0, -56]

// Ruta de aprendizaje de una categoría (diseño "ruta_de_aprendizaje_yoltok").
export default function Ruta() {
  const { categoria: categoriaId } = useLocalSearchParams<{ categoria: string }>()
  const { session } = useAuth()
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [nodos, setNodos] = useState<Nodo[] | null>(null)
  const [palabra, setPalabra] = useState<Palabra | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Al volver de una lección se recarga para mostrar el avance.
  useFocusEffect(useCallback(() => {
    if (!session) return // al cerrar sesión la pantalla aún se pinta una vez sin sesión
    const userId = session.user.id
    Promise.all([
      supabase.from('categorias').select('nombre, descripcion').eq('id', categoriaId).maybeSingle(),
      supabase.from('lecciones').select('id, titulo, nivel, orden, activa').eq('categoria_id', categoriaId).order('orden'),
      supabase.from('progreso_usuarios').select('leccion_id').eq('usuario_id', userId).eq('completada', true),
      supabase.from('palabras').select('palabra_nahuat, traduccion_espanol').eq('categoria_id', categoriaId).neq('palabra_nahuat', '').order('id'),
    ]).then(([c, l, pr, pa]) => {
      const fallo = c.error ?? l.error ?? pr.error ?? pa.error
      if (fallo) return setError(fallo.message)
      setCategoria(c.data)
      setNodos(estadosRuta(l.data ?? [], new Set((pr.data ?? []).map((x) => x.leccion_id))))
      const lista = pa.data ?? []
      // Una palabra distinta cada día.
      if (lista.length) setPalabra(lista[Math.floor(Date.now() / 86_400_000) % lista.length])
    })
  }, [session, categoriaId]))

  const activas = nodos?.filter((n) => n.estado !== 'proximamente') ?? []
  const hechas = activas.filter((n) => n.estado === 'completada').length
  const actual = nodos?.find((n) => n.estado === 'actual')

  function tocarNodo(n: Nodo) {
    if (n.estado === 'bloqueada') {
      Alert.alert('Lección bloqueada', `Completa primero «${actual?.titulo}» para desbloquear esta lección.`)
    } else if (n.estado === 'proximamente') {
      Alert.alert('Próximamente', 'Esta lección todavía se está preparando.')
    } else {
      router.push({ pathname: '/leccion/[id]', params: { id: n.id } })
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Encabezado atras />
      {error ? (
        <View style={styles.centro}><Text style={styles.error}>Error: {error}</Text></View>
      ) : !nodos ? (
        <View style={styles.centro}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.etapa}>
            <Text style={styles.etapaChip}>● {categoria?.nombre.toUpperCase()} • NIVEL {actual?.nivel ?? 1}</Text>
            <Text style={styles.etapaTitulo}>{actual?.titulo ?? (activas.length ? '¡Categoría completada!' : 'Próximamente')}</Text>
            {categoria?.descripcion && <Text style={styles.etapaTexto}>{categoria.descripcion}</Text>}
            <View style={styles.etapaPie}>
              <Text style={styles.etapaProgreso}>{hechas} de {activas.length} lecciones completadas</Text>
              <View style={styles.barra}>
                <View style={[styles.barraLlena, { width: `${activas.length ? (hechas / activas.length) * 100 : 0}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.camino}>
            {nodos.map((n, i) => (
              <NodoRuta key={n.id} nodo={n} desplazamiento={DESPLAZAMIENTO[i % DESPLAZAMIENTO.length]} onPress={() => tocarNodo(n)} />
            ))}
          </View>

          {palabra && (
            <View style={styles.tarjeta}>
              <View style={styles.tarjetaHeader}>
                <MaterialCommunityIcons name="translate" size={22} color={colors.secondaryLip} />
                <Text style={styles.tarjetaTitulo}>Palabra de hoy en náhuatl</Text>
              </View>
              <View style={styles.palabraCaja}>
                <Text style={styles.palabraNahuat}>{palabra.palabra_nahuat}</Text>
                <Text style={styles.palabraEsp}>{palabra.traduccion_espanol}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function NodoRuta({ nodo, desplazamiento, onPress }: { nodo: Nodo; desplazamiento: number; onPress: () => void }) {
  const { estado } = nodo
  const activo = estado === 'actual'
  const verde = estado === 'completada' || activo
  const icono = estado === 'completada' ? 'check-bold' : activo ? 'star' : 'lock'
  return (
    <View style={[styles.nodo, { transform: [{ translateX: desplazamiento }] }]}>
      {activo && <Text style={styles.empezar}>● ¡EMPEZAR!</Text>}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${nodo.titulo}, ${estado}`}
        style={({ pressed }) => [
          styles.circulo,
          activo && styles.circuloActual,
          verde ? styles.circuloVerde : styles.circuloGris,
          estado === 'proximamente' && { opacity: 0.6 },
          pressed && verde && { transform: [{ translateY: 4 }], borderBottomWidth: 0 },
        ]}
      >
        <MaterialCommunityIcons name={icono} size={activo ? 40 : 32} color={verde ? (activo ? colors.tertiaryTint : '#FFFFFF') : colors.disabledText} />
        {activo && <Text style={styles.nivel}>NIVEL {nodo.nivel}</Text>}
      </Pressable>
      <Text style={[styles.nodoLabel, activo && styles.nodoLabelActual, !verde && { color: colors.textMuted }]}>
        {nodo.titulo}{estado === 'proximamente' ? ' • Próximamente' : ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  contenido: { padding: 16, gap: 24, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  etapa: { backgroundColor: colors.primary, borderRadius: 16, padding: 18, borderBottomWidth: 4, borderBottomColor: colors.primaryLip, overflow: 'hidden' },
  etapaChip: {
    alignSelf: 'flex-start',
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.primaryTint,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  etapaTitulo: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: '#FFFFFF', marginTop: 10 },
  etapaTexto: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#ECFDF5', marginTop: 4 },
  etapaPie: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  etapaProgreso: { flex: 1, fontFamily: fonts.title, fontSize: 13, color: '#FFFFFF' },
  barra: { width: 90, height: 10, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  barraLlena: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 9999 },
  camino: { alignItems: 'center', gap: 28, paddingVertical: 8 },
  nodo: { alignItems: 'center', gap: 8 },
  empezar: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.primaryDark,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  circulo: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6 },
  circuloActual: { width: 96, height: 96, borderRadius: 48 },
  circuloVerde: { backgroundColor: colors.primaryDark, borderBottomColor: '#004D33' },
  circuloGris: { backgroundColor: '#E2E8F0', borderBottomColor: colors.outlineLip },
  nivel: { fontFamily: fonts.heading, fontSize: 11, color: '#FFFFFF', marginTop: -2 },
  nodoLabel: {
    fontFamily: fonts.title,
    fontSize: 13,
    color: colors.text,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.outline,
    overflow: 'hidden',
    maxWidth: 240,
    textAlign: 'center',
  },
  nodoLabelActual: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, color: '#FFFFFF' },
  tarjeta: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: colors.outline, padding: 16, gap: 12 },
  tarjetaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tarjetaTitulo: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  palabraCaja: { backgroundColor: colors.secondaryTint, borderRadius: 12, padding: 14 },
  palabraNahuat: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.primaryDark },
  palabraEsp: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, marginTop: 2 },
})
