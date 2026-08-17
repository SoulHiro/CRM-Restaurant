import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatDateTimeBR } from '@/lib/formatters'
import type { CampoComandaKey } from '@/features/configuracoes/lib/types'

const MM_TO_PT = 2.834645669
const LARGURA_BOBINA = 80 * MM_TO_PT

const TURNO_LABEL: Record<'almoco' | 'jantar', string> = {
  almoco: 'ALMOÇO',
  jantar: 'JANTAR',
}

const TAMANHO_LABEL: Record<'P' | 'M' | 'G', string> = {
  P: 'Pequena',
  M: 'Média',
  G: 'Grande',
}

const styles = StyleSheet.create({
  page: { padding: 14, fontFamily: 'Helvetica' },
  nome: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  turno: {
    fontSize: 14,
    fontWeight: 700,
    padding: 6,
    marginBottom: 10,
    textAlign: 'center',
    border: '1.5pt solid #000',
  },
  prato: { fontSize: 12, marginBottom: 4 },
  linha: { fontSize: 10, marginBottom: 3, color: '#333' },
  meta: {
    fontSize: 8,
    marginTop: 8,
    paddingTop: 5,
    borderTop: '0.5pt solid #999',
    color: '#777',
  },
})

export interface ComandaDados {
  nome: string
  empresaNome: string
  turno: 'almoco' | 'jantar' | null
  tamanho: 'P' | 'M' | 'G' | null
  prato: string | null
  observacao: string | null
  /** ISO — quando o funcionário respondeu no formulário. */
  respondidoEm: string | null
  /** ISO — quando esta comanda foi gerada, calculado na hora da impressão. */
  impressoEm: string
}

function renderCampo(campo: CampoComandaKey, comanda: ComandaDados) {
  switch (campo) {
    case 'turno':
      return comanda.turno ? (
        <View key={campo} style={styles.turno}>
          <Text>{TURNO_LABEL[comanda.turno]}</Text>
        </View>
      ) : null
    case 'prato':
      return (
        <Text key={campo} style={styles.prato}>
          {comanda.prato ?? 'Sem prato informado'}
        </Text>
      )
    case 'tamanho':
      return comanda.tamanho ? (
        <Text key={campo} style={styles.linha}>
          Tamanho: {TAMANHO_LABEL[comanda.tamanho]}
        </Text>
      ) : null
    case 'observacao':
      return comanda.observacao ? (
        <Text key={campo} style={styles.linha}>
          Obs: {comanda.observacao}
        </Text>
      ) : null
    case 'empresa':
      return (
        <Text key={campo} style={styles.meta}>
          {comanda.empresaNome}
        </Text>
      )
    case 'respondido_em':
      return comanda.respondidoEm ? (
        <Text key={campo} style={styles.meta}>
          Respondido em {formatDateTimeBR(comanda.respondidoEm)}
        </Text>
      ) : null
    case 'impresso_em':
      return (
        <Text key={campo} style={styles.meta}>
          Impresso em {formatDateTimeBR(comanda.impressoEm)}
        </Text>
      )
    default:
      return null
  }
}

/**
 * Página com largura da bobina de 80mm; altura cresce com o conteúdo. O
 * nome é sempre a âncora fixa no topo — o resto vem de `campos`, na ordem
 * configurada em Configurações → Impressão de comanda.
 */
export function ComandaPDF({
  comanda,
  campos,
}: {
  comanda: ComandaDados
  campos: CampoComandaKey[]
}) {
  return (
    <Document>
      <Page size={[LARGURA_BOBINA]} style={styles.page}>
        <Text style={styles.nome}>{comanda.nome}</Text>
        {campos.map((campo) => renderCampo(campo, comanda))}
      </Page>
    </Document>
  )
}
