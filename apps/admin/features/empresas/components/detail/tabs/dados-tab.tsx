import { Download, FileText } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { FieldCell } from '@repo/ui/components/field-cell'

import { formatDateBR } from '@/lib/formatters'
import type {
  EmpresaDocumento,
  EmpresaEndereco,
  EmpresaListItem,
} from '../../../lib/types'

export function DadosTab({
  empresa,
  endereco,
  documentos,
}: {
  empresa: EmpresaListItem
  endereco: EmpresaEndereco
  documentos: EmpresaDocumento[]
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

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento enviado.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {documentos.map((documento) => (
                <div
                  key={documento.id}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium">{documento.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        Enviado em {formatDateBR(documento.enviadoEm)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={documento.arquivoUrl}
                      download
                      aria-label={`Baixar ${documento.nome}`}
                    >
                      <Download className="size-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
