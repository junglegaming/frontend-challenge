import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { http, message, queryClient, useSession } from "../api";
import { useToast } from "../shell";
import { Button } from "./ui/button";

export function FavoriteButton({
  id,
  name,
  compact = false,
}: {
  id: string;
  name?: string;
  compact?: boolean;
}) {
  const { data: user, isPending } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const key = ["private", user?.id, "favorites"];
  const favorites = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) =>
      (await http.get<string[]>("/favorites", { signal })).data,
    enabled: !!user,
  });
  const active = favorites.data?.includes(id) ?? false;
  const toggle = useMutation({
    mutationFn: async (desired: boolean) => {
      if (!user) return;
      await http[desired ? "post" : "delete"](`/favorites/${id}`);
    },
    onMutate: async (desired) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData(
        key,
        desired
          ? [...new Set([...previous, id])]
          : previous.filter((item) => item !== id),
      );
      return previous;
    },
    onError: (error, _value, previous) => {
      queryClient.setQueryData(key, previous);
      toast(message(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({
        queryKey: ["catalog"],
        predicate: (query) =>
          typeof query.queryKey[1] === "object" &&
          !!(query.queryKey[1] as { favorites?: boolean }).favorites,
      });
    },
  });
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={`favorite-button ${compact ? "favorite-compact" : ""}`}
      aria-label={`${active ? "Remover dos favoritos" : "Adicionar aos favoritos"}${name ? `: ${name}` : ""}`}
      aria-pressed={active}
      disabled={
        isPending || toggle.isPending || (!!user && favorites.isPending)
      }
      onClick={() =>
        user
          ? toggle.mutate(!active)
          : void navigate({ to: "/login", search: { returnTo: `/nft/${id}` } })
      }
    >
      <Heart size={17} fill={active ? "currentColor" : "none"} />
      {!compact && <span>{active ? "Favoritado" : "Favoritar"}</span>}
    </Button>
  );
}
