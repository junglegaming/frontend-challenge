/** Static editorial content (data-model.md). Not fetched — bundled with the app, maintained by the team. */
export interface Article {
  slug: string
  title: string
  summary: string
  readingMinutes: number
  body: string
}

export const ARTICLES: Article[] = [
  {
    slug: 'o-que-sao-nfts',
    title: 'O que são NFTs?',
    summary: 'Entenda o que torna um NFT único e por que ele é diferente de um arquivo digital comum.',
    readingMinutes: 4,
    body: `Um NFT (token não-fungível) é um registro único e verificável em uma rede blockchain, que
representa a posse de um item digital — uma imagem, uma música, um vídeo ou qualquer outro arquivo.

Diferente de um arquivo comum, que pode ser copiado infinitas vezes sem distinção entre as cópias,
cada NFT carrega uma identidade própria: um identificador único, um histórico de propriedade e,
geralmente, uma edição limitada e conhecida de antemão. Isso é o que permite colecionar arte
digital, música ou outros ativos com a mesma noção de raridade e autenticidade de um colecionável
físico.

Na Kurio, cada NFT listado mostra sua edição, o criador responsável e a quantidade disponível —
assim você sabe exatamente o que está adquirindo antes de comprar.`,
  },
  {
    slug: 'edicoes-e-estoque-limitado',
    title: 'Como funciona uma edição com estoque limitado?',
    summary: 'Por que alguns NFTs têm apenas algumas unidades disponíveis, e o que isso significa para você.',
    readingMinutes: 3,
    body: `Muitos NFTs na Kurio são vendidos em edições: variações do mesmo item com uma quantidade
máxima definida pelo criador. Uma edição "Standard" pode ter dezenas de unidades disponíveis,
enquanto uma edição "Legendary" pode ter apenas uma única unidade no mundo.

Esse estoque é controlado em tempo real — assim que uma edição se esgota, ela deixa de estar
disponível para compra e o restante dos colecionadores vê essa mudança refletida imediatamente,
sem precisar atualizar a página.

Se você está de olho em uma edição rara, vale a pena agir rápido: diferente de um produto comum,
uma edição esgotada normalmente não volta a ficar disponível.`,
  },
  {
    slug: 'como-comprar-com-seguranca',
    title: 'Como comprar com segurança na Kurio',
    summary: 'Boas práticas para finalizar sua compra com confiança, do carrinho à confirmação do pedido.',
    readingMinutes: 5,
    body: `Comprar um NFT na Kurio segue um fluxo pensado para te dar clareza em cada etapa: você
adiciona itens ao carrinho, revisa o resumo com subtotal, descontos e taxa de rede, e só então
confirma a compra conectando uma carteira.

Antes de confirmar, a plataforma sempre revalida o preço e a disponibilidade dos itens do seu
carrinho — se algo mudou desde a última vez que você olhou (por exemplo, o preço subiu ou uma
edição esgotou), você verá um aviso claro antes de qualquer cobrança ser feita.

Depois da confirmação, você recebe um recibo com o identificador da transação, o total pago e um
link para conferir a transação no explorador de blocos da rede usada — guarde esse recibo como
prova da sua compra.`,
  },
]
