import { StyleSheet } from 'react-native'
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg'

import { colors } from '@/theme'

// Ornamentos del diseño «Yoltok Login»: grecas, emblema, glifo xochitl y arcos de fondo.

// Banda de grecas (escalonado) de la parte superior.
export function GrecaArriba() {
  return (
    <Svg width="100%" height={18} accessible={false}>
      <Defs>
        <Pattern id="grecaTop" x={0} y={0} width={32} height={16} patternUnits="userSpaceOnUse">
          <Rect x={0} y={0} width={32} height={16} fill={colors.primary} />
          <Path d="M0 14 V10 H4 V6 H8 V2 H28 V12 H20 V7 H24 V5 H16 V9 H12 V12 H8 V14 Z" fill={colors.background} opacity={0.9} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height={16} fill="url(#grecaTop)" />
      <Rect x={0} y={16} width="100%" height={2} fill={colors.tertiary} />
    </Svg>
  )
}

// Banda de grecas de la parte inferior.
export function GrecaAbajo() {
  return (
    <Svg width="100%" height={12} accessible={false}>
      <Defs>
        <Pattern id="grecaBottom" x={0} y={0} width={20} height={10} patternUnits="userSpaceOnUse">
          <Rect x={0} y={0} width={20} height={10} fill={colors.primaryDark} />
          <Path d="M0 10 V6 H5 V2 H10 V6 H15 V10 Z" fill={colors.tertiary} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height={2} fill={colors.tertiary} />
      <Rect x={0} y={2} width="100%" height={10} fill="url(#grecaBottom)" />
    </Svg>
  )
}

// Emblema: hoja dentro de un chalchihuitl con vírgula de la palabra.
export function Emblema({ tamano = 72 }: { tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 86 86" accessibilityLabel="Emblema de Yoltok">
      <Circle cx={40} cy={40} r={35} fill="#FFFFFF" stroke={colors.primaryDark} strokeWidth={2} />
      <Circle cx={40} cy={40} r={28} fill="none" stroke={colors.primary} strokeWidth={3} />
      <Path d="M27 53 C27 38 37 27 53 27 C53 42 43 53 27 53 Z" fill={colors.primary} />
      <Path d="M27 53 L45 35" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      <Path d="M63 64 C72 69 81 62 78 54 C76 48 69 50 70 55" fill="none" stroke={colors.tertiary} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  )
}

// Glifo de flor (xochitl) de la «Palabra del día».
export function GlifoFlor({ tamano = 26 }: { tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 44 44" accessible={false}>
      {[[22, 11], [33, 22], [22, 33], [11, 22]].map(([cx, cy]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={8} fill="none" stroke={colors.tertiary} strokeWidth={2.5} />
      ))}
      <Circle cx={22} cy={22} r={4} fill={colors.primary} />
    </Svg>
  )
}

// Arcos concéntricos tenues detrás del contenido.
// La transparencia va en cada trazo (strokeOpacity): la opacidad del contenedor casi no se veía en Android.
export function Arcos({ estilo }: { estilo: object }) {
  const trazo = { fill: 'none', stroke: colors.primaryDark, strokeOpacity: 0.09 }
  return (
    <Svg width={320} height={320} viewBox="0 0 320 320" style={[styles.arcos, estilo]} accessible={false} pointerEvents="none">
      <Circle cx={160} cy={160} r={150} strokeWidth={6} {...trazo} />
      <Circle cx={160} cy={160} r={118} strokeWidth={18} {...trazo} />
      <Circle cx={160} cy={160} r={70} strokeWidth={6} {...trazo} />
    </Svg>
  )
}

const styles = StyleSheet.create({
  arcos: { position: 'absolute' },
})
