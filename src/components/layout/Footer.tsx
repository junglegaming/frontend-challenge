import { Link } from '@tanstack/react-router'
import { ComingSoon } from '@/components/common/ComingSoon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COLLECTION_LABELS } from '@/schemas/nft'
import { SocialIcon, type SocialNetwork } from './SocialIcons'

const FEATURES = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const FOOTER_COLLECTIONS = ['digital-art', 'photography', 'music', '3d-art', 'utility'] as const
const SOCIAL_NETWORKS: SocialNetwork[] = ['facebook', 'instagram', 'x', 'linkedin', 'youtube']

export function Footer() {
  return (
    <footer className="mx-auto mt-24 hidden w-full max-w-[1200px] px-6 pb-6 md:block xl:px-0">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 bg-card px-8 py-8 lg:grid-cols-4 lg:gap-0 lg:px-12">
        {FEATURES.map((feature) => (
          <div key={feature.letter} className="flex flex-col gap-3 lg:border-r lg:border-primary lg:px-6 lg:first:pl-0">
            <span className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground" aria-hidden="true">
              {feature.letter}
            </span>
            <h2 className="text-lg font-bold">{feature.title}</h2>
            <p className="text-sm leading-[22px] text-accent-text">{feature.text}</p>
          </div>
        ))}
        <div className="flex flex-col gap-3 lg:pl-6">
          <h2 className="text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
          <form className="flex" aria-describedby="newsletter-status" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter" className="sr-only">
              Seu e-mail
            </label>
            <Input id="newsletter" type="email" placeholder="digite seu e-mail..." className="rounded-none border-0 bg-surface-dark" disabled />
            <Button type="submit" className="rounded-none disabled:opacity-80" disabled>
              Enviar
            </Button>
          </form>
          <p id="newsletter-status" className="text-sm leading-[22px] text-accent-text">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado. (Em breve)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 items-center bg-surface-dark px-8 py-6 text-sm">
        <span className="font-bold tracking-[0.2em]">KURIO</span>
        <span>Feito para colecionadores, criadores e cultura</span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>

      <div className="grid grid-cols-4 gap-6 bg-card px-8 py-8 text-sm">
        <nav aria-label="Meu perfil" className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Meu perfil</h2>
          <Link to="/profile" className="hover:text-accent-text">Meu perfil</Link>
          <Link to="/wallets" className="hover:text-accent-text">Carteiras</Link>
          <ComingSoon muted={false}>Atividade</ComingSoon>
          <ComingSoon muted={false}>Estúdio do criador</ComingSoon>
          <ComingSoon muted={false}>Lista de interesse</ComingSoon>
        </nav>
        <nav aria-label="Central de ajuda" className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Central de ajuda</h2>
          {['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'].map((label) => (
            <ComingSoon key={label} muted={false}>
              {label}
            </ComingSoon>
          ))}
        </nav>
        <nav aria-label="Coleções" className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Coleções</h2>
          {FOOTER_COLLECTIONS.map((id) => (
            <Link key={id} to="/" search={{ collections: [id] }} className="hover:text-accent-text">
              {COLLECTION_LABELS[id]}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Redes sociais</h2>
          <ul className="flex gap-2" aria-label="Redes sociais (em breve)">
            {SOCIAL_NETWORKS.map((network) => (
              <li key={network} className="grid size-8 place-items-center border border-primary text-primary" aria-hidden="true">
                <SocialIcon network={network} />
              </li>
            ))}
          </ul>
          <h2 className="mt-4 text-lg font-bold">Carteiras compatíveis</h2>
          <WalletsBadge />
        </div>
      </div>

      <p className="pt-6 text-center text-sm">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}

function WalletsBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-sm border border-border-soft bg-surface-dark px-2 py-1 text-[9px] font-bold tracking-wide text-primary">
      METAMASK · WALLETCONNECT · COINBASE
    </span>
  )
}
