const linkGroups = [
  {
    title: "Meu perfil",
    links: ["Meu perfil", "Minha coleção", "Atividade", "Estúdio do criador", "Lista de interesses"],
  },
  {
    title: "Central de ajuda",
    links: ["Central de ajuda", "Como comprar NFTs", "Carteira e segurança", "Políticas e direitos", "Denunciar item"],
  },
  {
    title: "Coleções",
    links: ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"],
  },
];

const socials = [
  { label: "Facebook", short: "f" },
  { label: "X", short: "X" },
  { label: "Instagram", short: "ig" },
  { label: "LinkedIn", short: "in" },
  { label: "YouTube", short: "yt" },
];

const wallets = ["MetaMask", "WalletConnect", "Coinbase"];

export function Footer() {
  return (
    <footer className="bg-[#241612]">
      <div className="grid grid-cols-1 gap-3 bg-[#3a2416] px-6 py-4 text-[10px] text-zinc-300 sm:grid-cols-4 sm:items-center lg:px-8">
        <span className="text-xs font-bold tracking-widest text-zinc-100">KURIO</span>
        <span>
          Feito para colecionadores,
          <br />
          criadores e cultura.
        </span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>

      <div className="grid grid-cols-2 gap-8 px-6 py-8 sm:grid-cols-4 lg:px-8">
        {linkGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-xs font-bold text-zinc-100">{group.title}</h2>
            <ul className="mt-3 space-y-1.5 text-[10px] text-zinc-400">
              {group.links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-zinc-100">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-xs font-bold text-zinc-100">Redes sociais</h2>
          <ul className="mt-3 flex gap-1.5">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href="#"
                  aria-label={social.label}
                  className="flex size-5 items-center justify-center bg-[#d4893f] text-[9px] font-bold text-[#1a110d]"
                >
                  {social.short}
                </a>
              </li>
            ))}
          </ul>

          <h2 className="mt-5 text-xs font-bold text-zinc-100">Carteiras compatíveis</h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {wallets.map((wallet) => (
              <li
                key={wallet}
                className="bg-[#d4893f] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#1a110d]"
              >
                {wallet}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="border-t border-[#3a2416] bg-[#1a110d] py-4 text-center text-[10px] text-zinc-400">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  );
}
