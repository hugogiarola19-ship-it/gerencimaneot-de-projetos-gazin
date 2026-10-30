# Gerenciamento de Projetos Complementares — Gazin

Sistema web para acompanhar os projetos complementares das unidades Gazin, seguindo o fluxo de trabalho:

**Geral**: o projeto começa quando o layout é recebido, com as informações importantes: área total, área de venda e cidade/UF.

1. **Climatização**
   - quantidade de ar calculada **automaticamente**: área de venda ÷ (57000/700), com duas casas decimais (sugere o nº de equipamentos arredondando para cima, que pode ser alterado);
   - distribuição dos equipamentos (avanço, painel de TVs) → cotar centro e ponto de dreno → gerar PDF → enviar no grupo e no Drive.
2. **Prevenção**
   - tipo de projeto definido **automaticamente** pela área total e pelo estado, para a ocupação C-1 do Corpo de Bombeiros: acima do limite da UF é *completo (com hidrante)*, até o limite é *simplificado*. Os limites por estado ficam em **Dados** (estados da Gazin: AC, AM, PA, RO, MT, GO, TO, MS, MG e RS; padrão 750 m², ajuste conforme a norma do Corpo de Bombeiros de cada estado). Também é possível definir manualmente em cada projeto;
   - placas de sinalização → iluminação de emergência → extintores → (hidrantes, se completo) → gerar PDF → enviar no grupo e no Drive.
3. **Elétrico**
   - quadro de circuitos gerado **automaticamente** a partir da tabela padrão, com o número de circuitos de ar igual ao de equipamentos da climatização (pode ser alterado). A tabela pode ser copiada para o Excel/AutoCAD ou baixada em .csv, e o padrão é editável em **Dados**;
   - distribuição de lâmpadas, tomadas e pontos de ar → detalhes (caixa, legendas de condutos, fios e peças, quadro de cargas, quadro de demanda, diagrama unifilar) → cotar os pontos → gerar PDF → enviar no grupo e no Drive.

Feito em HTML, CSS e JavaScript puro, sem build e sem dependências (só a fonte Inter do Google Fonts).

## Funcionalidades

| Aba | O que faz |
|---|---|
| **Painel** | Projetos ativos, aguardando layout, disciplinas em aberto, atrasadas, vencendo em 7 dias e entregues nos últimos 30 dias; progresso por disciplina; próximos prazos |
| **Projetos** | Tabela de todas as lojas com etapa, passos concluídos e prazo de cada disciplina; busca e filtros por status, disciplina, UF e atraso |
| **Quadro** | Kanban por etapa (um cartão por projeto × disciplina); arraste os cartões para mudar a etapa |
| **Prazos** | Agenda agrupada em: atrasados, esta semana, próximos 30 dias, mais adiante, sem prazo |
| **Dados** | Backup (.json), planilha (.csv), limites de área por estado, tabela de circuitos padrão, lista de responsáveis |

Cada projeto tem os dados do layout, o link da pasta no Drive, e para cada disciplina: etapa, responsável, prazo, nº da revisão, valor, notas e o **passo a passo** com checkbox. Há também um **histórico** automático (layout recebido, mudanças de etapa, envio do PDF) e registros manuais.

### Etapas (avançam sozinhas conforme o passo a passo)

1. **Aguardando layout**: enquanto não há data de recebimento do layout
2. **A fazer**: layout recebido
3. **Em andamento**: ao marcar o primeiro passo
4. **Revisão / ajustes**: manual, quando a Gazin pede alterações (ao arrastar no quadro, soma uma revisão)
5. **Entregue**: ao marcar todos os passos (registra a data de entrega)

Passos, etapas e fórmulas ficam no topo de `app.js`.

## Onde ficam os dados

Os dados ficam salvos no **navegador** (localStorage) do computador onde o sistema é usado. Ou seja:

- outro computador ou navegador não vê os mesmos dados; use **Dados → Exportar backup** e **Importar backup** para levar de um para outro;
- limpar os dados do navegador apaga os projetos, então exporte backups com frequência.

No primeiro acesso o sistema carrega alguns projetos de exemplo; apague-os em **Dados → Apagar todos os projetos** (as configurações são mantidas).

## Estrutura

```
├── index.html   # estrutura das telas
├── styles.css   # visual
├── app.js       # lógica, fluxo de cada disciplina, cálculos e persistência
└── README.md
```

## Publicar no GitHub Pages

1. No repositório, acesse **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**, a branch desejada e a pasta `/ (root)`.
3. Salve. O sistema ficará em `https://<usuario>.github.io/gerencimaneot-de-projetos-gazin/`.

Para usar localmente, basta abrir o `index.html` no navegador.
