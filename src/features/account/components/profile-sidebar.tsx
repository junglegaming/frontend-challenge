import { LockKeyhole, LogOut } from "lucide-react";
import {
  profileMenuItems,
  type ProfileSection,
} from "./profile/profile-form.constants";

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
  onLogout: () => void;
}

export function ProfileSidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: ProfileSidebarProps) {
  return (
    <aside className="h-fit w-full shrink-0 overflow-hidden rounded-xl border border-[#40271d] bg-[#241611] md:w-[310px]">
      <h2 className="px-5 py-5 text-sm font-bold text-[#f5eee9]">Meu perfil</h2>

      <nav className="flex flex-col gap-1 px-3 pb-4">
        {profileMenuItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          const isLocked = id !== "profile" && id !== "wallets";

          return (
            <button
              key={id}
              type="button"
              disabled={isLocked}
              onClick={() => {
                if (!isLocked) onSectionChange(id);
              }}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[11px] transition-colors ${
                isActive
                  ? "bg-[#3a251b] font-semibold text-[#e99a4e]"
                  : isLocked
                    ? "cursor-not-allowed text-[#8b6958]/60"
                    : "text-[#d9904b] hover:bg-[#301e17]"
              }`}
            >
              <Icon className="size-[14px] shrink-0" />

              <span className="flex-1">{label}</span>

              {isLocked && (
                <LockKeyhole className="size-3 shrink-0 text-[#8b6958]/50" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#523326] p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[11px] font-bold text-[#e99a4e] transition-colors hover:bg-[#301e17]"
        >
          <LogOut className="size-[14px]" />
          Sair
        </button>
      </div>
    </aside>
  );
}
