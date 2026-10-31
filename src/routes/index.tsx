import { AppFooter } from "@/components/layout/app-footer";
import { ProfilePage } from "@/features/account";
import { useSession } from "@/features/auth/hooks/use-session";
import HomePage from "@/features/home";
import { BlogSection } from "@/features/home/components/blog-section";
import { PromotionsSection } from "@/features/home/components/promotions-section";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data, isLoading } = useSession();

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        Carregando...
      </main>
    );
  }

  const isAuthenticated = Boolean(data?.user);

  if (isAuthenticated) {
    return <ProfilePage />;
  }

  return (
    <>
      <HomePage />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <PromotionsSection />
        <BlogSection />
      </main>

      <div className="hidden sm:block">
        <AppFooter />
      </div>
    </>
  );
}
