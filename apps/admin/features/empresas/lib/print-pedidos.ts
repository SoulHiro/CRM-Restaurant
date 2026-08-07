import { toast } from 'sonner'

import type { EmpresaFuncionarioPedido } from './types'

export interface PedidoParaImprimir {
  nome: string
  setor: string
  turno: string
  pedido: EmpresaFuncionarioPedido
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function printPedidosFuncionarios(
  itens: PedidoParaImprimir[],
  empresaNome: string
) {
  const comPedido = itens.filter((item) => item.pedido.prato)

  if (comPedido.length === 0) {
    toast.info('Nenhum pedido pra imprimir hoje.')
    return
  }

  const ordenados = [...comPedido].sort((a, b) =>
    (a.pedido.prato ?? '').localeCompare(b.pedido.prato ?? '', 'pt-BR')
  )

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) return

  const rows = ordenados
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.pedido.prato ?? '')}${item.pedido.tamanho ? ` (${item.pedido.tamanho})` : ''}</td>
          <td>${escapeHtml(item.nome)}</td>
          <td>${escapeHtml(item.setor)} · ${escapeHtml(item.turno)}</td>
        </tr>`
    )
    .join('')

  const dataLabel = ordenados[0]?.pedido.diaSemanaLabel ?? ''

  printWindow.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Pedidos do dia — ${escapeHtml(empresaNome)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1206; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { color: #555; margin: 0 0 16px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
  th { color: #555; font-weight: 600; }
</style>
</head>
<body>
  <h1>Pedidos do dia — ${escapeHtml(empresaNome)}</h1>
  <p>${escapeHtml(dataLabel)} · ${ordenados.length} pedido${ordenados.length > 1 ? 's' : ''}</p>
  <table>
    <thead>
      <tr>
        <th>Prato</th>
        <th>Funcionário</th>
        <th>Setor / turno</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
