-- CreateEnum
CREATE TYPE "TipoUnidade" AS ENUM ('CAF', 'UBS', 'UPA', 'HOSPITAL');

-- CreateEnum
CREATE TYPE "StatusCompra" AS ENUM ('PENDENTE', 'RECEBIDA_PARCIALMENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('AGUARDANDO_ANALISE', 'APROVADA', 'ATENDIDA_PARCIAL', 'ATENDIDA_INTEGRAL', 'RECUSADA');

-- CreateEnum
CREATE TYPE "TipoMovEstoque" AS ENUM ('ENTRADA_COMPRA', 'ENTRADA_REMESSA', 'SAIDA_REMESSA', 'SAIDA_DISPENSACAO', 'PERDA_VENCIMENTO', 'AJUSTE_INVENTARIO');

-- CreateTable
CREATE TABLE "unidades" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cnes" VARCHAR(7),
    "tipo" "TipoUnidade" NOT NULL,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "id_unidade" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "papel" VARCHAR(50) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" UUID NOT NULL,
    "razao_social" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos" (
    "id" UUID NOT NULL,
    "codigo_br" VARCHAR(20),
    "principio_ativo" VARCHAR(255) NOT NULL,
    "apresentacao" VARCHAR(150),
    "estoque_minimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" UUID NOT NULL,
    "id_medicamento" UUID NOT NULL,
    "id_fornecedor" UUID NOT NULL,
    "codigo_lote" VARCHAR(50) NOT NULL,
    "data_fabricacao" DATE NOT NULL,
    "data_validade" DATE NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque" (
    "id" UUID NOT NULL,
    "id_unidade" UUID NOT NULL,
    "id_lote" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" UUID NOT NULL,
    "id_fornecedor" UUID NOT NULL,
    "id_usuario_criador" UUID NOT NULL,
    "numero_empenho" VARCHAR(50),
    "valor_total" DECIMAL(12,2) NOT NULL,
    "status" "StatusCompra" NOT NULL DEFAULT 'PENDENTE',
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_compra" (
    "id" UUID NOT NULL,
    "id_compra" UUID NOT NULL,
    "id_medicamento" UUID NOT NULL,
    "quantidade_solicitada" INTEGER NOT NULL,
    "quantidade_recebida" INTEGER NOT NULL DEFAULT 0,
    "valor_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" UUID NOT NULL,
    "id_unidade_solicitante" UUID NOT NULL,
    "id_usuario_solicitante" UUID NOT NULL,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'AGUARDANDO_ANALISE',
    "data_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_solicitacao" (
    "id" UUID NOT NULL,
    "id_solicitacao" UUID NOT NULL,
    "id_medicamento" UUID NOT NULL,
    "quantidade_solicitada" INTEGER NOT NULL,
    "quantidade_aprovada" INTEGER DEFAULT 0,

    CONSTRAINT "itens_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remessas" (
    "id" UUID NOT NULL,
    "id_solicitacao" UUID,
    "id_unidade_origem" UUID NOT NULL,
    "id_unidade_destino" UUID NOT NULL,
    "id_usuario_envio" UUID NOT NULL,
    "data_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_recebimento" TIMESTAMP(3),

    CONSTRAINT "remessas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_remessa" (
    "id" UUID NOT NULL,
    "id_remessa" UUID NOT NULL,
    "id_lote" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "itens_remessa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "id_unidade" UUID NOT NULL,
    "id_lote" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "tipo" "TipoMovEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "referencia_id" UUID,
    "observacao" TEXT,
    "data_movimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidades_cnes_key" ON "unidades"("cnes");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "medicamentos_codigo_br_key" ON "medicamentos"("codigo_br");

-- CreateIndex
CREATE INDEX "lotes_data_validade_idx" ON "lotes"("data_validade");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_codigo_lote_id_medicamento_id_fornecedor_key" ON "lotes"("codigo_lote", "id_medicamento", "id_fornecedor");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_id_unidade_id_lote_key" ON "estoque"("id_unidade", "id_lote");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_id_unidade_data_movimentacao_idx" ON "movimentacoes_estoque"("id_unidade", "data_movimentacao");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_id_medicamento_fkey" FOREIGN KEY ("id_medicamento") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_id_fornecedor_fkey" FOREIGN KEY ("id_fornecedor") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_id_fornecedor_fkey" FOREIGN KEY ("id_fornecedor") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_id_usuario_criador_fkey" FOREIGN KEY ("id_usuario_criador") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_compra" ADD CONSTRAINT "itens_compra_id_compra_fkey" FOREIGN KEY ("id_compra") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_compra" ADD CONSTRAINT "itens_compra_id_medicamento_fkey" FOREIGN KEY ("id_medicamento") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_id_unidade_solicitante_fkey" FOREIGN KEY ("id_unidade_solicitante") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_id_usuario_solicitante_fkey" FOREIGN KEY ("id_usuario_solicitante") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_solicitacao" ADD CONSTRAINT "itens_solicitacao_id_solicitacao_fkey" FOREIGN KEY ("id_solicitacao") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_solicitacao" ADD CONSTRAINT "itens_solicitacao_id_medicamento_fkey" FOREIGN KEY ("id_medicamento") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_id_solicitacao_fkey" FOREIGN KEY ("id_solicitacao") REFERENCES "solicitacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_id_unidade_origem_fkey" FOREIGN KEY ("id_unidade_origem") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_id_unidade_destino_fkey" FOREIGN KEY ("id_unidade_destino") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remessas" ADD CONSTRAINT "remessas_id_usuario_envio_fkey" FOREIGN KEY ("id_usuario_envio") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_remessa" ADD CONSTRAINT "itens_remessa_id_remessa_fkey" FOREIGN KEY ("id_remessa") REFERENCES "remessas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_remessa" ADD CONSTRAINT "itens_remessa_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_id_unidade_fkey" FOREIGN KEY ("id_unidade") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
