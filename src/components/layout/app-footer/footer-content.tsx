import { Link } from "@tanstack/react-router";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { footerGroups, footerSocials } from "./data/footer-links";

const socialIcons = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  X: FaXTwitter,
  LinkedIn: FaLinkedinIn,
  YouTube: FaYoutube,
} as const;

export function FooterContent() {
  return (
    <>
      <div className="grid grid-cols-1 items-center gap-5 bg-[#3A2414] px-5 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <Link
          to="/"
          aria-label="Kurio, página inicial"
          className="text-sm font-black tracking-[0.2em] text-[#F5EDE5]"
        >
          KURIO
        </Link>

        <p className="max-w-xs text-sm leading-6 text-[#F5EDE5]">
          Feito para colecionadores, criadores e cultura.
        </p>

        <a
          href="mailto:contato@email.com"
          className="text-sm text-[#F5EDE5] transition-colors hover:text-[#E9A568]"
        >
          contato@email.com
        </a>

        <a
          href="tel:+551140028922"
          className="text-sm text-[#F5EDE5] transition-colors hover:text-[#E9A568]"
        >
          +55 11 4002 8922
        </a>
      </div>

      <div className="grid grid-cols-1 gap-10 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {footerGroups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-lg font-bold text-[#F5EDE5]">
              {group.title}
            </h2>

            <nav className="flex flex-col items-start gap-2.5">
              {group.links.map((link) => (
                <Link
                  key={`${group.title}-${link.label}`}
                  to={link.to}
                  className="text-sm text-[#D4B99C] transition-colors hover:text-[#E9A568]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>
        ))}

        <section>
          <h2 className="mb-3 text-lg font-bold text-[#F5EDE5]">
            Redes sociais
          </h2>

          <nav aria-label="Redes sociais" className="flex flex-wrap gap-2">
            {footerSocials.map((social) => {
              const Icon =
                socialIcons[social.label as keyof typeof socialIcons];

              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-full border border-[#684021] text-[#D4B99C] transition-all duration-200 hover:border-[#D88D4B] hover:bg-[#D88D4B] hover:text-[#24150F]"
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              );
            })}
          </nav>

          <h2 className="mb-2 mt-7 text-lg font-bold text-[#F5EDE5]">
            Carteiras compatíveis
          </h2>

          <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#684021] bg-[#3A2414] px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-[#D88D4B]">
            <span>MetaMask</span>
            <span aria-hidden="true">·</span>
            <span>WalletConnect</span>
            <span aria-hidden="true">·</span>
            <span>Coinbase</span>
          </div>
        </section>
      </div>
    </>
  );
}
