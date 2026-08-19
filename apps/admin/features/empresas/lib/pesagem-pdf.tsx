import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateBR, formatDateTimeSecondsBR } from '@/lib/formatters'
import type { ContagemPrato, QuantidadeItemPesagem } from './pesagem-helpers'

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
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  pesagemBloco: {
    flexBasis: '30%',
    flexGrow: 1,
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
  secaoTitulo: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 6,
  },
  colNome: { flex: 1, fontSize: 10.5 },
  colPratoIndividual: { flex: 1, fontSize: 10.5, color: '#444' },
})

export interface PesagemPedidoIndividual {
  nome: string
  prato: string | null
  tamanho: string | null
}

export interface PesagemDadosPapel {
  tituloGrupo: string
  empresaNome: string
  empresaEndereco: string
  data: string
  totalPessoas: number
  quantidades: QuantidadeItemPesagem[]
  itens: ContagemPrato[]
  /**
   * Pedidos avulsos que pertencem a esse mesmo papel (3º turno inteiro, e
   * quem foi marcado como "separado" dentro de 1º turno/administrativo/2º
   * turno) — aparecem aqui pra a cozinha ver tudo junto, mas continuam
   * imprimíveis como comanda individual à parte (ver `pedidos-tab.tsx`).
   */
  pedidosIndividuais: PesagemPedidoIndividual[]
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
          {dados.quantidades.map((item) => (
            <View key={item.chave} style={styles.pesagemBloco}>
              <Text style={styles.pesagemLabel}>{item.label.toUpperCase()}</Text>
              <Text style={styles.pesagemValor}>
                {item.valor}
                {item.unidade === 'g' ? 'G' : ' UNID'}
              </Text>
            </View>
          ))}
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

        {dados.pedidosIndividuais.length > 0 && (
          <View wrap={false}>
            <Text style={styles.secaoTitulo}>
              Pedidos individuais ({dados.pedidosIndividuais.length})
            </Text>
            <View style={styles.tabela}>
              <View style={styles.linhaCabecalho}>
                <Text style={[styles.colNome, styles.colCabecalho]}>NOME</Text>
                <Text style={[styles.colPratoIndividual, styles.colCabecalho]}>
                  PRATO
                </Text>
              </View>
              {dados.pedidosIndividuais.map((pedido, indice) => (
                <View key={indice} style={styles.linhaItem}>
                  <Text style={styles.colNome}>{pedido.nome}</Text>
                  <Text style={styles.colPratoIndividual}>
                    {pedido.prato ?? '—'}
                    {pedido.tamanho ? ` · ${pedido.tamanho}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.rodape}>
          Gerado em {formatDateTimeSecondsBR(dados.impressoEm)}
        </Text>
      </Page>
    </Document>
  )
}
