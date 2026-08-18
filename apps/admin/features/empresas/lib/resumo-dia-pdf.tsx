import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatCurrencyBRL, formatDateTimeSecondsBR } from '@/lib/formatters'

const MM_TO_PT = 2.834645669
export const LARGURA_BOBINA_MM = 80
const LARGURA_BOBINA = LARGURA_BOBINA_MM * MM_TO_PT

const PADDING_PAGINA = 14

// A nota nunca pode paginar — um resumo de fechamento é uma via só,
// contínua; paginar arriscaria a impressora cortar o papel no meio (o
// driver trata cada "página" de um documento como um fim de folha, e corta
// se estiver configurado pra isso, igual acontece entre comandas). Por isso
// a altura é sempre calculada pelo conteúdo — nunca um teto fixo que a nota
// possa ultrapassar. O que causou o texto minúsculo/encolhido num pedido
// grande não foi o tamanho em si, foi o driver não saber, de antemão, que
// medida física esperar: `imprimir()` no drawer usa esses mesmos números
// pra avisar o QZ Tray do tamanho exato via `qz.configs.create(..., {
// size, units: 'mm' })`, em vez de deixar o driver inferir do PDF.
const ALTURA_CABECALHO_MM = 83
const ALTURA_POR_ITEM_MM = 11
const ALTURA_RODAPE_MM = 40
const ALTURA_MINIMA_MM = 110

export function calcularAlturaResumoDiaMM(quantidadeItens: number): number {
  const altura =
    ALTURA_CABECALHO_MM + quantidadeItens * ALTURA_POR_ITEM_MM + ALTURA_RODAPE_MM
  return Math.max(ALTURA_MINIMA_MM, altura)
}

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
    marginBottom: 3,
  },
  itemLinhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemPrato: { fontSize: 10, fontWeight: 700, flex: 1, marginRight: 6 },
  itemPreco: { fontSize: 10, fontWeight: 700 },
  itemTamanho: { fontSize: 10, color: '#333', marginTop: 1 },
  itemNome: { fontSize: 10, marginTop: 1 },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 4,
  },
  totalPagarLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    fontWeight: 700,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1pt solid #000',
  },
})

function ordemItem(item: ItemResumoDia): number {
  if (item.tipo === 'marmita') {
    if (item.tamanho === 'G') return 0
    if (item.tamanho === 'M') return 1
    return 2
  }
  return 3
}

export interface ItemResumoDia {
  colaboradorNome: string
  tipo: 'marmita' | 'lanche'
  prato: string | null
  tamanho: 'P' | 'M' | 'G' | null
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
}

function contarTamanho(itens: ItemResumoDia[], tamanho: 'P' | 'M' | 'G') {
  return itens.filter(
    (item) => item.tipo === 'marmita' && item.tamanho === tamanho
  ).length
}

function contarLanches(itens: ItemResumoDia[]) {
  return itens.filter((item) => item.tipo === 'lanche').length
}

/**
 * Nota de fechamento do dia — 80mm, itemizada, uma marmita/lanche por
 * bloco. Ordem: marmitas G, depois M, depois P, depois lanches (cada um com
 * o nome de quem pediu) — café e suco não têm nome de pessoa, entram como
 * linha de total no fim.
 */
export function ResumoDiaPDF({ dados }: { dados: ResumoDiaDados }) {
  const itensOrdenados = [...dados.itens].sort(
    (a, b) => ordemItem(a) - ordemItem(b)
  )

  const totalCafe = dados.quantidadeCafe * dados.precoUnitarioCafe
  const totalSuco = dados.quantidadeSuco * dados.precoUnitarioSuco
  const totalItens = dados.itens.reduce((soma, item) => soma + item.preco, 0)
  const totalAPagar = totalItens + totalCafe + totalSuco

  return (
    <Document>
      <Page
        size={[
          LARGURA_BOBINA,
          calcularAlturaResumoDiaMM(itensOrdenados.length) * MM_TO_PT,
        ]}
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
            <Text style={styles.quantidadeValor}>
              {contarLanches(dados.itens)}
            </Text>
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
          <View key={indice} style={styles.itemBloco} wrap={false}>
            <View style={styles.itemLinhaTopo}>
              <Text style={styles.itemPrato}>{item.prato ?? '—'}</Text>
              <Text style={styles.itemPreco}>{formatCurrencyBRL(item.preco)}</Text>
            </View>
            {item.tamanho && (
              <Text style={styles.itemTamanho}>Tamanho: {item.tamanho}</Text>
            )}
            <Text style={styles.itemNome}>{item.colaboradorNome}</Text>
          </View>
        ))}

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
