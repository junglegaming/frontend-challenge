import type { NFT } from "@/data/nfts";

interface NFTDetailsProps {
  nft: NFT;
}

export function NFTDetails({ nft }: NFTDetailsProps) {
  return (
    <section className="mt-2">
      <div className="space-y-5 py-5 text-sm leading-6 text-muted">
        <p>{nft.description}</p>

        <div>
          <h3 className="font-bold text-foreground">Rede:</h3>
          <p>Registrado na rede {nft.network}.</p>
        </div>

        <div>
          <h3 className="font-bold text-foreground">Contrato:</h3>
          <p className="break-all">
            {nft.contractAddress || "Endereço não informado"}
          </p>
        </div>

        <div>
          <h3 className="font-bold text-foreground">Direitos autorais:</h3>
          <p>
            Royalties do criador: {nft.creatorRoyalty}% nas vendas secundárias.
          </p>
        </div>
      </div>
    </section>
  );
}
