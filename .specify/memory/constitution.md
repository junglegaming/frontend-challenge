<!--
Sync Impact Report
- Version change: (template não preenchido) → 1.0.0
- Modified principles: nenhum (primeira adoção; todos os princípios são novos)
- Added sections: Core Principles I–VII, Restrições Técnicas e de Escopo,
  Fluxo de Desenvolvimento e Qualidade, Governance
- Removed sections: nenhum
- Follow-up TODOs: nenhum (RATIFICATION_DATE definida como a data da primeira adoção)
-->
# NFT Marketplace Constitution

## Core Principles

### I. Arquitetura em Camadas e Fronteiras de Dependência (NON-NEGOTIABLE)
O código MUST seguir o fluxo `app/routes → pages → domains → shared`, conforme `docs/TEAMS.md`.
- Uma página MUST NOT importar outra página; código usado por duas páginas sobe para um domínio
  ou para `shared/ui`.
- Páginas e rotas MUST importar domínios apenas pela API pública (`@/domains/<domínio>`).
- Rotas MUST importar páginas apenas por `@/pages/<página>`.
- `shared/` MUST NOT importar `app/`, `pages/` nem `domains/`.
- Cada tela MUST ter uma pasta própria em `src/pages/<página>` com README (escopo, rota, domínios).

Justificativa: times diferentes são donos de páginas diferentes; as fronteiras evitam acoplamento
e são verificadas mecanicamente por `pnpm lint`.

### II. Tipagem Estrita e Contratos Explícitos
Contratos (DTOs) MUST ser tipados entre transporte, estado e interface, e viver em
`domains/<domínio>/model`, sem React e sem Axios. `any` é proibido (use `unknown` com narrowing,
genéricos ou tipos dos contratos). Dados externos MUST ser validados na borda (Zod). Valores em ETH
MUST trafegar como strings decimais e ser calculados com `decimal.js`; quantidades são inteiras.

Justificativa: precisão monetária e segurança de tipos são requisitos do domínio.

### III. Estado Remoto Disciplinado
Toda chamada REST MUST passar pelo cliente Axios e todo estado remoto MUST ser gerido pelo
TanStack Query, com query keys isoladas por usuário e por parâmetros. Filtros, busca, ordenação e
paginação MUST viver na URL (TanStack Router). Interações com mutation MUST tratar estados de
carregamento, vazio, erro, sucesso e atualização em segundo plano; respostas obsoletas MUST ser
canceladas ou descartadas. Operações de pedido MUST usar chave de idempotência. Pelo menos uma
interação MUST usar atualização otimista com rollback. Política de cache, retries e sincronização
MUST ser documentada.

### IV. Tempo Real Confiável
Eventos Socket.IO (`nft.updated`, `order.updated`) MUST carregar identidade estável, recurso e
versão; o cliente MUST tolerar duplicatas e eventos antigos sem regredir estado. Após reconexão, os
recursos ativos MUST ser reconciliados via REST. Listeners MUST ser liberados no fim do ciclo de
vida, e eventos de uma sessão anterior MUST NOT afetar outro usuário. Logout e troca de usuário MUST
limpar caches privados e subscriptions.

### V. Mocks Apenas na Camada de Rede
Toda simulação MUST residir em `src/mocks` (MSW, incluindo Socket.IO via
`@mswjs/socket.io-binding`). Componentes, hooks e o cliente Axios MUST NOT conter dados fictícios
nem caminhos de negócio alternativos. Cenários MUST ser determinísticos, configuráveis, reproduzíveis
e consistentes entre REST e eventos; o reset MUST restaurar um cenário conhecido.

### VI. Acessibilidade, Responsividade e Fidelidade Visual (NON-NEGOTIABLE)
Todas as telas MUST funcionar em 390, 768 e 1440 px, sem overflow horizontal indevido. Navegação
por teclado, foco visível, controle de foco em diálogos/drawers, labels e erros associados aos
campos, alternativas textuais e feedback acessível (mutations e tempo real) são obrigatórios.
Estados de carregamento MUST usar skeletons com shimmer que preservem dimensões e respeitem
`prefers-reduced-motion`. Componentes `src/shared/ui/*` MUST vir da CLI do shadcn/ui e ser
adaptados via tema (`src/index.css`), não reescritos. A identidade visual do Figma MUST ser
preservada.

### VII. Verificação por Testes e Auditoria
Fluxos críticos MUST ter testes E2E Playwright executados contra os mocks (uma pasta por página em
`e2e/`), incluindo regressão visual. Cenários de falha (rede, 4xx/5xx, sessão expirada, cupom
inválido, preço alterado, timeout com recuperação idempotente) MUST ser cobertos. Mudanças MUST
manter `pnpm lint`, `pnpm typecheck` e `pnpm build` verdes, e o desempenho/qualidade MUST ser
auditado com Lighthouse (`pnpm lighthouse`).

## Restrições Técnicas e de Escopo

- Stack obrigatória: React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO,
  Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse. Cada tecnologia MUST participar
  efetivamente da solução.
- Gerenciador de pacotes: pnpm. Linter: oxlint (`.oxlintrc.json` codifica as regras de fronteira).
- Fora de escopo: integrações reais de blockchain, extensões de carteira e gateways de pagamento;
  páginas editoriais, suporte, atividade, ofertas e downloads. Ações fora do escopo MUST NOT
  aparentar sucesso funcional.
- Segurança: credenciais fictícias apenas; senhas MUST NOT ser armazenadas em claro; checkout,
  perfil, carteiras, favoritos e pedidos exigem autenticação.
- Recibos MUST reproduzir o snapshot do pedido, imutável a mudanças posteriores no catálogo.

## Fluxo de Desenvolvimento e Qualidade

- Cada mudança segue o fluxo Spec Kit: especificação → plano → tarefas → implementação.
- Todo PR MUST passar em lint, typecheck e build, e ser revisado quanto à conformidade com esta
  constituição; desvios MUST ser justificados no plano (seção de complexidade).
- Mudanças de comportamento visível MUST atualizar ou adicionar testes E2E e snapshots visuais.
- Commits MUST ser pequenos e descritivos, seguindo o padrão já usado no repositório
  (ex.: `feat(...)`, `refactor:`, `chore(...)`).
- Mudanças de estrutura MUST atualizar `docs/TEAMS.md` e o README da página afetada.

## Governance

Esta constituição prevalece sobre outras práticas do projeto. Emendas MUST ser propostas por PR
que atualize este arquivo, descreva a motivação e o impacto, inclua plano de migração quando houver
quebra, e seja aprovado por pelo menos um responsável de time. Versionamento semântico:
MAJOR para remoção ou redefinição incompatível de princípios; MINOR para novo princípio/seção ou
expansão material; PATCH para esclarecimentos e correções de redação. Revisões de código e
`/speckit-analyze` MUST verificar conformidade; regras de fronteira (Princípio I) são impostas
automaticamente por `pnpm lint`. Orientação de uso diário: `docs/TEAMS.md` e `docs/CHALLENGE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-14
