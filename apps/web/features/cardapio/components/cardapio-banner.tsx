import Image from 'next/image'

/**
 * Banner de marca no topo do formulário público — a mesma placa
 * dourado-sobre-madeira do resto do sistema, agora em forma de imagem real
 * (já traz o slogan "Sabor de casa, todo dia." embutido, não precisa de um
 * bloco de texto separado). Altura fixa e recorte central: a proporção
 * original (2:1) ocuparia metade da tela num celular estreito se mostrada
 * inteira — cortar as bordas ilustradas mantém a marca "NQ Nosso Quintal"
 * sempre legível sem engolir a viewport.
 */
export function CardapioBanner() {
  return (
    <div className="relative h-32 w-full overflow-hidden sm:h-40">
      <Image
        src="/marca/rnq-banner.png"
        alt="Nosso Quintal — Sabor de casa, todo dia."
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  )
}
