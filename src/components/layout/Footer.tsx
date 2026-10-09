import { useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from 'cn';
import { Link } from '@tanstack/react-router';
import { Field } from '../ui/field';
import { ButtonGroup } from '../ui/button-group';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Facebook from '@/assets/facebook.svg?react';
import Instagram from '@/assets/instagram.svg?react';
import Twitter from '@/assets/twitter.svg?react';
import Linkedin from '@/assets/linkedin.svg?react';
import Youtube from '@/assets/youtube.svg?react';

function KurioWrapper({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-surface-dark text-body-sm flex h-22 items-center px-8',
        className
      )}
      {...props}
    />
  );
}

function KurioP({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-body-bold', className)} {...props} />;
}

interface FooterHighlightProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FooterHighlight({ icon, title, description }: FooterHighlightProps) {
  return (
    <div className="space-y-3 pt-8 pb-4 pl-8">
      <span className="text-h2 bg-primary text-ink grid aspect-square h-18.5 w-18.5 place-content-center rounded-full">
        {icon}
      </span>
      <h2 className="text-body-17-bold">{title}</h2>
      <p className="text-body-sm text-secondary leading-5.5">{description}</p>
    </div>
  );
}

interface LinkSectionProps {
  title: string;
  links: string[][];
}

function LinkSection({ title, links }: LinkSectionProps) {
  return (
    <div className="p-8 pb-7.5">
      <h2 className="text-foreground text-body-18-bold mb-2">{title}</h2>
      <div className="flex flex-col">
        {links.map(([label, link]) => (
          <Link key={label} to={link} className="text-body-sm leading-7.5">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const col1Links = [
  ['Meu perfil', '/profile'],
  ['Minha coleção', '/'],
  ['Atividade', '/'],
  ['Estúdio do criador', '/'],
  ['Lista de interesse', '/'],
];

const col2Links = [
  ['Central de ajuda', '/'],
  ['Como comprar NFTs', '/'],
  ['Carteira e segurança', '/'],
  ['Política do mercado', '/'],
  ['Denunciar item', '/'],
];

const col3Links = [
  ['Arte digital', '/'],
  ['Fotografia', '/'],
  ['Música', '/'],
  ['Arte 3D', '/'],
  ['Utilidade', '/'],
];

export function Footer() {
  const [email, setEmail] = useState('');

  return (
    <>
      <footer className="bg-surface-card mt-24 hidden grid-cols-4 md:grid">
        <FooterHighlight
          icon="W"
          title="Segurança da carteira"
          description="Proteja sua carteira e colecione arte digital verificada com
          confiança."
        />
        <FooterHighlight
          icon="C"
          title="Criadores em destaque"
          description="Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede."
        />
        <FooterHighlight
          icon="D"
          title="Alertas de lançamentos"
          description="Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado."
        />
        <div className="pt-8 pr-7.5 pb-4 pl-8">
          <h2 className="text-body-18-bold mb-4">
            Antecipe-se ao próximo lançamento
          </h2>
          <Field className="mb-3">
            <ButtonGroup>
              <Input
                className="text-body-sm h-10"
                id="input-button-group"
                placeholder="digite seu e-mail..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button>Enviar</Button>
            </ButtonGroup>
          </Field>
          <p className="text-caption text-secondary leading-5.5">
            Receba lançamentos selecionados, histórias de criadores e novidades
            do mercado.
          </p>
        </div>
        <KurioWrapper className="bg-surface-dark text-body-sm">
          <KurioP className="text-body-bold">KURIO</KurioP>
        </KurioWrapper>
        <KurioWrapper className="bg-surface-dark text-body-sm">
          <p>Feito para colecionadores, criadores e cultura</p>
        </KurioWrapper>
        <KurioWrapper className="bg-surface-dark text-body-sm">
          <a
            className="text-center"
            href="mailto:contato@email.com"
            target="_blank"
          >
            contato@email.com
          </a>
        </KurioWrapper>
        <KurioWrapper className="bg-surface-dark text-body-sm">
          <p className="text-center">+55 11 4002 8922</p>
        </KurioWrapper>
        <LinkSection title="Meu perfil" links={col1Links} />
        <LinkSection title="Central de ajuda" links={col2Links} />
        <LinkSection title="Coleções" links={col3Links} />
        <div className="p-8 pb-7.5">
          <h2 className="text-body-18-bold mb-5">Redes sociais</h2>
          <div className="text-primary mb-8 flex flex-wrap items-center gap-2.5">
            <a
              href="#"
              className="border-primary grid aspect-square h-7.5 place-content-center rounded-sm border"
            >
              <Facebook />
            </a>
            <a
              href="#"
              className="border-primary grid aspect-square h-7.5 place-content-center rounded-sm border"
            >
              <Instagram />
            </a>
            <a
              href="#"
              className="border-primary grid aspect-square h-7.5 place-content-center rounded-sm border"
            >
              <Twitter />
            </a>
            <a
              href="#"
              className="border-primary grid aspect-square h-7.5 place-content-center rounded-sm border"
            >
              <Linkedin />
            </a>
            <a
              href="#"
              className="border-primary grid aspect-square h-7.5 place-content-center rounded-sm border"
            >
              <Youtube />
            </a>
          </div>
          <div>
            <h2 className="text-body-18-bold mb-5">Carteiras compatíveis</h2>
            <span className="text-accent text-tiny-bold border-border-soft rounded-default bg-surface-dark border px-[10.5px] py-1.75">
              METAMASK • WALLETCONNECT • COINBASE
            </span>
          </div>
        </div>
      </footer>
      <p className="text-body-regular mt-1.5 hidden text-center md:block">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </>
  );
}
