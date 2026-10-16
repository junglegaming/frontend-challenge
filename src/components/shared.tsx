import { Link } from "@tanstack/react-router";
import { ArrowRight, PackageOpen, RefreshCw } from "lucide-react";
import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { Button } from "./ui/button";
import { message } from "../api";
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="empty">
      <PackageOpen size={40} strokeWidth={1} />
      <h1 aria-label={title}>{title}</h1>
      <p className="muted">{description}</p>
      {children ?? (
        <Button asChild>
          <Link to="/">
            Explorar NFTs <ArrowRight size={16} />
          </Link>
        </Button>
      )}
    </section>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <section className="error-state" role="alert">
      <h2>Não conseguimos carregar agora</h2>
      <p>{message(error)}</p>
      <Button variant="outline" onClick={retry}>
        <RefreshCw size={15} />
        Tentar novamente
      </Button>
    </section>
  );
}
export function Skeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div
      className="skeleton-grid"
      role="status"
      aria-label="Carregando conteúdo"
    >
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton aspect-square" />
          <div className="skeleton h-4 mt-4 w-3/4" />
          <div className="skeleton h-4 mt-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const errorId = useId();
  const control =
    error && isValidElement<Record<string, unknown>>(children)
      ? cloneElement(children, {
          "aria-label": children.props["aria-label"] ?? label,
          "aria-invalid": true,
          "aria-describedby": [children.props["aria-describedby"], errorId]
            .filter(Boolean)
            .join(" "),
        })
      : children;
  return (
    <label className="field">
      <span>{label}</span>
      {control}
      {error && (
        <small id={errorId} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="page-title">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 aria-label={title}>{title}</h1>
      {description && <p className="muted">{description}</p>}
    </header>
  );
}
