# KURIO — NFT Marketplace

Marketplace de NFTs desenvolvido com React, TypeScript e Vite. O projeto permite explorar NFTs, visualizar detalhes, gerenciar favoritos, carteiras, carrinho e pedidos.

A aplicação utiliza **MSW (Mock Service Worker)** para simular a API e permitir a demonstração dos fluxos de autenticação e das funcionalidades do marketplace.

## Tecnologias

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Axios
- Tailwind CSS
- shadcn/ui
- MSW
- Lucide React
- Sonner

## Funcionalidades

- Catálogo de NFTs com busca, filtros e ordenação.
- Página de detalhes dos NFTs.
- Cadastro e login.
- Gerenciamento de perfil e sessão.
- Cadastro e gerenciamento de carteiras.
- Lista de favoritos.
- Carrinho de compras.
- Checkout demonstrativo.
- Histórico de pedidos.
- Interface responsiva para desktop e mobile.

## Acesso para demonstração

A aplicação possui um usuário previamente cadastrado para testar o login.

| Campo  | Credencial        |
| ------ | ----------------- |
| E-mail | `teste@email.com` |
| Senha  | `12345678`        |

Também é possível criar uma nova conta pela tela de cadastro.

**Observação:** a autenticação e os dados são simulados pelo MSW e armazenados no navegador. Não existe autenticação real ou persistência compartilhada entre dispositivos.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/mateuslucasjm/kurio-frontend-challenge.git
cd kurio-frontend-challenge
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

## Variáveis de ambiente

O arquivo `.env.example` contém as configurações necessárias para executar a aplicação com o MSW:

```env
VITE_API_URL=/api
VITE_ENABLE_MOCKS=true
```

## Executar o projeto

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Gere o build de produção:

```bash
npm run build
```

## Estrutura do projeto

A aplicação utiliza uma organização baseada em funcionalidades (_feature-based architecture_).

```text
src/
├── components/
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── market/
│   └── nft-details/
├── lib/
├── mocks/
├── routes/
├── styles/
└── main.tsx
```

## Demonstração

**Aplicação publicada:** https://kurio-frontend-challenge-phi.vercel.app/

**Repositório:** https://github.com/mateuslucasjm/kurio-frontend-challenge
