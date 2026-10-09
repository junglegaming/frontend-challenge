# NFT Marketplace

Marketplace de NFTs desenvolvido como desafio frontend com React e TypeScript. A aplicação reúne catálogo, detalhes de NFTs, favoritos, carrinho, checkout, pedidos e conta do colecionador.

APIs, autenticação, carteiras e pagamentos são simulados. A demonstração funciona com mocks locais, sem backend externo ou transações reais em blockchain.

## Como rodar

Pré-requisitos: **Node.js 22.12 ou superior** e **pnpm 10.33.2**, versão indicada em `package.json`. O Vite instalado aceita Node `^20.19.0 || >=22.12.0`.

Após instalar o Node.js, instale a versão de pnpm utilizada pelo projeto:

```powershell
npm install --global pnpm@10.33.2
```

Na raiz do repositório, instale as dependências e inicie o ambiente de desenvolvimento:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`. Não é necessário criar ou enviar um arquivo `.env.local`: o desenvolvimento ativa os mocks por padrão.

Não é necessário configurar uma URL de API ou acesso ao Figma para rodar a aplicação. Os assets necessários já estão no repositório, e o Playwright também ativa os mocks automaticamente ao iniciar seu servidor de testes.

Para gerar e visualizar o build de demonstração no PowerShell:

```powershell
$env:VITE_MOCKS='true'
pnpm build
pnpm preview
```

Em macOS/Linux, use `VITE_MOCKS=true pnpm build` e depois `pnpm preview`. A flag é incorporada ao build: sem ela, o build desativa os mocks por padrão. Abra a URL indicada pelo preview, normalmente `http://localhost:4173`.

### Configurações de ambiente opcionais

A aplicação em desenvolvimento e os testes Playwright não exigem um arquivo `.env`. O arquivo `.env.example` apenas documenta as configurações disponíveis; copiá-lo não é uma etapa obrigatória do setup.

| Variável | Quando utilizar |
| --- | --- |
| `VITE_MOCKS` | Para gerar o build de demonstração, definir `true` no terminal ou no ambiente de build. Em desenvolvimento, o padrão já é `true`; no build, é `false`. |
| `VITE_API_BASE_URL` | Somente para apontar os clientes HTTP e Socket.IO a outro servidor. Pode permanecer ausente na demonstração com mocks. |
| `VITE_MOCK_SCENARIO` | Opcional para escolher um cenário inicial. Sem configuração ou seleção anterior, o cenário é `padrao`; também pode ser escolhido pela URL ou pelo seletor. |
| `VITE_MOCK_UI` | Opcional: `1` exibe o seletor de cenários no build publicado. Em desenvolvimento ele aparece automaticamente. |

As variáveis `FIGMA_TOKEN`, `FIGMA_FILE_KEY` e `FIGMA_VERSION` são usadas somente pelo script `pnpm fig:extract`. O token é necessário para a etapa de consulta à API do Figma; o identificador já possui um valor padrão no script, e a versão é opcional. Essas configurações locais não são necessárias para executar, testar ou publicar a aplicação e não precisam ser enviadas ao avaliador. `.env.local` está ignorado pelo Git.

### Credenciais fictícias

| Usuário | E-mail                       | Senha       |
| ------- | ---------------------------- | ----------- |
| Ana     | `ana@nft-marketplace.test`   | `Ana12345`  |
| Bruno   | `bruno@nft-marketplace.test` | `Bruno1234` |

## Deploy no Cloudflare Pages

O projeto publicado utiliza **Direct Upload**, com build local e envio de `dist` pelo Wrangler. A demonstração mantém MSW ativo, sem backend externo.

Antes de publicar, execute no PowerShell:

```powershell
pnpm typecheck
pnpm lint
$env:VITE_MOCKS='true'
pnpm build
```

Autentique sua conta e envie o build para o projeto existente:

```sh
pnpm dlx wrangler login
pnpm dlx wrangler pages deploy dist --project-name nft-marketplace --branch main
```

