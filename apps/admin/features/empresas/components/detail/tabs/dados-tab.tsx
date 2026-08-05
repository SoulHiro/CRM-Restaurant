import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { FieldCell } from '@repo/ui/components/field-cell'

import type { EmpresaEndereco, EmpresaListItem } from '../../../lib/types'

export function DadosTab({
  empresa,
  endereco,
}: {
  empresa: EmpresaListItem
  endereco: EmpresaEndereco
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
    </div>
  )
}
