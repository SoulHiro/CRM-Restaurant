import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { FieldCell } from '@repo/ui/components/field-cell'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type {
  EmpresaContrato,
  EmpresaEndereco,
  EmpresaListItem,
} from '../../../lib/types'
import { AtivoInativoBadge } from '../../shared/ativo-inativo-badge'

export function DadosTab({
  empresa,
  endereco,
  contrato,
}: {
  empresa: EmpresaListItem
  endereco: EmpresaEndereco
  contrato?: EmpresaContrato
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldCell label="Responsável" value={empresa.responsavelNome} />
          <FieldCell
            label="Telefone do responsável"
            value={empresa.responsavelTelefone}
          />
          <FieldCell label="E-mail" value={empresa.email} />
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FieldCell label="CEP" value={endereco.cep} />
          <FieldCell
            label="Logradouro"
            value={
              endereco.logradouro
                ? `${endereco.logradouro}, ${endereco.numero}`
                : ''
            }
          />
          <FieldCell label="Complemento" value={endereco.complemento ?? ''} />
          <FieldCell label="Bairro" value={endereco.bairro} />
          <FieldCell
            label="Cidade"
            value={endereco.cidade ? `${endereco.cidade} - ${endereco.uf}` : ''}
          />
        </CardContent>
      </Card>

      {contrato && (
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contrato</CardTitle>
            <AtivoInativoBadge
              active={contrato.vigente}
              activeLabel="Vigente"
              inactiveLabel="Encerrado"
            />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FieldCell
              label="Valor"
              value={formatCurrencyBRL(contrato.valor)}
            />
            <FieldCell
              label="Prazo de pagamento"
              value={contrato.prazoPagamento}
            />
            <FieldCell
              label="Vigência"
              value={`${formatDateBR(contrato.vigenciaInicio)} até ${formatDateBR(contrato.vigenciaFim)}`}
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Ver contrato
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
