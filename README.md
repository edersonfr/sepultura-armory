# Sepultura • Guild Armory (World of Warcraft: Forever)

Portal e Armory exclusivo da guilda **Sepultura** (Horda • US Normal) no **World of Warcraft: Forever**, construído com **Next.js (App Router)**, **TypeScript** e **Tailwind CSS**, consumindo diretamente a API oficial da **Blizzard Battle.net**.

## Funcionalidades

- **Dashboard da Guilda Sepultura (`/`)**:
  - Dados em tempo real da guilda (Total de membros, maior nível atual, personagens Nv. 10+ com Armory ativo e média de nível).
  - **Vanguarda da Sepultura (Top Níveis)**: Destaque rápido dos 6 personagens de maior nível.
  - **Composição por Classe**: Gráfico de barras com cores e ícones oficiais de cada classe.
  - **Roster Interativo**: Busca por nome/sobrenome, filtro rápido por nível e por classe, e ordenação por Nível, Nome ou Rank na Guilda.
- **Armory do Personagem (`/character/[slug]`)**:
  - Layout clássico **Paperdoll** com os 19 slots de equipamento ao redor do modelo 3D oficial (`render.worldofwarcraft.com`).
  - **Tooltip Oficial do Item em Português**: Ao passar o mouse ou clicar em qualquer equipamento, exibe o tooltip idêntico ao do jogo (Raridade, Item Level, Armadura/Dano, Atributos, Encantamentos, Efeitos, Durabilidade e Preço de Venda).
  - **Atributos & Estatísticas**: Vida, Mana/Recurso, Atributos Primários, Corpo a Corpo, Feitiços e Defesa.
  - **Talentos & Especialização**: Árvores de talentos com pontos gastos, ranks e descrições completas das habilidades.

## Rodando Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Hospedando na Vercel

1. Suba este repositório para o seu GitHub.
2. Importe o projeto na [Vercel](https://vercel.com/new).
3. Nas **Environment Variables** da Vercel, adicione:
   - `BLIZZARD_CLIENT_ID`
   - `BLIZZARD_CLIENT_SECRET`
   - `NEXT_PUBLIC_GUILD_NAME=Sepultura`
   - `NEXT_PUBLIC_GUILD_SLUG=sepultura`
   - `NEXT_PUBLIC_WOW_REGION=us`
   - `NEXT_PUBLIC_WOW_RULESET=normal`
   - `NEXT_PUBLIC_WOW_LOCALE=pt_BR`
4. Clique em **Deploy**!
