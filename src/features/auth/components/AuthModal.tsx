import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import App from "@/App";

interface AuthModalProps {
  redirect?: string;
  activeTab: "login" | "register";
  subtitle: string;
  mobileTitle?: string;
  mobileFooter?: ReactNode;
  children: ReactNode;
}

export function AuthModal({
  redirect,
  activeTab,
  subtitle,
  mobileTitle,
  mobileFooter,
  children,
}: AuthModalProps) {
  return (
    <div className="relative min-h-screen bg-[#140d0a] lg:bg-transparent">
      {/* Desktop Background Home */}
      <div className="hidden lg:block pointer-events-none select-none" aria-hidden="true">
        <App />
      </div>

      {/* Desktop Dimmed Backdrop */}
      <div className="hidden lg:block fixed inset-0 z-40 bg-black/55" aria-hidden="true" />

      {/* Main Container: Full screen flex on mobile, modal overlay on desktop */}
      <div className="min-h-screen px-6 py-8 flex flex-col justify-between text-zinc-100 font-mono lg:fixed lg:inset-0 lg:z-50 lg:flex-row lg:items-center lg:justify-center lg:p-4 lg:overflow-y-auto">
        <div className="w-full max-w-sm lg:max-w-[420px] mx-auto flex-1 flex flex-col justify-center lg:flex-initial lg:relative lg:bg-[#241612] lg:border lg:border-[#3a2416] lg:p-7 lg:pt-6 lg:pb-6 lg:shadow-2xl lg:rounded-none lg:my-auto">
          {/* Desktop Close button */}
          <Link
            to="/"
            aria-label="Fechar"
            className="hidden lg:block absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </Link>

          {/* Mobile KURIO Branding */}
          <div className="lg:hidden text-center pt-2 pb-6">
            <h1 className="text-3xl font-bold tracking-[0.25em] text-zinc-100 font-mono">
              KURIO
            </h1>
          </div>

          {/* Mobile Screen Title */}
          {mobileTitle && (
            <h2 className="lg:hidden text-center font-bold text-base text-zinc-100 mb-6 font-mono">
              {mobileTitle}
            </h2>
          )}

          {/* Desktop Tab navigation */}
          <div className="hidden lg:block text-center font-bold text-base tracking-wide mb-3">
            <Link
              to="/login"
              search={redirect ? { redirect } : {}}
              className={
                activeTab === "login"
                  ? "text-[#d4893f]"
                  : "text-zinc-100 hover:text-[#d4893f] transition-colors"
              }
            >
              Entrar
            </Link>
            <span className="text-[#d4893f] mx-2 font-light">|</span>
            <Link
              to="/register"
              search={redirect ? { redirect } : {}}
              className={
                activeTab === "register"
                  ? "text-[#d4893f]"
                  : "text-zinc-100 hover:text-[#d4893f] transition-colors"
              }
            >
              Criar conta
            </Link>
          </div>

          {/* Desktop Subtitle */}
          <p className="hidden lg:block text-center text-[10px] text-zinc-300 leading-relaxed max-w-[320px] mx-auto mb-5">
            {subtitle}
          </p>

          {/* Single Form Content instance */}
          <div>{children}</div>

          {/* Desktop Bottom gold accent bar */}
          <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-1.5 bg-[#d4893f]" />
        </div>

        {/* Mobile Bottom Footer Link */}
        {mobileFooter && (
          <div className="lg:hidden w-full text-center pt-6 pb-2 text-xs text-zinc-400 font-mono">
            {mobileFooter}
          </div>
        )}
      </div>
    </div>
  );
}

