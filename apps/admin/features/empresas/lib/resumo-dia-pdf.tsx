import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatCurrencyBRL, formatDateTimeSecondsBR } from '@/lib/formatters'

const MM_TO_PT = 2.834645669
const LARGURA_BOBINA = 80 * MM_TO_PT

const PADDING_PAGINA = 14
const ALTURA_CABECALHO = 235
const ALTURA_POR_ITEM = 46
const ALTURA_RODAPE = 130
const ALTURA_MINIMA = 300

const styles = StyleSheet.create({
  page: { padding: PADDING_PAGINA, fontFamily: 'Helvetica', fontSize: 10 },
  quantidadesLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    border: '1.5pt solid #000',
    borderRadius: 2,
    padding: 6,
    marginBottom: 4,
  },
  quantidadeBloco: { alignItems: 'center', flex: 1 },
  quantidadeLabel: { fontSize: 9, fontWeight: 700 },
  quantidadeValor: { fontSize: 18, fontWeight: 700 },
  estabelecimento: { fontSize: 15, fontWeight: 700, marginTop: 8 },
  metaLinha: { fontSize: 8.5, color: '#333' },
  cnpjIeLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8.5,
    color: '#333',
  },
  divisoria: {
    borderTop: '0.75pt solid #000',
    marginTop: 8,
    paddingTop: 6,
  },
  empresaCliente: {
    fontSize: 12.5,
    fontWeight: 700,
    marginTop: 2,
    marginBottom: 8,
  },
  itemBloco: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '0.5pt dashed #999',
  },
  itemLinhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemPrato: { fontSize: 11, fontWeight: 700, flex: 1, marginRight: 6 },
  itemPreco: { fontSize: 11, fontWeight: 700 },
  itemTamanho: { fontSize: 9, color: '#333', marginTop: 1 },
  itemNome: { fontSize: 9.5, marginTop: 1 },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10.5,
    marginBottom: 4,
  },
  totalPagarLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 13,
    fontWeight: 700,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1pt solid #000',
  },
})

const ORDEM_TAMANHO: Record<'G' | 'M' | 'P', number> = { G: 0, M: 1, P: 2 }

export interface ItemResumoDia {
  colaboradorNome: string
  prato: string | null
  tamanho: 'P' | 'M' | 'G'
  preco: number
}

export interface ResumoDiaDados {
  nomeEstabelecimento: string
  endereco: string
  cnpj: string
  inscricaoEstadual: string
  empresaClienteNome: string
  impressoEm: string
  itens: ItemResumoDia[]
  quantidadeCafe: number
  precoUnitarioCafe: number
  quantidadeSuco: number
  precoUnitarioSuco: number
  quantidadeLanche: number
  precoUnitarioLanche: number
}

function contarTamanho(itens: ItemResumoDia[], tamanho: 'P' | 'M' | 'G') {
  return itens.filter((item) => item.tamanho === tamanho).length
}

/**
 * Altura calculada pelo conteúdo, não fixa — numa bobina térmica a "altura
 * da página" é o comprimento real de papel impresso. Uma altura fixa grande
 * demais imprimiria papel em branco antes do corte; uma pequena demais
 * cortaria o pedido.
 */
function calcularAltura(quantidadeItens: number): number {
  const altura =
    ALTURA_CABECALHO + quantidadeItens * ALTURA_POR_ITEM + ALTURA_RODAPE
  return Math.max(ALTURA_MINIMA, altura)
}

