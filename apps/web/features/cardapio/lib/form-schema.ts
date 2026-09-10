import { z } from 'zod'

const turnoSchema = z.enum([
  'almoco',
  'jantar',
  '1_turno',
  '2_turno',
  '3_turno',
  'administrativo',
])

const respostaDiaSchema = z.object({
  data: z.string().min(1),
  prato: z.string().nullable(),
  observacao: z.string().nullable(),
})

/**
 * Validação client-side do formulário inteiro antes de abrir a confirmação
 * — `usaTamanho` decide se o campo é obrigatório porque isso é uma regra da
 * empresa (`precoModo`), não algo fixo. Espelha `enviarRespostaSchema`
 * (apps/web/features/cardapio/lib/schemas.ts), que valida de novo no
 * servidor — aqui é só pra dar o erro pra pessoa antes de gastar uma
 * viagem ao servidor.
 */
export function criarRespostaFormSchema(usaTamanho: boolean) {
  return z.object({
    turno: turnoSchema,
    colaboradorId: z.string().min(1, 'Escolha seu nome antes de continuar.'),
    tamanho: usaTamanho
      ? z.enum(['P', 'M', 'G'], {
          message: 'Escolha o tamanho da marmita antes de continuar.',
        })
      : z.enum(['P', 'M', 'G']).nullable(),
    whatsapp: z.string().nullable(),
    respostas: z
      .array(respostaDiaSchema)
      .min(1, 'Nenhum dia editável nessa semana.'),
  })
}

export type RespostaFormValues = z.infer<
  ReturnType<typeof criarRespostaFormSchema>
>
