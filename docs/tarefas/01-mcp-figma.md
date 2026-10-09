# 01 — Corrigir MCP do Figma (opcional)

**Onda:** livre · **Paralela com:** qualquer · **Depende de:** nada · **Bloqueia:** nada
**Label sugerido:** `ambiente` · **Esforço:** XS

## Objetivo

Ativar o MCP do Figma para inspecionar frames por thumbnail durante a implementação
(a REST API já funciona com o token atual — a tarefa é opcional).

## Subtasks

### 01.1 — Corrigir a configuração do MCP

- Editar `~/.config/opencode/opencode.json`: renomear a env do servidor `figma` de
  `FIGMA_PERSONAL_ACCESS_TOKEN` para `FIGMA_API_KEY` (mesmo token)

### 01.2 — Reiniciar e validar a conexão

- Reiniciar a sessão do opencode (MCP conecta no boot)
- Testar: anexar `https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge`
  e visualizar o node `2:2` (Desktop / Início)

## Critérios de aceite (gate)

- [x] `figma_view_node` devolve thumbnail sem erro `FIGMA_API_KEY is not set`

## Referências

- `PLANO.md` Fase 0 (pendência de ambiente)
- `docs/ESTRUTURA.md` §7
