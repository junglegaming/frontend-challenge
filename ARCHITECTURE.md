# Arquitetura e decisões

## Organização

- `src/domain.ts`: contratos de domínio e conversões exatas ETH/wei.
- `src/api.ts`: Axios, mensagens de transporte e política padrão do TanStack Query.
- `src/router.tsx`: rotas TanStack Router, parâmetros validados e proteção dos fluxos privados. Páginas são carregadas sob demanda.
- `src/pages`: catálogo/detalhe, conta e compra.
- `src/components/ui`: componentes adaptados do padrão shadcn/ui, com CVA, Slot e primitivas acessíveis Radix.
- `src/mocks`: fixtures, banco persistente, REST e binding Socket.IO. Nenhum componente retorna respostas fictícias para substituir o transporte.
- `tests`: E2E com o mesmo service worker e protocolo de tempo real utilizados na demonstração.

## Dados e precisão

Preços, subtotal, descontos, taxa e total trafegam como strings decimais. Os cálculos usam `BigInt` em wei (18 casas), sem passar por `Number`. O desconto de 10% é truncado para o menor wei. Quantidades são inteiras. A cotação da API é a autoridade; o cliente apenas apresenta o resultado e multiplica valores exatos de linha.

O banco MSW é persistido em `localStorage` sob `jungle.mock.v1`, incluindo catálogo, sessão, hashes, contas, carrinhos, favoritos, carteiras e pedidos. O reset substitui o banco inteiro. Não há chamadas a serviços de blockchain ou pagamento.

## Sessão e isolamento

A sessão expira em uma hora. Os guards consultam `/session` antes de abrir checkout, perfil, carteiras, favoritos ou pedido. A sessão recuperada hidrata o cache antes da tela privada. HTTP 401 limpa o cache privado e retorna ao login com o endereço de retorno. A tentativa de pedido e o rascunho do checkout são separados por usuário em `sessionStorage`.

Login e logout limpam o QueryClient; as subscriptions Socket.IO são desmontadas e recriadas quando muda a identidade. Perfil, carteiras, favoritos, carrinho e pedidos incluem a identidade em suas chaves. Pedidos são consultados com autorização pelo proprietário e retornam 404 para outra conta. O carrinho visitante é incorporado ao autenticar, com limite de estoque.

## Cache e concorrência

Consultas têm `staleTime` de 30 s e refazem a busca ao recuperar foco. Há uma repetição para falhas transitórias de consulta; 4xx e mutations não são repetidos automaticamente. Axios recebe o AbortSignal do TanStack Query. Busca, filtros, ordenação e página fazem parte da chave da consulta e da URL, descartando respostas obsoletas. Mudanças de filtros retornam à primeira página.

Mutations invalidam os recursos relacionados. Favoritos usam atualização otimista, cancelamento da consulta concorrente, snapshot anterior e rollback em falha. O estado de edição, modal e conexão da carteira é local ao componente; dados de negócio pertencem à API e ao cache remoto.

## Pedidos

A revisão copia a cotação e sua fingerprint. O envio revalida a fingerprint, carteira, rede e estoque. Mudanças invalidam a revisão e exigem outro consentimento. Cada tentativa conserva uma chave de idempotência e seu corpo em sessionStorage. Depois de timeout ou refresh, o mesmo corpo/chave recupera o pedido existente; reutilização com corpo diferente responde 409.

O pedido persiste antes da simulação assíncrona. `pending` transita para `confirmed` ou `refused`, estados terminais. Após refresh, REST reconcilia pendências vencidas e o cliente também consulta periodicamente enquanto estiver pendente. O recibo usa o snapshot de cotação, carteira e coletor; alterações no catálogo não o reescrevem. Somente confirmação remove as quantidades compradas, preservando outras adições ao carrinho. A simulação verifica disponibilidade novamente ao concluir.

## Tempo real

`socket.io-client` usa transporte WebSocket na origem atual. MSW intercepta `/socket.io/` e `@mswjs/socket.io-binding@0.2.0` implementa framing/handshake Engine.IO/Socket.IO. O MSW 2.15 normaliza esse path para a origem ao resolver o handler. O módulo Socket.IO é importado no efeito de tempo real, depois de iniciar MSW: o cliente captura o construtor WebSocket ao carregar seu módulo. O código das rotas carrega em paralelo à ativação dos mocks, mas a interface só monta quando o worker está pronto. O detalhe reserva a proporção da galeria e o espaço das informações durante o skeleton para evitar deslocamento de layout. Os mocks mantêm heartbeat Engine.IO e limpam o intervalo ao fechar a conexão. Não há servidor externo; polling HTTP, namespaces próprios, acknowledgements e payloads binários não são utilizados. A dependência publicada usa `toSocketIo`, diferente da API ainda não publicada no branch principal da biblioteca.

Os eventos contêm identidade estável, id de recurso e versão monotônica. O cliente descarta versões antigas/duplicadas e não reabre pedidos terminais. Ao reconectar, invalida catálogo, detalhe, carrinho, cotação e pedido ativo, reconciliando-os com REST. Listeners são liberados ao desmontar. O mock mantém destinatários por identidade e remove conexões encerradas. Controles de demonstração alteram o banco e emitem o evento correspondente no mesmo handler.

## Interface e assets

O layout de referência orientou a paleta marrom/laranja, os cards, o hero, a lateral de coleções, os formulários e o recibo. Os quatro assets do Figma foram obtidos das exportações disponíveis no repositório de referência e convertidos para WebP; a origem está em `docs/ASSETS.md`.

Desvios conhecidos: composição não é uma reprodução pixel a pixel do Figma; sem acesso direto ao arquivo, tipografia usa fontes locais do sistema e títulos/nomes de fixtures são próprios. Ações fora de escopo foram omitidas. O rodapé reúne navegação de conta e cenários. O layout adapta catálogo para duas colunas em mobile, lateral recolhida, formulários empilhados e menu em diálogo acessível. Tons e tamanhos de texto priorizam contraste e leitura.

Diálogos usam Radix para foco, Escape e semântica. Existe skip link, foco visível, labels, avisos em live region, skeletons com movimento reduzido e dimensões de imagens declaradas.

## Limitações da simulação

O banco é local ao navegador; não sincroniza visitantes em dispositivos diferentes. O armazenamento local da API é observável pelo dono do navegador e não é uma barreira de segurança de produção. SHA-256 com contexto é suficiente para não persistir senhas em claro na demonstração; produção exige hashing apropriado no servidor e cookies de sessão seguros. A disponibilidade tem limite por edição e um teto compartilhado por NFT, ambos verificados na cotação e no pedido. A seleção de rede não representa taxas reais de blockchain.

Os cenários são determinísticos e comandados explicitamente. `variable` varia pela busca para reproduzir respostas fora de ordem. Não existe aleatoriedade de latência que torne os testes instáveis. As portas de preview/teste diferem; o cliente Socket.IO sempre usa a origem real da página para funcionar também no deploy.