URL de produção: [NFT Marketplace](https://nft-marketplace-1by.pages.dev/).

O Pages atende as rotas internas como SPA automaticamente quando não há `404.html` na raiz do build. Não é necessário adicionar rewrites. Após publicar, confira o catálogo, login, checkout e refresh de uma rota interna.

As variáveis `VITE_*` são incorporadas ao build local. Para alterar o cenário ou exibir o seletor (`VITE_MOCK_UI=1`), gere o build novamente e repita o upload. O token do Figma não é necessário.

O projeto Direct Upload não executa builds automaticamente a cada push no GitHub. Novas versões devem ser enviadas pelo comando acima.

Referências: [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) e [roteamento SPA do Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Arquitetura

A organização é **feature-first**: cada domínio concentra componentes, hooks e consultas em `src/features/`. As rotas ficam em `src/routes/`, os componentes compartilhados em `src/components/` e a infraestrutura em `src/lib/`.

```text
Rotas → Features → Clientes HTTP / Socket → Rede interceptada pelo MSW
                  ↕
             Cache do TanStack Query
```

- **Interface:** React, TypeScript strict, Tailwind CSS v4 e componentes shadcn/ui. O CSS do projeto está centralizado em `src/styles/global.css`.
- **Navegação:** TanStack Router com rotas baseadas em arquivos e divisão automática de código. Rotas privadas usam `beforeLoad`, com retorno ao fluxo via parâmetro `redirect`.
- **Estado remoto:** TanStack Query, com factory de query keys, isolamento dos dados privados por usuário, invalidação após mutations e atualização otimista de favoritos com rollback.
- **REST e contratos:** chamadas passam pelo Axios em `src/lib/http`. Schemas zod validam os contratos e fornecem os tipos inferidos do cliente.
- **Tempo real:** `socket.io-client` centralizado em `src/lib/socket`. Eventos de NFTs e pedidos são tratados por versão; a reconexão reconcilia os recursos com REST.
- **Mocks:** MSW intercepta REST e, com `@mswjs/socket.io-binding`, o transporte Socket.IO. Fixtures, persistência e cenários ficam em `src/mocks/`.
- **Sessão e compra:** sessão com token opaco persistido em `gm_session`, expiração de duas horas e sem refresh silencioso. Pedidos usam uma chave de idempotência persistida em `gm_pending_order`; a confirmação depende do estado `confirmed` da simulação.
- **Dinheiro:** valores ETH trafegam como strings decimais. Os cálculos ficam em `src/lib/money.ts`, com decimal.js, evitando perda de precisão com ponto flutuante.

As políticas detalhadas de sessão, cache, retries e reconciliação estão em [ARCHITECTURE.md](ARCHITECTURE.md).

## Tecnologias e motivos de uso

A stack principal atende aos requisitos do desafio. As bibliotecas complementares ajudam a organizar formulários, componentes, interações e ferramentas de desenvolvimento. A tabela descreve o uso encontrado no código atual.

### Aplicação, dados e formulários

| Tecnologia                                  | Uso e motivo                                                                                                                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React e React DOM                           | Construção e renderização da interface com componentes reutilizáveis, composição e estado local para as interações.                                                    |
| TypeScript                                  | Tipagem estática em modo strict para verificar os limites entre rotas, dados, formulários e componentes durante o desenvolvimento.                                     |
| Vite e `@vitejs/plugin-react`               | Servidor de desenvolvimento e build da aplicação, com integração React e atualização da interface durante a edição.                                                    |
| TanStack Router e `@tanstack/router-plugin` | Rotas tipadas baseadas em arquivos, parâmetros de busca, proteção de rotas e divisão automática de código. Mantêm navegação e estado da URL integrados.                |
| TanStack Query                              | Gerencia consultas, cache, mutations e invalidação dos dados remotos. Permite tratar carregamento e erros e implementar favoritos com atualização otimista e rollback. |
| Axios                                       | Centraliza chamadas REST, timeout, credenciais, cancelamento e tratamento de erros em um único cliente HTTP.                                                           |
| React Hook Form                             | Gerencia valores, erros e envio de formulários de autenticação, perfil, carteiras e checkout, reduzindo a lógica manual de controle dos campos.                        |
| zod                                         | Valida dados em tempo de execução, incluindo contratos de API, formulários e parâmetros da URL. Os tipos inferidos com `z.infer` mantêm validação e tipagem alinhadas. |
| `@hookform/resolvers`                       | Conecta os schemas zod ao React Hook Form, reutilizando as regras de validação para apresentar erros nos campos.                                                       |
| decimal.js                                  | Realiza cálculos com valores ETH sem convertê-los para números de ponto flutuante, preservando a precisão monetária.                                                   |
| `socket.io-client`                          | Recebe atualizações de NFTs e pedidos pela camada de tempo real, com tratamento de versões e reconciliação após reconexão.                                             |
| TanStack Table                              | Organiza as colunas e a renderização da tabela de itens do carrinho, mantendo o modelo da tabela separado da apresentação.                                             |

### Componentes e apresentação

| Tecnologia                            | Uso e motivo                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tailwind CSS v4 e `@tailwindcss/vite` | Aplicam utilitários e tokens de estilo com integração ao build do Vite, mantendo a configuração visual no CSS global.                                  |
| shadcn/ui                             | Fornece a base de componentes mantidos na própria codebase, permitindo adaptar sua composição e apresentação ao projeto.                               |
| Radix UI (`radix-ui`)                 | Sustenta componentes como dialog, sheet, select, tooltip e controles de formulário, com primitivas para interação por teclado e gerenciamento de foco. |
| class-variance-authority              | Define variantes tipadas de componentes, como botões, badges e campos, evitando repetir combinações de classes.                                        |
| `cn`                                  | Compõe classes condicionais e resolve conflitos de utilitários; a configuração local inclui os tokens de tipografia do projeto.                        |
| Lucide React                          | Fornece ícones reutilizáveis para ações e feedback da interface.                                                                                       |
| Embla Carousel e Autoplay             | Implementam o carrossel de destaques da home, com navegação e reprodução automática controladas pelo componente.                                       |
| Sonner                                | Exibe notificações de ações, erros e atualizações de dados, centralizando o feedback ao usuário.                                                       |
| `@fontsource/roboto-mono`             | Inclui os pesos da fonte no bundle para servir a tipografia localmente, sem depender de uma requisição a um provedor externo de fontes.                |
| `tw-animate-css`                      | Disponibiliza utilitários de animação importados pelo CSS global para as transições dos componentes.                                                   |
| `vite-plugin-svgr`                    | Permite importar SVGs como componentes React e integrá-los à composição da interface.                                                                  |

### Mocks, testes e ferramentas

| Tecnologia                               | Uso e motivo                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSW                                      | Intercepta requisições na camada de rede, permitindo desenvolver e testar cenários simulados sem inserir respostas fictícias nos componentes.        |
| `@mswjs/socket.io-binding`               | Integra a simulação de eventos ao transporte Socket.IO interceptado, exercitando o cliente real de tempo real.                                       |
| Vitest                                   | Executa testes de contrato e da infraestrutura, validando o comportamento dos mocks e clientes.                                                      |
| Playwright                               | Executa fluxos pelo navegador em desktop e mobile, com relatório HTML e traces de falhas.                                                            |
| Lighthouse                               | Disponibiliza auditorias de performance, acessibilidade, boas práticas e SEO.                                                                        |
| ESLint e plugins de TypeScript/React     | Verificam problemas estáticos, regras de hooks e condições de uso do Fast Refresh.                                                                   |
| Prettier e `prettier-plugin-tailwindcss` | Padronizam a formatação dos arquivos e a ordenação das classes Tailwind. `eslint-config-prettier` evita conflitos entre regras de lint e formatação. |
| fflate                                   | Descompacta o arquivo local do Figma no script de extração para recuperar os assets usados pelo projeto.                                             |
| pnpm                                     | Gerencia dependências e scripts; o lockfile e a versão indicada em `package.json` ajudam a reproduzir a instalação.                                  |

### Dependências instaladas sem uso identificado

Algumas bibliotecas constam em `package.json`, mas não possuem imports no código atual:

- **nuqs:** biblioteca para gerenciar estado em parâmetros da URL. Neste projeto, essa responsabilidade está implementada com TanStack Router e schemas zod; não há integração ativa do nuqs.
- **next-themes:** biblioteca para gerenciar temas. Não há integração ativa encontrada na aplicação.
- **`@base-ui/react` e `@radix-ui/react-slot`:** primitivas de componentes presentes nas dependências. Os componentes atuais utilizam o pacote `radix-ui`, incluindo seu `Slot`.

## Cenários e reset dos mocks

Selecione um cenário com `?scenario=<id>` na URL ou pelo controle flutuante de desenvolvimento. A seleção também pode vir de `VITE_MOCK_SCENARIO`. A prioridade é URL, seleção em tempo de execução, cenário persistido, variável de ambiente e, por último, `padrao`.

Os dados simulados persistem localmente para permitir refresh. Use `?reset=1` para restaurar os dados iniciais, o botão de reset no seletor ou `POST /api/_mock/reset` nas ferramentas de teste. Para voltar ao cenário padrão e restaurar os dados, abra `/?scenario=padrao&reset=1`.

Exemplos, usando a URL local do servidor:

| Cenário            | Como reproduzir                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Carregamento lento | Abra `/?scenario=lento&reset=1` para observar os estados de carregamento.                                                            |
| Falha de rede      | Abra `/?scenario=offline&reset=1`. Para recuperar a demonstração, volte a `/?scenario=padrao&reset=1`.                               |
| Erro HTTP          | Abra `/?scenario=erro-5xx&reset=1` para simular falha no catálogo e detalhe.                                                         |
| Pagamento recusado | Abra `/?scenario=pagamento-recusado&reset=1`, entre com Ana, revise o carrinho e conclua o checkout para observar a recusa simulada. |

O catálogo completo, os gatilhos dos demais cenários e as limitações do transporte estão em [docs/MOCKS.md](docs/MOCKS.md).

## Comandos disponíveis

| Comando                              | Finalidade                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`                           | Servidor Vite de desenvolvimento.                                                                    |
| `pnpm build`                         | Verificação TypeScript e build de produção.                                                          |
| `pnpm preview`                       | Servidor local para visualizar o build.                                                              |
| `pnpm typecheck`                     | Verificação TypeScript com `tsc -b`.                                                                 |
| `pnpm lint` / `pnpm lint:fix`        | ESLint, sem ou com correções automáticas.                                                            |
| `pnpm format` / `pnpm format:check`  | Formatação ou conferência com Prettier.                                                              |
| `pnpm test:contract`                 | Testes de contrato com Vitest.                                                                       |
| `pnpm test:e2e` / `pnpm test:e2e:ui` | Testes Playwright, por terminal ou interface interativa.                                             |
| `pnpm lighthouse`                    | Auditoria de `http://localhost:5173/`, com saída em `report.html`; exige o servidor ativo nessa URL. |
| `pnpm fig:extract`                   | Extração de assets locais e referências do Figma para `public/` e `docs/figma/`.                     |

Antes da primeira execução E2E, instale o navegador:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

O Playwright inicia seu próprio servidor com mocks, na porta `54123`, e possui projetos Chromium desktop (1440 × 900) e mobile (390 × 844). O relatório HTML pode ser aberto com `pnpm exec playwright show-report`; traces são mantidos em caso de falha.

A extração do Figma utiliza o arquivo local `Frontend Challenge.fig` e exige `FIGMA_TOKEN` para a etapa de consulta à API. Os assets necessários à aplicação já estão no repositório.

A existência desses comandos não representa comprovação de cobertura integral dos testes ou de cumprimento das metas de Lighthouse definidas no desafio.

## Páginas auxiliares

Além dos fluxos do marketplace, existem duas páginas públicas de apoio ao desenvolvimento, acessíveis diretamente pela URL:

| Rota      | Finalidade                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/tokens` | Demonstração dos design tokens e componentes visuais utilizados pela interface.                                                                                          |
| `/teste`  | Página de experimentação dos parâmetros do catálogo na URL. Exibe os filtros atuais em JSON e permite testar busca, filtros, ordenação, paginação e limpeza dos filtros. |

Com o servidor de desenvolvimento na porta padrão, abra [Design Tokens](http://localhost:5173/tokens) ou [Teste de parâmetros](http://localhost:5173/teste). No deploy, utilize os mesmos caminhos na URL publicada.

## Documentação

| Documento                                                            | Conteúdo                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| [Arquitetura](ARCHITECTURE.md)                                       | Sessão, cache, dinheiro, erros e sincronização REST/Socket.IO. |
| [Estrutura](docs/ESTRUTURA.md)                                       | Organização de pastas, rotas e responsabilidades.              |
| [Estilos](docs/ESTILOS.md)                                           | Referências visuais e padrões de componentes.                  |
| [Contratos REST](docs/api/README.md)                                 | Endpoints, modelos e erros da API simulada.                    |
| [Mocks](docs/MOCKS.md)                                               | Cenários, persistência, reset, tempo real e testes.            |
| [Referências do Figma](docs/figma/README.md)                         | Assets e documentação da extração.                             |
| [Enunciado original](docs/DESAFIO.md)                                | Requisitos, critérios e entregas do desafio.                   |
| [Instruções para agentes](AGENTS.md)                                 | Regras e referências para o trabalho assistido por IA.         |
| [Plano de execução](PLANO.md) e [tarefas](docs/tarefas/00-INDICE.md) | Planejamento e critérios de verificação por etapa.             |

## Uso de IA e automações de apoio

A IA foi utilizada principalmente para auxiliar nas decisões arquiteturais, na organização das responsabilidades e no planejamento da implementação.

O fluxo assistido por IA utiliza as instruções de `AGENTS.md`, as skills em `.agents/skills/` e os documentos de planejamento para orientar o trabalho dos agentes. Esses recursos apoiam a execução de tarefas e verificações; não há uma rotina agendada ou pipeline de IA configurado no repositório.

Devido à falta de precisão da IA na reprodução visual, o layout foi revisado e implementado manualmente, com base na referência do Figma.

## Situação da entrega

Devido ao prazo de entrega, o desafio não foi concluído integralmente. Alguns layouts ficaram sem revisão final:

- Menu mobile exibido na home.
- Carrinho mobile.
- Página **Perfil > Carteiras**.

Essas pendências dizem respeito à revisão dos layouts mencionados. Os requisitos originais permanecem disponíveis no enunciado para comparação com a entrega.
