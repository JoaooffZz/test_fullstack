-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "contract_type" AS ENUM ('SERVICO', 'TRABALHO', 'OBRA', 'LOCACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('RASCUNHO', 'AGUARDANDO_ASSINATURA', 'ASSINADO', 'VENCENDO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "template_field_type" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SIGNATURE', 'ADDRESS');

-- CreateEnum
CREATE TYPE "signature_channel" AS ENUM ('EMAIL', 'WHATSAPP', 'AMBOS');

-- CreateEnum
CREATE TYPE "signature_status" AS ENUM ('ENVIADO', 'VISUALIZADO', 'ASSINADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "obra_status" AS ENUM ('PLANEJAMENTO', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "obra_phase" AS ENUM ('PLANEJAMENTO', 'EXECUCAO', 'ENTREGA');

-- CreateEnum
CREATE TYPE "obra_step_status" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "vistoria_type" AS ENUM ('INICIAL', 'FINAL');

-- CreateEnum
CREATE TYPE "cost_category" AS ENUM ('MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'SERVICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "purchase_order_status" AS ENUM ('RASCUNHO', 'EMITIDA', 'APROVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'SIGN', 'SEND');

-- CreateTable
CREATE TABLE "companies" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "users" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'EDITOR',
    "status" "user_status" NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "users_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "contract_type" NOT NULL,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "contract_template_fields" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "template_uuid" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "field_type" "template_field_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "contract_template_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "contracts" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "template_uuid" UUID,
    "created_by_uuid" UUID,
    "title" VARCHAR(255) NOT NULL,
    "type" "contract_type" NOT NULL,
    "status" "contract_status" NOT NULL DEFAULT 'RASCUNHO',
    "related_party" VARCHAR(255) NOT NULL,
    "related_party_email" VARCHAR(255) NOT NULL,
    "related_party_whatsapp" VARCHAR(20),
    "value" BIGINT,
    "start_date" DATE,
    "end_date" DATE,
    "body" TEXT NOT NULL,
    "field_values" JSONB,
    "close_reason" TEXT,
    "origin_contract_uuid" UUID,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "signature_requests" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contract_uuid" UUID NOT NULL,
    "channel" "signature_channel" NOT NULL,
    "status" "signature_status" NOT NULL DEFAULT 'ENVIADO',
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "signed_at" TIMESTAMPTZ,
    "signer_name" VARCHAR(255),
    "signer_ip" VARCHAR(45),

    CONSTRAINT "signature_requests_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "obras" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "contract_uuid" UUID,
    "created_by_uuid" UUID,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "status" "obra_status" NOT NULL DEFAULT 'PLANEJAMENTO',
    "start_date" DATE,
    "end_date" DATE,
    "budget_total" BIGINT,
    "responsible_cnpj" VARCHAR(14),

    CONSTRAINT "obras_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "obra_steps" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obra_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phase" "obra_phase" NOT NULL,
    "status" "obra_step_status" NOT NULL DEFAULT 'PENDENTE',
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "obra_steps_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "obra_vistorias" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obra_uuid" UUID NOT NULL,
    "created_by_uuid" UUID,
    "type" "vistoria_type" NOT NULL,
    "description" TEXT,

    CONSTRAINT "obra_vistorias_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "obra_custos" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obra_uuid" UUID NOT NULL,
    "created_by_uuid" UUID,
    "description" VARCHAR(255) NOT NULL,
    "category" "cost_category" NOT NULL,
    "value" BIGINT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "obra_custos_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "obra_uuid" UUID,
    "created_by_uuid" UUID,
    "number" VARCHAR(50) NOT NULL,
    "status" "purchase_order_status" NOT NULL DEFAULT 'RASCUNHO',
    "supplier_name" VARCHAR(255) NOT NULL,
    "supplier_cnpj" VARCHAR(14),
    "payer_cnpj" VARCHAR(14) NOT NULL,
    "delivery_date" DATE,
    "notes" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchase_order_uuid" UUID NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "total_price" BIGINT GENERATED ALWAYS AS (ROUND(quantity * unit_price)) STORED,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "uploads" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_uuid" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" BIGINT,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_uuid" UUID NOT NULL,
    "user_uuid" UUID,
    "action" "audit_action" NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_uuid" UUID,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "users_company_uuid_idx" ON "users"("company_uuid");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_uuid_email_key" ON "users"("company_uuid", "email");

-- CreateIndex
CREATE INDEX "contract_templates_company_uuid_idx" ON "contract_templates"("company_uuid");

-- CreateIndex
CREATE INDEX "contract_templates_type_idx" ON "contract_templates"("type");

-- CreateIndex
CREATE INDEX "contract_template_fields_template_uuid_idx" ON "contract_template_fields"("template_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "contract_template_fields_template_uuid_key_key" ON "contract_template_fields"("template_uuid", "key");

-- CreateIndex
CREATE INDEX "contracts_company_uuid_idx" ON "contracts"("company_uuid");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_type_idx" ON "contracts"("type");

-- CreateIndex
CREATE INDEX "contracts_end_date_idx" ON "contracts"("end_date");

-- CreateIndex
CREATE INDEX "contracts_related_party_idx" ON "contracts"("related_party");

-- CreateIndex
CREATE UNIQUE INDEX "signature_requests_token_key" ON "signature_requests"("token");

-- CreateIndex
CREATE INDEX "signature_requests_contract_uuid_idx" ON "signature_requests"("contract_uuid");

-- CreateIndex
CREATE INDEX "signature_requests_token_idx" ON "signature_requests"("token");

-- CreateIndex
CREATE INDEX "signature_requests_status_idx" ON "signature_requests"("status");

-- CreateIndex
CREATE INDEX "obras_company_uuid_idx" ON "obras"("company_uuid");

-- CreateIndex
CREATE INDEX "obras_status_idx" ON "obras"("status");

-- CreateIndex
CREATE INDEX "obras_contract_uuid_idx" ON "obras"("contract_uuid");

-- CreateIndex
CREATE INDEX "obra_steps_obra_uuid_idx" ON "obra_steps"("obra_uuid");

-- CreateIndex
CREATE INDEX "obra_steps_phase_idx" ON "obra_steps"("phase");

-- CreateIndex
CREATE INDEX "obra_vistorias_obra_uuid_idx" ON "obra_vistorias"("obra_uuid");

-- CreateIndex
CREATE INDEX "obra_vistorias_type_idx" ON "obra_vistorias"("type");

-- CreateIndex
CREATE INDEX "obra_custos_obra_uuid_idx" ON "obra_custos"("obra_uuid");

-- CreateIndex
CREATE INDEX "obra_custos_category_idx" ON "obra_custos"("category");

-- CreateIndex
CREATE INDEX "obra_custos_date_idx" ON "obra_custos"("date");

-- CreateIndex
CREATE INDEX "purchase_orders_company_uuid_idx" ON "purchase_orders"("company_uuid");

-- CreateIndex
CREATE INDEX "purchase_orders_obra_uuid_idx" ON "purchase_orders"("obra_uuid");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_company_uuid_number_key" ON "purchase_orders"("company_uuid", "number");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_uuid_idx" ON "purchase_order_items"("purchase_order_uuid");

-- CreateIndex
CREATE INDEX "uploads_entity_type_entity_uuid_idx" ON "uploads"("entity_type", "entity_uuid");

-- CreateIndex
CREATE INDEX "uploads_company_uuid_idx" ON "uploads"("company_uuid");

-- CreateIndex
CREATE INDEX "audit_logs_company_uuid_idx" ON "audit_logs"("company_uuid");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_uuid_idx" ON "audit_logs"("entity_type", "entity_uuid");

-- CreateIndex
CREATE INDEX "audit_logs_user_uuid_idx" ON "audit_logs"("user_uuid");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_fields" ADD CONSTRAINT "contract_template_fields_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "contract_templates"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_uuid_fkey" FOREIGN KEY ("template_uuid") REFERENCES "contract_templates"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_uuid_fkey" FOREIGN KEY ("created_by_uuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_origin_contract_uuid_fkey" FOREIGN KEY ("origin_contract_uuid") REFERENCES "contracts"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_contract_uuid_fkey" FOREIGN KEY ("contract_uuid") REFERENCES "contracts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_contract_uuid_fkey" FOREIGN KEY ("contract_uuid") REFERENCES "contracts"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_created_by_uuid_fkey" FOREIGN KEY ("created_by_uuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra_steps" ADD CONSTRAINT "obra_steps_obra_uuid_fkey" FOREIGN KEY ("obra_uuid") REFERENCES "obras"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra_vistorias" ADD CONSTRAINT "obra_vistorias_obra_uuid_fkey" FOREIGN KEY ("obra_uuid") REFERENCES "obras"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra_vistorias" ADD CONSTRAINT "obra_vistorias_created_by_uuid_fkey" FOREIGN KEY ("created_by_uuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra_custos" ADD CONSTRAINT "obra_custos_obra_uuid_fkey" FOREIGN KEY ("obra_uuid") REFERENCES "obras"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra_custos" ADD CONSTRAINT "obra_custos_created_by_uuid_fkey" FOREIGN KEY ("created_by_uuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_obra_uuid_fkey" FOREIGN KEY ("obra_uuid") REFERENCES "obras"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_uuid_fkey" FOREIGN KEY ("created_by_uuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_uuid_fkey" FOREIGN KEY ("purchase_order_uuid") REFERENCES "purchase_orders"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================
-- TRIGGERS — updated_at automático
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contract_templates_updated_at
    BEFORE UPDATE ON contract_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_signature_requests_updated_at
    BEFORE UPDATE ON signature_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_obras_updated_at
    BEFORE UPDATE ON obras
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_obra_steps_updated_at
    BEFORE UPDATE ON obra_steps
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- TRIGGER — auto-incremento de número da O.C. por empresa
-- =============================================================

CREATE SEQUENCE IF NOT EXISTS purchase_order_seq;

CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num  INTEGER;
    year_str  VARCHAR(4);
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM purchase_orders
    WHERE company_uuid = NEW.company_uuid
      AND number LIKE 'OC-' || year_str || '-%';

    NEW.number := 'OC-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_orders_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    WHEN (NEW.number IS NULL OR NEW.number = '')
    EXECUTE FUNCTION generate_purchase_order_number();

-- =============================================================
-- TRIGGER — atualiza status do contrato para ASSINADO
--           ao registrar assinatura bem-sucedida
-- =============================================================

CREATE OR REPLACE FUNCTION sync_contract_signed_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ASSINADO' AND OLD.status <> 'ASSINADO' THEN
        UPDATE contracts
        SET status = 'ASSINADO', updated_at = NOW()
        WHERE uuid = NEW.contract_uuid
          AND status = 'AGUARDANDO_ASSINATURA';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_contract_signed
    AFTER UPDATE ON signature_requests
    FOR EACH ROW EXECUTE FUNCTION sync_contract_signed_status();

-- =============================================================
-- TRIGGER — marca contratos como VENCENDO (vence em ≤ 30 dias)
--           executado a cada UPDATE no próprio contrato
-- =============================================================

CREATE OR REPLACE FUNCTION sync_contract_expiring_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ASSINADO'
       AND NEW.end_date IS NOT NULL
       AND NEW.end_date <= (CURRENT_DATE + INTERVAL '30 days')
       AND NEW.end_date >= CURRENT_DATE
    THEN
        NEW.status := 'VENCENDO';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_contract_expiring
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION sync_contract_expiring_status();
