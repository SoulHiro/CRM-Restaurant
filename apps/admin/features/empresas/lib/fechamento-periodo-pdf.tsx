import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeSecondsBR,
} from '@/lib/formatters'
import {
  CNPJ_RESTAURANTE,
  ENDERECO_RESTAURANTE,
  IE_RESTAURANTE,
  NOME_RESTAURANTE,
} from '@/lib/dados-restaurante'
import type { CampoResumoKey } from '@/features/configuracoes/lib/types'

const MM_TO_PT = 2.834645669
export const LARGURA_BOBINA_PERIODO_MM = 80
const LARGURA_BOBINA = LARGURA_BOBINA_PERIODO_MM * MM_TO_PT

const AREA_IMPRIMIVEL_MM = 72
const MARGEM_NAO_IMPRIMIVEL_MM = LARGURA_BOBINA_PERIODO_MM - AREA_IMPRIMIVEL_MM
const PADDING_ESQUERDA = 14
const PADDING_DIREITA = PADDING_ESQUERDA + MARGEM_NAO_IMPRIMIVEL_MM * MM_TO_PT
const PADDING_VERTICAL = 14

const ALTURA_CABECALHO_MM = 90
const ALTURA_POR_LINHA_MM = 11
const ALTURA_RODAPE_MM = 30
const ALTURA_MINIMA_MM = 120

/**
 * Cabeçalho fixo + uma linha por acréscimo/dia avulso — os dias do período
 * em si não geram linha (só entram no subtotal), então quem lança 10
 * acréscimos e nenhum dia avulso tem uma nota do mesmo tamanho de quem
 * lança o inverso.
 */
export function calcularAlturaFechamentoPeriodoMM(
  quantidadeLinhasExtras: number
): number {
  const altura =
    ALTURA_CABECALHO_MM +
    quantidadeLinhasExtras * ALTURA_POR_LINHA_MM +
    ALTURA_RODAPE_MM
  return Math.max(ALTURA_MINIMA_MM, altura)
}

const styles = StyleSheet.create({
  page: {
    paddingTop: PADDING_VERTICAL,
    paddingBottom: PADDING_VERTICAL,
    paddingLeft: PADDING_ESQUERDA,
    paddingRight: PADDING_DIREITA,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  quantidadesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    border: '1.5pt solid #000',
    borderRadius: 2,
    padding: 6,
    marginBottom: 4,
  },
  quantidadeBloco: { alignItems: 'center', minWidth: 40 },
  quantidadeLabel: { fontSize: 8, fontWeight: 700 },
  quantidadeValor: { fontSize: 16, fontWeight: 700 },
  estabelecimento: { fontSize: 15, fontWeight: 700, marginTop: 8 },
  metaLinha: { fontSize: 8.5, color: '#333' },
  divisoria: {
    borderTop: '0.75pt solid #000',
    marginTop: 8,
    paddingTop: 6,
  },
  empresaCliente: {
    fontSize: 12.5,
    fontWeight: 700,
    marginTop: 2,
    marginBottom: 4,
  },
  periodoLinha: { fontSize: 9, color: '#333', marginBottom: 8 },
  secaoTitulo: {
    fontSize: 9,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    color: '#444',
  },
  itemLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemDescricao: { fontSize: 9, flex: 1, marginRight: 6 },
  itemValor: { fontSize: 9, fontWeight: 700 },
  subtotalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9.5,
    marginTop: 4,
    color: '#333',
  },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 11,
    fontWeight: 700,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1pt solid #000',
  },
})

export interface AcrescimoPeriodo {
  descricao: string
  valor: number
}

export interface DiaAvulsoPeriodo {
  data: string
  descricao: string
  valor: number
}

export interface FechamentoPeriodoDados {
  camposCabecalho: CampoResumoKey[]
  empresaClienteNome: string
  de: string
  ate: string
  impressoEm: string
  mostrarQuantidades: boolean
  precoModo: 'por_tamanho' | 'unico'
  pedeCafe: boolean
  pedeLanche: boolean
  pedeSuco: boolean
  quantidadeP: number
  quantidadeM: number
  quantidadeG: number
  quantidadeMarmitaUnica: number
  quantidadeLanche: number
  quantidadeCafe: number
  quantidadeSuco: number
  /** Quantos dias do período têm fechamento diário lançado. */
  totalDias: number
  /** Soma do `valorTotal` de cada fechamento diário do período. */
  subtotalDias: number
  /**
   * Lançados na hora de gerar esse papel, nunca gravados — cada um soma só
   * no total geral, sem entrar na conta de nenhum dia específico.
   */
  acrescimos: AcrescimoPeriodo[]
  /** Dias fora do fluxo normal de finalização (ex: visita avulsa). */
  diasAvulsos: DiaAvulsoPeriodo[]
  valorTotal: number
}

