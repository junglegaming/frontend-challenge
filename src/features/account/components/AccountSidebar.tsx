import { Link } from '@tanstack/react-router'

import { useLogout } from '@/features/auth/api'

/**
 * Menu da conta (Figma "Meu perfil"), com Carteiras ativa. Seções fora do
 * escopo do desafio aparecem como no layout, mas marcadas como "em breve".
 *
 * @returns Barra lateral da área da conta.
 */
export function AccountSidebar() {
  const logout = useLogout()

  return (
    <aside
      aria-label="Menu da conta"
      className="flex w-full shrink-0 flex-col bg-[#241612] py-2 lg:w-[310px]"
    >
      {/* Frame 457: Meu perfil */}
      <div className="flex h-[36px] w-full items-center px-[10px]">
        <h2 className="font-mono text-[18px] font-bold leading-[16px] text-[#F5F1EB]">
          Meu perfil
        </h2>
      </div>

      <nav className="flex w-full flex-col">
        {/* 1. Dados do perfil */}
        <Link
          to="/perfil"
          className="flex h-[45px] w-full items-center gap-4 px-4 transition-colors hover:bg-white/5"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#CFB28C]"
            aria-hidden="true"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">
            Dados do perfil
          </span>
        </Link>

        {/* 2. Carteiras (Active) */}
        <div className="box-border flex h-[45px] w-full items-center gap-3 border-l-[6px] border-[#D28A4C] px-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#E89B55]"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">Carteiras</span>
        </div>

        {/* 3. Atividade */}
        <button
          type="button"
          aria-disabled="true"
          title="Em breve"
          className="flex h-[45px] w-full cursor-not-allowed items-center gap-3 px-4 text-left opacity-70"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#B39463]"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">Atividade</span>
          <span className="sr-only"> (em breve)</span>
        </button>

        {/* 4. Lista de interesse */}
        <button
          type="button"
          aria-disabled="true"
          title="Em breve"
          className="flex h-[45px] w-full cursor-not-allowed items-center gap-3 px-4 text-left opacity-70"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#B39463]"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">
            Lista de interesse
          </span>
          <span className="sr-only"> (em breve)</span>
        </button>

        {/* 5. Ofertas */}
        <button
          type="button"
          aria-disabled="true"
          title="Em breve"
          className="flex h-[45px] w-full cursor-not-allowed items-center gap-3 px-4 text-left opacity-70"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#B39463]"
            aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">Ofertas</span>
          <span className="sr-only"> (em breve)</span>
        </button>

        {/* 6. Arquivos baixados */}
        <button
          type="button"
          aria-disabled="true"
          title="Em breve"
          className="flex h-[45px] w-full cursor-not-allowed items-center gap-3 px-4 text-left opacity-70"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#B39463]"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">
            Arquivos baixados
          </span>
          <span className="sr-only"> (em breve)</span>
        </button>

        {/* 7. Suporte */}
        <button
          type="button"
          aria-disabled="true"
          title="Em breve"
          className="flex h-[45px] w-full cursor-not-allowed items-center gap-3 px-4 text-left opacity-70"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#B39463]"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-mono text-[15px] leading-[45px] text-[#E89B55]">Suporte</span>
          <span className="sr-only"> (em breve)</span>
        </button>

        {/* Line 2: Divider */}
        <div className="my-1 h-[1px] w-full border-b border-[#D28A4C]/30" />

        {/* Frame 38: Sair */}
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="flex h-[40px] w-full items-center gap-2 px-4 transition-colors hover:bg-white/5"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#D28A4C]"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="font-mono text-[15px] font-bold leading-[15px] text-[#E89B55]">
            Sair
          </span>
        </button>
      </nav>
    </aside>
  )
}
