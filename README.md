# Projeto SESA - Gestão Farmacêutica (SysFarma)

Este projeto é um sistema completo de Gestão de Estoque Farmacêutico (SESA/SysFarma), desenvolvido para gerenciar o fluxo de medicamentos entre a Central de Abastecimento Farmacêutico (CAF) e as Unidades Básicas de Saúde (UBS/Hospitais).

## 🚀 Status do Projeto
- [x] Backend Core (Node.js/Prisma)
- [x] Frontend Dashboard (Next.js)
- [x] Fluxo de Quarentena e Vencidos
- [x] Auditoria de Descartes
- [x] Exportação de Relatórios PDF
- [x] Gestão Multi-Tenant (CAF vs Unidades)

## 📋 Funcionalidades Principais
- **Dashboard Gerencial:** Visão em tempo real do volume de estoque, itens em baixa e remessas recentes.
- **Controle de Estoque Central (CAF):** Gestão de lotes, datas de validade e fornecedores.
- **Quarentena Inteligente:** Isolamento automático de lotes vencidos com fluxo de descarte administrativo.
- **Logística e Remessas:** Processamento de solicitações de unidades e despacho de remessas com rastreabilidade.
- **Auditoria Completa:** Log imutável de todas as movimentações de entrada, saída e perda por vencimento.
- **Exportação:** Geração de relatórios de estoque em PDF com filtros dinâmicos.

## 🛠 Tecnologias Utilizadas

### Backend
- **Node.js** com **Express**
- **Prisma ORM** (PostgreSQL/SQLite)
- **TypeScript**
- **JWT** para Autenticação
- **BcryptJS** para Segurança de Senhas

### Frontend
- **Next.js 14+** (App Router)
- **Tailwind CSS** (Interfacre Premium/Modern)
- **Lucide React** (Iconografia)
- **Axios** (Integração de API)
- **jsPDF** (Motor de Relatórios)

## 📂 Estrutura do Repositório
O projeto está dividido em dois módulos principais:
- `/backend`: Servidor de API, lógica de negócio e banco de dados.
- `/frontend_sesa`: Interface do usuário, dashboards e componentes.

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- Node.js instalado
- Gerenciador de pacotes (npm ou yarn)

### Passo 1: Configurar o Backend
```bash
cd backend
npm install
# Configure o arquivo .env com a DATABASE_URL
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Passo 2: Configurar o Frontend
```bash
cd frontend_sesa
npm install
npm run dev
```

## 🔒 Segurança e Dados
O sistema utiliza um modelo de permissões baseado em papéis (RBAC):
- **ADMIN/TI:** Gestão de infraestrutura e usuários.
- **CAF:** Controle de estoque mestre e logística.
- **UNIDADE:** Solicitação de medicamentos e gestão local.

---
Desenvolvido para **SESA - Registro de Estoque**.
