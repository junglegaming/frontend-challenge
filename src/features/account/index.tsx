import { useState } from "react";

import { useLogout } from "@/features/auth/hooks/use-logout";
import { useSession } from "@/features/auth/hooks/use-session";
import { ProfileForm } from "./components/profile";
import { ProfileSidebar } from "./components/profile-sidebar";
import type { ProfileSection } from "./components/profile/profile-form.constants";
import { WalletForm } from "./components/wallet";

const sectionTitles: Record<ProfileSection, string> = {
  profile: "Dados do perfil",
  wallets: "Carteiras",
  activity: "Atividade",
  favorites: "Lista de interesse",
  offers: "Ofertas",
  downloads: "Arquivos baixados",
  support: "Suporte",
};

export function ProfilePage() {
  const { data, isLoading } = useSession();
  const logout = useLogout();

  const [activeSection, setActiveSection] = useState<ProfileSection>("profile");

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-[#d9904b]">Carregando perfil...</p>
      </main>
    );
  }

  if (!data?.user) return null;

  return (
    <main className="mx-auto min-h-[calc(100vh-70px)] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-7 md:flex-row">
        <ProfileSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={() => logout.mutate()}
        />

        <section className="min-w-0 flex-1 py-0 md:pl-0">
          {activeSection === "profile" && <ProfileForm user={data.user} />}

          {activeSection === "wallets" && <WalletForm />}

          {!["profile", "wallets"].includes(activeSection) && (
            <div className="py-2">
              <h1 className="text-base font-bold text-[#f5eee9]">
                {sectionTitles[activeSection]}
              </h1>

              <p className="mt-4 text-sm text-[#a99385]">
                Esta área será implementada em uma próxima etapa.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
