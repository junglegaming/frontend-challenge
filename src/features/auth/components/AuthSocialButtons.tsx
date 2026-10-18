export function AuthSocialButtons() {
  return (
    <div className="mt-4">
      {/* Divider */}
      <div className="relative my-4 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#3a2416]" />
        </div>
        <span className="relative bg-[#140d0a] lg:bg-[#241612] px-3 text-[10px] text-zinc-400">
          Ou continue com
        </span>
      </div>

      {/* Social options */}
      <div className="space-y-2">
        <button
          type="button"
          className="w-full border border-[#3a2416] bg-[#1a110d] hover:bg-[#20140f] py-3 lg:py-2 px-4 text-xs text-zinc-200 flex items-center justify-center gap-2 rounded-xl lg:rounded-none transition-colors"
        >
          <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>

        <button
          type="button"
          className="w-full border border-[#3a2416] bg-[#1a110d] hover:bg-[#20140f] py-3 lg:py-2 px-4 text-xs text-zinc-200 flex items-center justify-center gap-2 rounded-xl lg:rounded-none transition-colors"
        >
          <svg
            className="size-3.5 shrink-0 fill-[#1877F2]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Continuar com Facebook</span>
        </button>
      </div>
    </div>
  );
}
