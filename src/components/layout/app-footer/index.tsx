import { FooterContent } from "./footer-content";
import { FooterTop } from "./footer-top";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-auto mt-16 mb-5 w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-[#684021] bg-[#24150F]">
        <FooterTop />

        <div className="border-t border-[#684021]">
          <FooterContent />
        </div>

        <div className="bg-black px-5 py-4 text-center text-xs font-bold leading-5 text-[#F5EDE5]">
          © {currentYear} Kurio. Propriedade digital para todos.
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
