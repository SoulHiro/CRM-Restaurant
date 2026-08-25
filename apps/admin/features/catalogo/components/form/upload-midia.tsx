'use client'

import type { OutputCollectionState } from '@uploadcare/react-uploader'
import { FileUploaderRegular } from '@uploadcare/react-uploader/next'
import '@uploadcare/react-uploader/core.css'

import { Label } from '@repo/ui/components/label'

/**
 * Botão que abre um modal com várias fontes (arquivo local, link, câmera,
 * Dropbox, Google Drive) — tudo hospedado pela Uploadcare, sem precisar
 * rodar um servidor de integração nosso (diferente do Uppy, que exigiria um
 * "Companion" à parte pra isso). `pubkey` é pública de propósito, não é
 * segredo como o token do Vercel Blob.
 */
export function UploadMidia({
  tipo,
  label,
  value,
  onChange,
}: {
  tipo: 'foto' | 'video'
  label: string
  value: string
  onChange: (url: string) => void
}) {
  function aoMudar(collection: OutputCollectionState) {
    const sucesso = collection.allEntries.find((f) => f.status === 'success')
    if (sucesso?.cdnUrl) onChange(sucesso.cdnUrl)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm">{label}</Label>
      <FileUploaderRegular
        pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY ?? ''}
        sourceList="local, url, camera, dropbox, gdrive"
        imgOnly={tipo === 'foto'}
        accept={tipo === 'video' ? 'video/*' : undefined}
        multiple={false}
        onChange={aoMudar}
      />
      {value && (
        <p className="truncate text-xs text-muted-foreground">
          Atual: {value}
        </p>
      )}
    </div>
  )
}
