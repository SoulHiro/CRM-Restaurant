import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatCurrencyBRL, formatDateTimeSecondsBR } from '@/lib/formatters'
import {
  CNPJ_RESTAURANTE,
  ENDERECO_RESTAURANTE,
  IE_RESTAURANTE,
  NOME_RESTAURANTE,
} from '@/lib/dados-restaurante'
import type { CampoResumoKey } from '@/features/configuracoes/lib/types'
import type { TurnoRefeicao } from './types'

const MM_TO_PT = 2.834645669
export const LARGURA_BOBINA_CONFERENCIA_MM = 80
const LARGURA_BOBINA = LARGURA_BOBINA_CONFERENCIA_MM * MM_TO_PT

const PADDING_PAGINA = 14

// Sem o bloco de contagem do topo (ver resumo-dia-pdf.tsx) o cabeçalho é bem
// mais baixo — mesma lógica de nunca ter uma altura de página fixa, pra não
// arriscar a guilhotina da impressora cortar uma conferência grande no meio.
const ALTURA_CABECALHO_MM = 45
const ALTURA_POR_ITEM_MM = 11
const ALTURA_DIVISOR_TURNO_MM = 6
const ALTURA_RODAPE_MM = 20
const ALTURA_MINIMA_MM = 80

export function calcularAlturaConferenciaMM(
  quantidadeItens: number,
  temDivisorTurno: boolean
): number {
  const altura =
    ALTURA_CABECALHO_MM +
    quantidadeItens * ALTURA_POR_ITEM_MM +
    (temDivisorTurno ? ALTURA_DIVISOR_TURNO_MM : 0) +
    ALTURA_RODAPE_MM
  return Math.max(ALTURA_MINIMA_MM, altura)
}

const styles = StyleSheet.create({
  page: { padding: PADDING_PAGINA, fontFamily: 'Helvetica', fontSize: 10 },
  estabelecimento: { fontSize: 15, fontWeight: 700 },
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
  divisorTurno: {
    borderTop: '0.5pt dashed #999',
    marginTop: 6,
    marginBottom: 6,
  },
  itemBloco: {
    marginBottom: 3,
  },
  itemLinhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemPrato: { fontSize: 8.5, fontWeight: 700, flex: 1, marginRight: 6 },
  itemPreco: { fontSize: 8.5, fontWeight: 700 },
  itemTamanho: { fontSize: 8.5, color: '#333', marginTop: 1 },
  itemNome: { fontSize: 8.5, marginTop: 1 },
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

export interface ItemConferenciaDia {
  colaboradorNome: string
  tipo: 'marmita' | 'lanche'
  prato: string | null
  tamanho: 'P' | 'M' | 'G' | null
  turno: TurnoRefeicao | null
  preco: number
}

export interface ConferenciaDiaDados {
  camposCabecalho: CampoResumoKey[]
  empresaClienteNome: string
  impressoEm: string
  /**
   * Já vem ordenado por quem chama (almoço primeiro, depois jantar,
   * alfabético dentro de cada grupo) — o PDF só decide onde entra o divisor,
   * não reordena nada, pra não duplicar a lógica de ordenação que já existe
   * em pedidos-tab.tsx.
   */
  itens: ItemConferenciaDia[]
}

/**
 * Mesmo formato visual da nota de fechamento (resumo-dia-pdf.tsx), sem o
 * bloco de contagem do topo — usada antes de finalizar o dia, pra conferir
 * nome/prato/tamanho de cada pedido. Preço é o previsto (padrão da empresa
 * ou o que já foi personalizado pedido a pedido), não o preço final — esse
 * só é decidido no "Finalizar dia".
 */
export function ConferenciaDiaPDF({ dados }: { dados: ConferenciaDiaDados }) {
  const indiceDivisorTurno = dados.itens.findIndex(
    (item, indice) =>
      indice > 0 &&
      item.turno === 'jantar' &&
      dados.itens[indice - 1]!.turno !== 'jantar'
  )

  const totalPrevisto = dados.itens.reduce((soma, item) => soma + item.preco, 0)

  return (
    <Document>
      <Page
        size={[
          LARGURA_BOBINA,
          calcularAlturaConferenciaMM(
            dados.itens.length,
            indiceDivisorTurno > 0
          ) * MM_TO_PT,
        ]}
        orientation="portrait"
        style={styles.page}
      >
        {dados.camposCabecalho.map((campo) => {
          if (campo === 'nome') {
            return (
              <Text key={campo} style={styles.estabelecimento}>
                {NOME_RESTAURANTE}
              </Text>
            )
          }
          if (campo === 'endereco') {
            return (
              ENDERECO_RESTAURANTE && (
                <Text key={campo} style={styles.metaLinha}>
                  {ENDERECO_RESTAURANTE}
                </Text>
              )
            )
          }
          if (campo === 'cnpj_ie') {
            return (
              (CNPJ_RESTAURANTE || IE_RESTAURANTE) && (
                <View key={campo} style={styles.cnpjIeLinha}>
                  <Text>
                    {CNPJ_RESTAURANTE ? `CNPJ: ${CNPJ_RESTAURANTE}` : ''}
                  </Text>
                  <Text>{IE_RESTAURANTE ? `I.E.: ${IE_RESTAURANTE}` : ''}</Text>
                </View>
              )
            )
          }
          return null
        })}

        <View style={styles.divisoria}>
          <Text style={styles.metaLinha}>
            Conferência — {formatDateTimeSecondsBR(dados.impressoEm)}
          </Text>
          <Text style={styles.empresaCliente}>{dados.empresaClienteNome}</Text>
        </View>

        {dados.itens.map((item, indice) => (
          <View key={indice}>
            {indice === indiceDivisorTurno && (
              <View style={styles.divisorTurno} />
            )}
            <View style={styles.itemBloco} wrap={false}>
              <View style={styles.itemLinhaTopo}>
                <Text style={styles.itemPrato}>{item.prato ?? '—'}</Text>
                <Text style={styles.itemPreco}>
                  {formatCurrencyBRL(item.preco)}
                </Text>
              </View>
              {item.tamanho && (
                <Text style={styles.itemTamanho}>Tamanho: {item.tamanho}</Text>
              )}
              <Text style={styles.itemNome}>{item.colaboradorNome}</Text>
            </View>
          </View>
        ))}

        <View style={styles.totalPagarLinha}>
          <Text>Total previsto</Text>
          <Text>{formatCurrencyBRL(totalPrevisto)}</Text>
        </View>
      </Page>
    </Document>
  )
}
