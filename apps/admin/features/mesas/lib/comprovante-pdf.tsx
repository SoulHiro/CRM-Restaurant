import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTimeBR } from '@/lib/formatters'
import { formatarCentavosBRL } from './dinheiro'
import { FORMA_PAGAMENTO_LABEL, type FormaPagamento } from './types'

const MM_TO_PT = 2.834645669
const LARGURA_BOBINA = 80 * MM_TO_PT
const ALTURA_MAXIMA = 220 * MM_TO_PT

const styles = StyleSheet.create({
  page: { padding: 14, fontFamily: 'Helvetica' },
  nomeEstabelecimento: { fontSize: 16, fontWeight: 700, textAlign: 'center' },
  avisoNaoFiscal: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    padding: 4,
    border: '1pt solid #000',
  },
  meta: { fontSize: 10, marginBottom: 2, color: '#333' },
  linhaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginTop: 6,
  },
  divisor: {
    borderTop: '0.5pt solid #999',
    marginTop: 8,
    marginBottom: 8,
  },
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 13,
    fontWeight: 700,
  },
  linhaPagamento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginTop: 3,
  },
  rodape: { fontSize: 8, color: '#777', marginTop: 12, textAlign: 'center' },
})

export interface ItemComprovante {
  quantidade: number
  produtoNome: string
  totalCentavos: number
}

export interface PagamentoComprovante {
  forma: FormaPagamento
  valorCentavos: number
}

export interface ComprovanteDados {
  nomeEstabelecimento: string
  numero: number
  mesaLabel: string | null
  itens: ItemComprovante[]
  totalCentavos: number
  pagamentos: PagamentoComprovante[]
  trocoCentavos: number
  impressoEm: string
}

export function ComprovantePDF({ comanda }: { comanda: ComprovanteDados }) {
  return (
    <Document>
      <Page size={[LARGURA_BOBINA, ALTURA_MAXIMA]} orientation="portrait" style={styles.page}>
        <Text style={styles.nomeEstabelecimento}>{comanda.nomeEstabelecimento}</Text>
        <Text style={styles.avisoNaoFiscal}>DOCUMENTO SEM VALOR FISCAL</Text>

        <Text style={styles.meta}>Comanda #{comanda.numero}</Text>
        {comanda.mesaLabel && <Text style={styles.meta}>{comanda.mesaLabel}</Text>}

        {comanda.itens.map((item, i) => (
          <View key={i} style={styles.linhaItem}>
            <Text>
              {item.quantidade}x {item.produtoNome}
            </Text>
            <Text>{formatarCentavosBRL(item.totalCentavos)}</Text>
          </View>
        ))}

        <View style={styles.divisor} />

        <View style={styles.linhaTotal}>
          <Text>Total</Text>
          <Text>{formatarCentavosBRL(comanda.totalCentavos)}</Text>
        </View>

        <View style={styles.divisor} />

        {comanda.pagamentos.map((pagamento, i) => (
          <View key={i} style={styles.linhaPagamento}>
            <Text>{FORMA_PAGAMENTO_LABEL[pagamento.forma]}</Text>
            <Text>{formatarCentavosBRL(pagamento.valorCentavos)}</Text>
          </View>
        ))}

        {comanda.trocoCentavos > 0 && (
          <View style={styles.linhaPagamento}>
            <Text>Troco</Text>
            <Text>{formatarCentavosBRL(comanda.trocoCentavos)}</Text>
          </View>
        )}

        <Text style={styles.rodape}>{formatDateTimeBR(comanda.impressoEm)}</Text>
      </Page>
    </Document>
  )
}
