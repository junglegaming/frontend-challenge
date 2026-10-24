# Contract: Mocked AI Image Generator (`domains/media-generation`, usado dentro de `admin-products`)

## Endpoint (mock, admin-only)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/media/generate-image` | `GenerateImageRequest { prompt: string }` | `GeneratedImage` (200) |

- `prompt` vazio ou só espaços → `422 VALIDATION_ERROR` com mensagem pedindo uma descrição
  (FR-015).
- Mesmo `prompt` → sempre o mesmo `seed` e o mesmo `src` (data URI), em qualquer sessão, em
  qualquer navegador — determinístico por construção (research.md D5, FR-013).
- Nenhuma chamada de rede real é feita; nenhuma chave de API é necessária; a resposta nunca depende
  de disponibilidade de um serviço externo (FR-014).

## Uso na tela

Dentro do formulário de criação/edição de anúncio (`admin-products`): um campo de texto para a
descrição + botão "Gerar imagem"; o resultado substitui a imagem atual do formulário. Gerar
novamente com o mesmo texto produz a mesma imagem (visível ao usuário como "nada muda").
