import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Eye, EyeOff, User, Check } from "lucide-react";
import { Header } from "@/features/home/components/Header";
import { useAuth } from "@/features/auth/auth-context";
import { ProfileSidebar } from "@/features/profile/components/ProfileSidebar";
import { Button } from "@/components/ui/button";

export function CollectorProfilePage() {
  const { user } = useAuth();

  // Profile fields state
  const [displayName, setDisplayName] = useState(user?.name ?? "Colecionador Kurio");
  const [username, setUsername] = useState(user?.name ? user.name.toLowerCase().replace(/\s+/g, "_") : "kurio_user");
  const [email, setEmail] = useState(user?.email ?? "usuario@kurio.art");
  const [ensSuffix, setEnsSuffix] = useState(".eth");
  const [walletNickname, setWalletNickname] = useState("Carteira Principal");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleAvatarChange = () => {
    // Simulated avatar change with visual placeholder
    const sampleAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    ];
    const nextAvatar = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];
    setAvatarUrl(nextAvatar);
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#140d0a] font-mono text-zinc-100 flex flex-col">
      <Header />

      <main className="mx-auto max-w-[1200px] w-full px-4 pt-6 pb-16 xl:px-0 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-400 mb-6">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-[#d4893f] transition-colors">
                Início
              </Link>
            </li>
            <li aria-hidden="true" className="text-zinc-600">/</li>
            <li className="text-zinc-400">Meu perfil</li>
            <li aria-hidden="true" className="text-zinc-600">/</li>
            <li aria-current="page" className="text-zinc-200 font-medium">Dados do perfil</li>
          </ol>
        </nav>

        {/* 2-column layout: Sidebar + Content */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <ProfileSidebar activeItem="profile" />

          {/* Main Card */}
          <section
            aria-labelledby="profile-title"
            className="flex-1 w-full bg-[#241612] border border-[#3a2416] p-6 text-xs"
          >
            <h1 id="profile-title" className="text-sm font-bold text-zinc-100 mb-6">
              Perfil do colecionador
            </h1>

            {savedSuccess && (
              <div
                role="status"
                className="mb-6 flex items-center gap-2 border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300"
              >
                <Check className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>Dados do perfil salvos com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile fields grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {/* Nome de exibição */}
                <div>
                  <label htmlFor="display-name" className="block text-[11px] text-zinc-200 font-medium mb-1">
                    Nome de exibição<span className="text-[#d4893f]">*</span>
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                  />
                </div>

                {/* Nome de usuário */}
                <div>
                  <label htmlFor="username" className="block text-[11px] text-zinc-200 font-medium mb-1">
                    Nome de usuário<span className="text-[#d4893f]">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label htmlFor="email" className="block text-[11px] text-zinc-200 font-medium mb-1">
                    E-mail<span className="text-[#d4893f]">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                  />
                </div>

                {/* Nome ENS */}
                <div>
                  <label htmlFor="ens-suffix" className="block text-[11px] text-zinc-200 font-medium mb-1">
                    Nome ENS <span className="text-[#d4893f]">*</span>
                  </label>
                  <div className="relative w-28">
                    <select
                      id="ens-suffix"
                      value={ensSuffix}
                      onChange={(e) => setEnsSuffix(e.target.value)}
                      className="w-full appearance-none bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-200 h-9 px-3 pr-7 rounded-none focus:outline-none focus:border-[#d4893f] cursor-pointer"
                    >
                      <option value=".eth">.eth</option>
                      <option value=".crypto">.crypto</option>
                      <option value=".sol">.sol</option>
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Apelido da carteira */}
                <div>
                  <label htmlFor="wallet-nickname" className="block text-[11px] text-zinc-200 font-medium mb-1">
                    Apelido da carteira<span className="text-[#d4893f]">*</span>
                  </label>
                  <input
                    id="wallet-nickname"
                    type="text"
                    required
                    value={walletNickname}
                    onChange={(e) => setWalletNickname(e.target.value)}
                    className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 h-9 px-3 rounded-none focus:outline-none focus:border-[#d4893f]"
                  />
                </div>

                {/* Avatar */}
                <div>
                  <label className="block text-[11px] text-zinc-200 font-medium mb-1">
                    Avatar
                  </label>
                  <div className="flex items-center gap-3 h-9">
                    <div className="size-9 rounded-full bg-[#140d0a] border border-[#3a2416] flex items-center justify-center overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar do usuário" className="size-full object-cover" />
                      ) : (
                        <User className="size-4 text-zinc-500" aria-hidden="true" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAvatarChange}
                      className="bg-[#d4893f] text-[#1a110d] font-bold text-xs px-3 py-1.5 rounded-none hover:bg-[#e09a52] transition-colors"
                    >
                      Alterar
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Password change section */}
              <div className="pt-2">
                <h2 className="text-xs font-bold text-zinc-200 mb-3">
                  Alterar senha
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Senha atual */}
                  <div>
                    <label htmlFor="current-password" className="block text-[11px] text-zinc-200 font-medium mb-1">
                      Senha atual
                    </label>
                    <div className="relative">
                      <input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-600 h-9 px-3 pr-9 rounded-none focus:outline-none focus:border-[#d4893f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Eye className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nova senha */}
                  <div>
                    <label htmlFor="new-password" className="block text-[11px] text-zinc-200 font-medium mb-1">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-600 h-9 px-3 pr-9 rounded-none focus:outline-none focus:border-[#d4893f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Eye className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar nova senha */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-[11px] text-zinc-200 font-medium mb-1">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#140d0a] border border-[#3a2416] text-xs text-zinc-100 placeholder:text-zinc-600 h-9 px-3 pr-9 rounded-none focus:outline-none focus:border-[#d4893f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Eye className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit action */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant={null}
                  size={null}
                  className="h-auto border-0 bg-[#d4893f] text-[#1a110d] font-bold text-xs px-7 py-2 rounded-none hover:bg-[#e09a52] transition-colors active:not-aria-[haspopup]:translate-y-0"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
