# Gerenciamento de Projetos Complementares — Gazin

Sistema web para acompanhar os projetos complementares das unidades Gazin (lojas, CDs, escritórios), nas disciplinas:

- **Elétrico**: cargas, unifilar, iluminação, tomadas, SPDA, lógica, aprovação na concessionária
- **Climatização**: carga térmica, equipamentos, rede frigorígena, drenos, renovação de ar, PMOC
- **Prevenção contra incêndio**: rotas de fuga, sinalização, iluminação de emergência, extintores, hidrantes, alarme, PPCI/PSCIP, AVCB/CLCB

Feito em HTML, CSS e JavaScript puro, sem build e sem dependências (só a fonte Inter do Google Fonts).

## Funcionalidades

| Aba | O que faz |
|---|---|
| **Painel** | Indicadores (projetos ativos, disciplinas em andamento, atrasadas, vencendo em 7 dias, valor em carteira), progresso por disciplina, próximos prazos e distribuição por etapa |
| **Projetos** | Tabela de todas as obras, com a etapa e o prazo de cada disciplina; busca e filtros por status, disciplina, UF e atraso |
| **Quadro** | Kanban por etapa (um cartão por projeto × disciplina); arraste os cartões para mudar a etapa |
| **Prazos** | Agenda agrupada em: atrasados, esta semana, próximos 30 dias, mais adiante, sem prazo |
| **Dados** | Backup/restauração (.json), exportação para planilha (.csv para Excel), lista de responsáveis e dados de exemplo |

Cada projeto tem:

- dados da obra: código, unidade, cidade/UF, tipo, área, contato Gazin, datas e status (Ativo, Pausado, Concluído, Cancelado);
- para cada disciplina: se faz parte do escopo, etapa, responsável, início, prazo, nº da revisão, valor/honorário, notas e **checklist de entregáveis**;
- **histórico** automático (mudanças de etapa e status) mais registros manuais (reuniões, pendências, revisões).

### Etapas

1. Aguardando informações
2. Levantamento
3. Estudo preliminar
4. Projeto executivo
5. Revisão Gazin
6. Aprovação externa (concessionária / Corpo de Bombeiros)
7. Concluído

Etapas, tipos de obra e entregáveis são configurados no topo de `app.js` (`DISCIPLINAS`, `ETAPAS`, `TIPOS`).

## Onde ficam os dados

Os dados ficam salvos no **navegador** (localStorage) do computador onde o sistema é usado. Ou seja:

- outro computador ou navegador não vê os mesmos dados; use **Dados → Exportar backup** e **Importar backup** para levar de um para outro;
- limpar os dados do navegador apaga os projetos, então exporte backups com frequência.

No primeiro acesso o sistema carrega alguns projetos de exemplo; apague-os em **Dados → Apagar todos os dados**.

## Estrutura

```
├── index.html   # estrutura das telas
├── styles.css   # visual
├── app.js       # lógica, configuração das disciplinas e persistência
└── README.md
```

## Publicar no GitHub Pages

1. No repositório, acesse **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**, a branch desejada e a pasta `/ (root)`.
3. Salve. O sistema ficará em `https://<usuario>.github.io/gerencimaneot-de-projetos-gazin/`.

Para usar localmente, basta abrir o `index.html` no navegador.