/**
 * Fechamento consolidado de um período — soma o que já foi finalizado dia a
 * dia (`subtotalDias`) com acréscimos e dias avulsos lançados na hora, sem
 * criar nenhum registro novo no banco (é só um papel, ver
 * `fechamento-periodo-drawer.tsx`). Mesma família visual dos outros
 * documentos de 80mm — cabeçalho igual, bloco de quantidades igual ao
 * resumo diário, só que somado pro período inteiro.
 */
export function FechamentoPeriodoPDF({
  dados,
}: {
  dados: FechamentoPeriodoDados
}) {
  return (
    <Document>
      <Page
        size={[
          LARGURA_BOBINA,
          calcularAlturaFechamentoPeriodoMM(
            dados.acrescimos.length + dados.diasAvulsos.length
          ) * MM_TO_PT,
        ]}
        orientation="portrait"
        style={styles.page}
      >
        {dados.mostrarQuantidades && (
          <View style={styles.quantidadesLinha}>
            {dados.precoModo === 'unico' ? (
              <View style={styles.quantidadeBloco}>
                <Text style={styles.quantidadeLabel}>Marmitas</Text>
                <Text style={styles.quantidadeValor}>
                  {dados.quantidadeMarmitaUnica}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.quantidadeBloco}>
                  <Text style={styles.quantidadeLabel}>P</Text>
                  <Text style={styles.quantidadeValor}>
                    {dados.quantidadeP}
                  </Text>
                </View>
                <View style={styles.quantidadeBloco}>
                  <Text style={styles.quantidadeLabel}>M</Text>
                  <Text style={styles.quantidadeValor}>
                    {dados.quantidadeM}
                  </Text>
                </View>
                <View style={styles.quantidadeBloco}>
                  <Text style={styles.quantidadeLabel}>G</Text>
                  <Text style={styles.quantidadeValor}>
                    {dados.quantidadeG}
                  </Text>
                </View>
              </>
            )}
            {dados.pedeLanche && (
              <View style={styles.quantidadeBloco}>
                <Text style={styles.quantidadeLabel}>Lanche</Text>
                <Text style={styles.quantidadeValor}>
                  {dados.quantidadeLanche}
                </Text>
              </View>
            )}
            {dados.pedeCafe && (
              <View style={styles.quantidadeBloco}>
                <Text style={styles.quantidadeLabel}>Café</Text>
                <Text style={styles.quantidadeValor}>
                  {dados.quantidadeCafe}
                </Text>
              </View>
            )}
            {dados.pedeSuco && (
              <View style={styles.quantidadeBloco}>
                <Text style={styles.quantidadeLabel}>Suco</Text>
                <Text style={styles.quantidadeValor}>
                  {dados.quantidadeSuco}
                </Text>
              </View>
            )}
          </View>
        )}

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
                <View key={campo}>
                  {CNPJ_RESTAURANTE && (
                    <Text style={styles.metaLinha}>
                      CNPJ: {CNPJ_RESTAURANTE}
                    </Text>
                  )}
                  {IE_RESTAURANTE && (
                    <Text style={styles.metaLinha}>I.E.: {IE_RESTAURANTE}</Text>
                  )}
                </View>
              )
            )
          }
          return null
        })}

        <View style={styles.divisoria}>
          <Text style={styles.metaLinha}>
            Fechamento do período — {formatDateTimeSecondsBR(dados.impressoEm)}
          </Text>
          <Text style={styles.empresaCliente}>{dados.empresaClienteNome}</Text>
          <Text style={styles.periodoLinha}>
            {formatDateBR(dados.de)} a {formatDateBR(dados.ate)} ·{' '}
            {dados.totalDias} {dados.totalDias === 1 ? 'dia' : 'dias'}{' '}
            finalizados
          </Text>
        </View>

        <View style={styles.subtotalLinha}>
          <Text>Subtotal dos dias do período</Text>
          <Text>{formatCurrencyBRL(dados.subtotalDias)}</Text>
        </View>

        {dados.acrescimos.length > 0 && (
          <>
            <Text style={styles.secaoTitulo}>Acréscimos</Text>
            {dados.acrescimos.map((item, indice) => (
              <View key={indice} style={styles.itemLinha}>
                <Text style={styles.itemDescricao}>{item.descricao}</Text>
                <Text style={styles.itemValor}>
                  {formatCurrencyBRL(item.valor)}
                </Text>
              </View>
            ))}
          </>
        )}

        {dados.diasAvulsos.length > 0 && (
          <>
            <Text style={styles.secaoTitulo}>Dias avulsos</Text>
            {dados.diasAvulsos.map((item, indice) => (
              <View key={indice} style={styles.itemLinha}>
                <Text style={styles.itemDescricao}>
                  {formatDateBR(item.data)} — {item.descricao}
                </Text>
                <Text style={styles.itemValor}>
                  {formatCurrencyBRL(item.valor)}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.totalLinha}>
          <Text>Total do período</Text>
          <Text>{formatCurrencyBRL(dados.valorTotal)}</Text>
        </View>
      </Page>
    </Document>
  )
}
