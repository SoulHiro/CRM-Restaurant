import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTimeBR } from '@/lib/formatters'

const MM_TO_PT = 2.834645669
const LARGURA_BOBINA = 80 * MM_TO_PT
const ALTURA_MAXIMA = 120 * MM_TO_PT

const styles = StyleSheet.create({
  page: { padding: 14, fontFamily: 'Helvetica' },
  estabelecimento: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  meta: { fontSize: 9, color: '#555', marginBottom: 2 },
  empresaCliente: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 8,
    borderTop: '0.5pt solid #999',
  },
  tamanhosLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    border: '1.5pt solid #000',
    borderRadius: 2,
    padding: 8,
    marginBottom: 10,
  },
  tamanhoBloco: { alignItems: 'center' },
  tamanhoLabel: { fontSize: 11, fontWeight: 700 },
  tamanhoValor: { fontSize: 28, fontWeight: 700 },
  extraLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    marginBottom: 4,
  },
})

export interface ResumoDiaDados {
  nomeEstabelecimento: string
  cnpj: string
  empresaClienteNome: string
  impressoEm: string
  quantidadeP: number
  quantidadeM: number
  quantidadeG: number
  quantidadeCafe: number
  quantidadeSuco: number
  quantidadeLanche: number
}

/** Nota única de fechamento do dia — 80mm, uma página só, sem itemização. */
export function ResumoDiaPDF({ dados }: { dados: ResumoDiaDados }) {
  return (
    <Document>
      <Page
        size={[LARGURA_BOBINA, ALTURA_MAXIMA]}
        orientation="portrait"
        style={styles.page}
      >
        <Text style={styles.estabelecimento}>{dados.nomeEstabelecimento}</Text>
        {dados.cnpj && <Text style={styles.meta}>CNPJ: {dados.cnpj}</Text>}
        <Text style={styles.meta}>
          Impresso em {formatDateTimeBR(dados.impressoEm)}
        </Text>

        <Text style={styles.empresaCliente}>{dados.empresaClienteNome}</Text>

        <View style={styles.tamanhosLinha}>
          <View style={styles.tamanhoBloco}>
            <Text style={styles.tamanhoLabel}>P</Text>
            <Text style={styles.tamanhoValor}>{dados.quantidadeP}</Text>
          </View>
          <View style={styles.tamanhoBloco}>
            <Text style={styles.tamanhoLabel}>M</Text>
            <Text style={styles.tamanhoValor}>{dados.quantidadeM}</Text>
          </View>
          <View style={styles.tamanhoBloco}>
            <Text style={styles.tamanhoLabel}>G</Text>
            <Text style={styles.tamanhoValor}>{dados.quantidadeG}</Text>
          </View>
        </View>

        <View style={styles.extraLinha}>
          <Text>Café</Text>
          <Text>{dados.quantidadeCafe}</Text>
        </View>
        <View style={styles.extraLinha}>
          <Text>Suco</Text>
          <Text>{dados.quantidadeSuco}</Text>
        </View>
        <View style={styles.extraLinha}>
          <Text>Lanche</Text>
          <Text>{dados.quantidadeLanche}</Text>
        </View>
      </Page>
    </Document>
  )
}
