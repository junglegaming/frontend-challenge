# Contratos REST e eventos

Base `/api`; JSON UTF-8; todos os pedidos HTTP da interface passam por Axios. Datas são ISO 8601. IDs são opacos, exceto IDs determinísticos de NFTs nas fixtures. ETH é uma string decimal; quantidade e versão são inteiros. Tipos compartilhados: `src/domain.ts`.

| Método e recurso | Entrada / resultado |
| --- | --- |
| GET `/session` | `{user: User \| null}` |
| POST `/auth/register` | `{name,email,password}` → `{user}`; conflito 409 |
| POST `/auth/login` | `{email,password}` → `{user}`; credenciais inválidas 401 |
| POST `/auth/logout` | Encerra sessão → `{ok:true}` |
| GET `/nfts` | Query `q,category,artist,sort,page,available` → `{items:Nft[],total,page,pages}`; 8 por página |
| GET `/nfts/:id` | `Nft`; 404 se inexistente |
| GET `/favorites` | `string[]` de IDs; privado |
| POST `/favorites` | `{id}` alterna favorito → `string[]`; privado |
| GET `/cart` | `Cart = {items:CartItem[],coupon}` da conta ou visitante |
| POST `/cart` | `{id,edition,quantity}` define quantidade; zero remove; ou `{coupon}` aplica/remove cupom |
| GET `/quote` | `Quote` com linhas, preços, subtotal, desconto, taxa, total, cupom e fingerprint |
| POST `/orders` | `{fingerprint,walletId,network,collector:{name,email,country,phone}}` + header `Idempotency-Key` → `Order` |
| GET `/orders/:id` | Estado atual e snapshot do pedido pertencente à sessão |
| GET `/profile` | `User` da sessão |
| PATCH `/profile` | `{name,email,avatar}` ou `{currentPassword,password}` → `User` atualizado |
| GET `/wallets` | `Wallet[]` da sessão |
| POST `/wallets` | `{id?,name,address,network,primary}` cria ou atualiza → `Wallet[]` |

`avatar` aceita data URL PNG/JPEG/WebP (interface limita a 1 MB). Rede: `Ethereum` ou `Polygon`; endereço: `0x` e 40 dígitos hexadecimais. O cupom `JUNGLE10` dá 10% de desconto; `EXPIRED` retorna erro de expiração. Taxa demonstrativa: `0.002` ETH para carrinho não vazio.

## Erros

Formato `{message:string, fields?:Record<string,string>}`. HTTP 401: sessão/credenciais inválidas; 404: recurso inexistente ou pedido de outro usuário; 409: conflito de cadastro, carteira, estoque, cotação ou idempotência; 422: validação; 503: indisponibilidade transitória. Falhas de rede não possuem resposta HTTP. Axios usa timeout de 7 s.

Pedidos são separados por usuário. A mesma chave e corpo recuperam o mesmo ID, mesmo que a resposta inicial tenha expirado. A mesma chave e corpo diferente retornam 409. O recibo é um snapshot; consulta do pedido não recalcula preços. Estados `confirmed` e `refused` são terminais.

## Socket.IO

Conexão WebSocket na origem da aplicação, path `/socket.io/`. Após conexão, o cliente emite `subscribe` com a identidade atual; o handler a confere com a sessão. Eventos públicos de catálogo podem ser recebidos como visitante.

| Evento | Payload | Efeito |
| --- | --- | --- |
| `nft.updated` | `Nft & {eventId:string}` | Atualiza versão/preço/estoque e invalida catálogo, carrinho e cotação |
| `order.updated` | `Order & {eventId:string}` | Atualiza somente o pedido da sessão e invalida carrinho |

O ID do recurso e `version` permitem rejeitar duplicatas e eventos antigos. Reconexão invalida recursos ativos para REST reconciliar o estado. A simulação de desconexão encerra o transporte interceptado; a reconexão continua pelo cliente Socket.IO.

## Controles de demonstração

Endpoints disponíveis apenas na implementação MSW:

- POST `/demo/scenario` `{scenario}`: troca condições sem limpar dados.
- POST `/demo/reset` `{scenario}`: restaura fixtures e remove dados modificados.
- POST `/demo/event` `{id?,kind,duplicate?,old?}`: altera NFT e emite evento; `kind:expire` expira sessão; `kind:disconnect` encerra conexões.

Esses endpoints são acionados dentro do navegador controlado pelo service worker. `curl` ou `page.request` não atravessam o worker e não substituem a integração de teste.
