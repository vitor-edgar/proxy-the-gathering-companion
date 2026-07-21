# Requisitos do Sistema: PTG Balance Tracker (Minimal POC)

Este documento descreve os requisitos simplificados para a criação de uma Prova de Conceito (POC) de um Web App PWA focado exclusivamente no controle financeiro do sistema **Proxy The Gathering Collection**.

## 1. Objetivo
Criar uma ferramenta minimalista e rápida para que o usuário possa registrar créditos (ganhos) e despesas (gastos), visualizando seu saldo atual de forma imediata, sem a necessidade de gerenciar inventários, produtos específicos ou históricos detalhados.

---

## 2. Requisitos Funcionais (RF)

### RF01 – Gestão de Saldo
*   O sistema deve exibir o saldo atual (em R$) de forma centralizada e destacada.
*   O saldo deve ser atualizado automaticamente após cada operação de crédito ou débito.

### RF02 – Registro de Créditos (Ganhos)
*   **Entrada Manual:** O sistema deve oferecer um campo para inserção manual de valor.
*   **Atalhos Rápidos:** Exibir botões de ação rápida baseados em tarefas (Muito Simples R$2, Simples R$5, Importante R$15, Prioritário R$20, Grandes Conquistas R$50).
*   **Nome da Atividade:** Sempre que um crédito for inserido, o sistema deve solicitar o nome da atividade realizada.

### RF03 – Registro de Despesas (Gastos)
*   **Entrada Manual:** O sistema deve oferecer um campo para inserção manual de valor.
*   **Atalhos de Produtos (Art. 6º):** Exibir botões de ação rápida para deduzir valores fixos, informando também a quantidade de cartas que o produto rende.

### RF04 – Histórico de Transações (NOVO)
*   O sistema deve possuir uma aba dedicada para exibir todas as operações (créditos e débitos) realizadas, com data, nome e valor.
*   **Exclusão de Operações:** O usuário deve ser capaz de excluir uma transação do histórico, o que deve reverter automaticamente o impacto no saldo total.

### RF05 – Navegação
*   Interface com abas para alternar entre "Saldo", "Histórico", "Regras MTG" e "Montar Deck".

### RF06 – Conteúdo Informativo
*   O sistema deve exibir as Regras Abrangentes de Magic: The Gathering em uma aba dedicada com busca.
*   O sistema deve exibir um Guia de montagem de decks Commander em uma aba dedicada.
*   O conteúdo informativo deve ser estilizado para leitura confortável no navegador.

---

## 3. Requisitos Não Funcionais (RNF)

### RNF01 – Natureza PWA (Progressive Web App)
*   O app deve ser instalável em dispositivos móveis e funcionar Offline (armazenamento local).
*   Deve possuir `manifest.json` e Service Worker básico.

### RNF02 – Armazenamento de Dados
*   O saldo e o histórico de transações devem ser persistidos no **LocalStorage** do navegador.

### RNF03 – Interface (UI/UX)
*   Interface "Clean" e minimalista.
*   **Grid de Ações:** Organizar os botões de atalho em um grid de fácil acesso (ex: cores diferentes para Crédito e Débito).
*   Design responsivo (Mobile First).

---

## 4. Regras de Negócio (RN)
*   **RN01:** O saldo deve ser impedido de ficar negativo, ou o sistema deve exibir um aviso visual crítico caso isso ocorra.
*   **RN02:** Simplicidade total: sem telas de login e sem bancos de dados externos.
*   **RN03:** O histórico deve listar apenas as últimas 10 operações. Transações excedentes são consolidadas no saldo e removidas da listagem, não podendo ser desfeitas.
