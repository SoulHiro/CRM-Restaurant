import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTimeBR } from '@/lib/formatters'

const MM_TO_PT = 2.834645669
const LARGURA_BOBINA = 80 * MM_TO_PT
const ALTURA_MAXIMA = 200 * MM_TO_PT

const styles = StyleSheet.create({
  page: { padding: 14, fontFamily: 'Helvetica' },
  numero: { fontSize: 24, fontWeight: 700, marginBottom: 2 },
  mesa: { fontSize: 13, marginBottom: 6 },
  hora: { fontSize: 9, color: '#555', marginBottom: 10 },
  item: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 2,
    paddingBottom: 6,
    borderBottom: '0.5pt solid #ccc',
  },
  observacao: { fontSize: 10, color: '#333', marginBottom: 8 },
})

export interface ItemComandaCozinha {
  produtoNome: string
  quantidade: number
  observacao: string | null
}

export interface ComandaCozinhaDados {
  numero: number
  mesaLabel: string | null
  itens: ItemComandaCozinha[]
  impressoEm: string
}

export function ComandaCozinhaPDF({ comanda }: { comanda: ComandaCozinhaDados }) {
  return (
    <Document>
      <Page size={[LARGURA_BOBINA, ALTURA_MAXIMA]} orientation="portrait" style={styles.page}>
        <Text style={styles.numero}>Comanda #{comanda.numero}</Text>
        {comanda.mesaLabel && <Text style={styles.mesa}>{comanda.mesaLabel}</Text>}
        <Text style={styles.hora}>{formatDateTimeBR(comanda.impressoEm)}</Text>
        {comanda.itens.map((item, i) => (
          <View key={i}>
            <Text style={styles.item}>
              {item.quantidade}x {item.produtoNome}
            </Text>
            {item.observacao && (
              <Text style={styles.observacao}>Obs: {item.observacao}</Text>
            )}
          </View>
        ))}
      </Page>
    </Document>
  )
}