/** Nota de fechamento do dia — 80mm, itemizada, uma marmita por bloco. */
export function ResumoDiaPDF({ dados }: { dados: ResumoDiaDados }) {
  const itensOrdenados = [...dados.itens].sort(
    (a, b) => ORDEM_TAMANHO[a.tamanho] - ORDEM_TAMANHO[b.tamanho]
  )

  const totalCafe = dados.quantidadeCafe * dados.precoUnitarioCafe
  const totalSuco = dados.quantidadeSuco * dados.precoUnitarioSuco
  const totalLanche = dados.quantidadeLanche * dados.precoUnitarioLanche
  const totalItens = dados.itens.reduce((soma, item) => soma + item.preco, 0)
  const totalAPagar = totalItens + totalCafe + totalSuco + totalLanche

  return (
    <Document>
      <Page
        size={[LARGURA_BOBINA, calcularAltura(itensOrdenados.length)]}
        orientation="portrait"
        style={styles.page}
      >
        <View style={styles.quantidadesLinha}>
          <View style={styles.quantidadeBloco}>
            <Text style={styles.quantidadeLabel}>P</Text>
            <Text style={styles.quantidadeValor}>
              {contarTamanho(dados.itens, 'P')}
            </Text>
          </View>
          <View style={styles.quantidadeBloco}>
            <Text style={styles.quantidadeLabel}>M</Text>
            <Text style={styles.quantidadeValor}>
              {contarTamanho(dados.itens, 'M')}
            </Text>
          </View>
          <View style={styles.quantidadeBloco}>
            <Text style={styles.quantidadeLabel}>G</Text>
            <Text style={styles.quantidadeValor}>
              {contarTamanho(dados.itens, 'G')}
            </Text>
          </View>
          <View style={styles.quantidadeBloco}>
            <Text style={styles.quantidadeLabel}>Lanche</Text>
            <Text style={styles.quantidadeValor}>{dados.quantidadeLanche}</Text>
          </View>
          <View style={styles.quantidadeBloco}>
            <Text style={styles.quantidadeLabel}>Café</Text>
            <Text style={styles.quantidadeValor}>{dados.quantidadeCafe}</Text>
          </View>
          <View style={styles.quantidadeBloco}>
            <Text style={styles.quantidadeLabel}>Suco</Text>
            <Text style={styles.quantidadeValor}>{dados.quantidadeSuco}</Text>
          </View>
        </View>

        <Text style={styles.estabelecimento}>{dados.nomeEstabelecimento}</Text>
        {dados.endereco && (
          <Text style={styles.metaLinha}>{dados.endereco}</Text>
        )}
        {(dados.cnpj || dados.inscricaoEstadual) && (
          <View style={styles.cnpjIeLinha}>
            <Text>{dados.cnpj ? `CNPJ: ${dados.cnpj}` : ''}</Text>
            <Text>
              {dados.inscricaoEstadual ? `I.E.: ${dados.inscricaoEstadual}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.divisoria}>
          <Text style={styles.metaLinha}>
            Impresso em {formatDateTimeSecondsBR(dados.impressoEm)}
          </Text>
          <Text style={styles.empresaCliente}>{dados.empresaClienteNome}</Text>
        </View>

        {itensOrdenados.map((item, indice) => (
          <View key={indice} style={styles.itemBloco}>
            <View style={styles.itemLinhaTopo}>
              <Text style={styles.itemPrato}>{item.prato ?? '—'}</Text>
              <Text style={styles.itemPreco}>{formatCurrencyBRL(item.preco)}</Text>
            </View>
            <Text style={styles.itemTamanho}>Tamanho: {item.tamanho}</Text>
            <Text style={styles.itemNome}>{item.colaboradorNome}</Text>
          </View>
        ))}

        {dados.quantidadeLanche > 0 && (
          <View style={styles.totalLinha}>
            <Text>Lanche ({dados.quantidadeLanche}x)</Text>
            <Text>{formatCurrencyBRL(totalLanche)}</Text>
          </View>
        )}
        {dados.quantidadeCafe > 0 && (
          <View style={styles.totalLinha}>
            <Text>Café ({dados.quantidadeCafe}x)</Text>
            <Text>{formatCurrencyBRL(totalCafe)}</Text>
          </View>
        )}
        {dados.quantidadeSuco > 0 && (
          <View style={styles.totalLinha}>
            <Text>Suco ({dados.quantidadeSuco}x)</Text>
            <Text>{formatCurrencyBRL(totalSuco)}</Text>
          </View>
        )}

        <View style={styles.totalPagarLinha}>
          <Text>Total a pagar</Text>
          <Text>{formatCurrencyBRL(totalAPagar)}</Text>
        </View>
      </Page>
    </Document>
  )
}
