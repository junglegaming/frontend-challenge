import type { Nft } from "@/contracts/nft";

interface NftDetailsTabsProps {
  nft: Nft;
}

const tabs = ["Detalhes do NFT", "Avaliações de colecionadores (19)"];

const topics = [
  {
    title: "Rede:",
    text: "Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.",
  },
  {
    title: "Contrato:",
    text: "Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.",
  },
  {
    title: "Direitos autorais:",
    text: "0x7A42...19E8 • Contrato inteligente ERC-721 verificado.",
  },
];

export function NftDetailsTabs({ nft }: NftDetailsTabsProps) {
  return (
    <section aria-label="Informações do NFT" className="text-[11px]">
      <div role="tablist" className="flex gap-6 border-b border-[#3a2416]">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={index === 0}
            className={`-mb-px pb-2 text-xs ${
              index === 0
                ? "border-b border-[#d4893f] text-[#d4893f]"
                : "text-zinc-100 hover:text-[#d4893f]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4 space-y-4 leading-relaxed text-[#cdb79e]">
        <p>
          {nft.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio
          Editions. Cada atributo fica armazenado nos metadados do token e
          verificado na Ethereum. A obra explora identidade, movimento e luz em
          um mundo digital sem fronteiras.
        </p>
        <p>
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos
          para colecionadores e um registro permanente de procedência
          registrada na rede. Nova Sato recebe 5% de direitos autorais nas
          vendas secundárias, apoiando novos trabalhos e lançamentos da
          comunidade.
        </p>

        <dl className="space-y-3">
          {topics.map((topic) => (
            <div key={topic.title}>
              <dt className="font-bold text-zinc-100">{topic.title}</dt>
              <dd className="mt-1">{topic.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
