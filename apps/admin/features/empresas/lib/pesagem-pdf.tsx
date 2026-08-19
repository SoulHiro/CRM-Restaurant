import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateBR, formatDateTimeSecondsBR } from '@/lib/formatters'
import type { ContagemPrato } from './pesagem-helpers'

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 11 },
  titulo: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitulo: { fontSize: 11, color: '#444', marginBottom: 12 },
  metaLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1pt solid #000',
    paddingBottom: 8,
    marginBottom: 12,
  },
  metaBloco: { flexDirection: 'column' },
  metaLabel: { fontSize: 8.5, color: '#666', textTransform: 'uppercase' },
  metaValor: { fontSize: 12, fontWeight: 700 },
  pesagemLinha: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pesagemBloco: {
    flex: 1,
    border: '1.5pt solid #000',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  pesagemLabel: { fontSize: 10, fontWeight: 700 },
  pesagemValor: { fontSize: 24, fontWeight: 700, marginTop: 2 },
  tabela: { marginTop: 4 },
  linhaCabecalho: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    paddingBottom: 4,
    marginBottom: 4,
  },
  linhaItem: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #ccc',
    paddingVertical: 5,
  },
  colPrato: { flex: 1, fontSize: 10.5 },
  colQuantidade: { width: 90, fontSize: 10.5, textAlign: 'right' },
  colCabecalho: { fontSize: 9, fontWeight: 700, color: '#444' },
  rodape: { marginTop: 20, fontSize: 8.5, color: '#888' },
})

export interface PesagemDadosPapel {
  tituloGrupo: string
  empresaNome: string
  empresaEndereco: string
  data: string
  totalPessoas: number
  arrozGramas: number
  feijaoGramas: number
  itens: ContagemPrato[]
  impressoEm: string
}

/**
 * Papel de conferência da pesagem — layout próximo do `CONTROLE DE
 * PESAGEM.xlsx` original (empresa/data/headcount + tabela prato/quantidade),
 * mas tipografado como os outros documentos do sistema. A4, não bobina
 * térmica — é papel de referência pra conferência, não recibo.
 */
export function PesagemPDF({ dados }: { dados: PesagemDadosPapel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Controle de pesagem — {dados.tituloGrupo}</Text>
        <Text style={styles.subtitulo}>{dados.empresaNome}</Text>

        <View style={styles.metaLinha}>
          <View style={styles.metaBloco}>
            <Text style={styles.metaLabel}>Data</Text>
            <Text style={styles.metaValor}>{formatDateBR(dados.data)}</Text>
          </View>
          <View style={styles.metaBloco}>
            <Text style={styles.metaLabel}>Endereço</Text>
            <Text style={styles.metaValor}>{dados.empresaEndereco || '—'}</Text>
          </View>
          <View style={styles.metaBloco}>
            <Text style={styles.metaLabel}>Total de refeições</Text>
            <Text style={styles.metaValor}>{dados.totalPessoas}</Text>
          </View>
        </View>

        <View style={styles.pesagemLinha}>
          <View style={styles.pesagemBloco}>
            <Text style={styles.pesagemLabel}>ARROZ</Text>
            <Text style={styles.pesagemValor}>{dados.arrozGramas}G</Text>
          </View>
          <View style={styles.pesagemBloco}>
            <Text style={styles.pesagemLabel}>FEIJÃO</Text>
            <Text style={styles.pesagemValor}>{dados.feijaoGramas}G</Text>
          </View>
        </View>

        <View style={styles.tabela}>
          <View style={styles.linhaCabecalho}>
            <Text style={[styles.colPrato, styles.colCabecalho]}>PRATO</Text>
            <Text style={[styles.colQuantidade, styles.colCabecalho]}>
              QUANTIDADE
            </Text>
          </View>
          {dados.itens.map((item) => (
            <View key={item.prato} style={styles.linhaItem}>
              <Text style={styles.colPrato}>{item.prato}</Text>
              <Text style={styles.colQuantidade}>{item.quantidade} UNID</Text>
            </View>
          ))}
        </View>

        <Text style={styles.rodape}>
          Gerado em {formatDateTimeSecondsBR(dados.impressoEm)}
        </Text>
      </Page>
    </Document>
  )
}
