-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MAINTENANCE', 'INCIDENT');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatusEnum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "subscription_start_date" TIMESTAMP(3),
    "subscription_end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "password" TEXT,
    "role_id" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "activation_token" TEXT,
    "activation_expires" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_expires" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "image" TEXT,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "branch_id" TEXT,
    "invitationToken" TEXT,
    "invitationExpires" TIMESTAMP(3),
    "firstLogin" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "asset_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "color" TEXT DEFAULT '#64748b',
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "type_id" TEXT,
    "room_id" TEXT,
    "purchase_date" TIMESTAMP(3),
    "warranty_end" TIMESTAMP(3),
    "status_id" TEXT,
    "notes" TEXT,
    "qr_code" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "building_id" TEXT NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_priorities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "color" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "color" VARCHAR(7),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority_id" TEXT,
    "status_id" TEXT,
    "asset_id" TEXT,
    "assigned_to_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MAINTENANCE',
    "deleted_at" TIMESTAMP(3),
    "room_id" TEXT,
    "building_id" TEXT NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_items" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity_used" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_quantity" INTEGER NOT NULL DEFAULT 5,
    "unit_price" DOUBLE PRECISION,
    "room_id" TEXT,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "notes" TEXT,
    "building_id" TEXT,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type_id" TEXT,
    "reason" TEXT,
    "work_order_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movement_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_frequencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "interval_months" INTEGER,

    CONSTRAINT "maintenance_frequencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_groups" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "frequency_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "next_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "company_id" TEXT NOT NULL,
    "notes" TEXT,
    "building_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_assets" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_tasks" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "work_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "color" VARCHAR(7),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_reports" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "asset_id" TEXT,
    "reporter_name" TEXT NOT NULL,
    "reporter_email" TEXT NOT NULL,
    "phone" TEXT,
    "type" "ReportType" NOT NULL DEFAULT 'MAINTENANCE',
    "status" "ReportStatusEnum" NOT NULL DEFAULT 'PENDING',
    "work_order_id" TEXT,
    "rejection_reason" TEXT,
    "severity" "IncidentSeverity",
    "reported_to" TEXT,
    "investigation_notes" TEXT,
    "investigated_by_id" TEXT,
    "converted_to_work_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "room_id" TEXT,
    "company_id" TEXT,
    "building_id" TEXT NOT NULL,

    CONSTRAINT "maintenance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_images" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "company_id" TEXT,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "building_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "floor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "building_id" TEXT NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "color" VARCHAR(7),
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "supplier" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "type" TEXT,
    "file_url" TEXT,
    "notes" TEXT,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "building_id" TEXT,
    "cancellation_reason" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "license_expiry" TIMESTAMP(3),
    "insurance_expiry" TIMESTAMP(3),
    "last_oil_change" TIMESTAMP(3),
    "asset_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "building_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_drivers" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vehicle_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oil_change_requests" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "mileage" INTEGER,
    "invoice_url" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "rejection_reason" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "oil_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accident_requests" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "accident_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "rejection_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "mileage" INTEGER,

    CONSTRAINT "accident_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_buildings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,

    CONSTRAINT "user_buildings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_activation_token_key" ON "users"("activation_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_invitationToken_key" ON "users"("invitationToken");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_company_id_branch_id_idx" ON "users"("company_id", "branch_id");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_company_id_idx" ON "roles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "asset_statuses_company_id_idx" ON "asset_statuses"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_statuses_name_company_id_key" ON "asset_statuses"("name", "company_id");

-- CreateIndex
CREATE INDEX "asset_types_company_id_idx" ON "asset_types"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_name_company_id_key" ON "asset_types"("name", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_qr_code_key" ON "assets"("qr_code");

-- CreateIndex
CREATE INDEX "assets_company_id_idx" ON "assets"("company_id");

-- CreateIndex
CREATE INDEX "assets_type_id_idx" ON "assets"("type_id");

-- CreateIndex
CREATE INDEX "assets_status_id_idx" ON "assets"("status_id");

-- CreateIndex
CREATE INDEX "assets_room_id_idx" ON "assets"("room_id");

-- CreateIndex
CREATE INDEX "assets_building_id_idx" ON "assets"("building_id");

-- CreateIndex
CREATE INDEX "assets_deleted_at_idx" ON "assets"("deleted_at");

-- CreateIndex
CREATE INDEX "assets_company_id_building_id_deleted_at_idx" ON "assets"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "assets_type_id_status_id_idx" ON "assets"("type_id", "status_id");

-- CreateIndex
CREATE INDEX "assets_room_id_building_id_idx" ON "assets"("room_id", "building_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_company_id_code_key" ON "assets"("company_id", "code");

-- CreateIndex
CREATE INDEX "work_order_priorities_company_id_idx" ON "work_order_priorities"("company_id");

-- CreateIndex
CREATE INDEX "work_order_statuses_company_id_idx" ON "work_order_statuses"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_code_key" ON "work_orders"("code");

-- CreateIndex
CREATE INDEX "work_orders_company_id_idx" ON "work_orders"("company_id");

-- CreateIndex
CREATE INDEX "work_orders_status_id_idx" ON "work_orders"("status_id");

-- CreateIndex
CREATE INDEX "work_orders_priority_id_idx" ON "work_orders"("priority_id");

-- CreateIndex
CREATE INDEX "work_orders_asset_id_idx" ON "work_orders"("asset_id");

-- CreateIndex
CREATE INDEX "work_orders_assigned_to_id_idx" ON "work_orders"("assigned_to_id");

-- CreateIndex
CREATE INDEX "work_orders_created_at_idx" ON "work_orders"("created_at");

-- CreateIndex
CREATE INDEX "work_orders_deleted_at_idx" ON "work_orders"("deleted_at");

-- CreateIndex
CREATE INDEX "work_orders_room_id_idx" ON "work_orders"("room_id");

-- CreateIndex
CREATE INDEX "work_orders_building_id_idx" ON "work_orders"("building_id");

-- CreateIndex
CREATE INDEX "work_orders_company_id_building_id_deleted_at_idx" ON "work_orders"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "work_orders_status_id_priority_id_scheduled_at_idx" ON "work_orders"("status_id", "priority_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "work_orders_assigned_to_id_status_id_idx" ON "work_orders"("assigned_to_id", "status_id");

-- CreateIndex
CREATE INDEX "work_orders_company_id_status_id_assigned_to_id_idx" ON "work_orders"("company_id", "status_id", "assigned_to_id");

-- CreateIndex
CREATE INDEX "work_order_items_work_order_id_idx" ON "work_order_items"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_items_inventory_item_id_idx" ON "work_order_items"("inventory_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_company_id_idx" ON "inventory_items"("company_id");

-- CreateIndex
CREATE INDEX "inventory_items_room_id_idx" ON "inventory_items"("room_id");

-- CreateIndex
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_items_company_id_building_id_deleted_at_idx" ON "inventory_items"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "inventory_items_room_id_quantity_idx" ON "inventory_items"("room_id", "quantity");

-- CreateIndex
CREATE INDEX "stock_movements_inventory_item_id_idx" ON "stock_movements"("inventory_item_id");

-- CreateIndex
CREATE INDEX "stock_movements_type_id_idx" ON "stock_movements"("type_id");

-- CreateIndex
CREATE INDEX "stock_movements_work_order_id_idx" ON "stock_movements"("work_order_id");

-- CreateIndex
CREATE INDEX "stock_movements_user_id_idx" ON "stock_movements"("user_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "stock_movements_deleted_at_idx" ON "stock_movements"("deleted_at");

-- CreateIndex
CREATE INDEX "movement_types_company_id_idx" ON "movement_types"("company_id");

-- CreateIndex
CREATE INDEX "maintenance_frequencies_company_id_idx" ON "maintenance_frequencies"("company_id");

-- CreateIndex
CREATE INDEX "maintenance_groups_building_id_idx" ON "maintenance_groups"("building_id");

-- CreateIndex
CREATE INDEX "maintenance_groups_company_id_building_id_idx" ON "maintenance_groups"("company_id", "building_id");

-- CreateIndex
CREATE INDEX "maintenance_groups_next_date_idx" ON "maintenance_groups"("next_date");

-- CreateIndex
CREATE INDEX "maintenance_groups_deleted_at_idx" ON "maintenance_groups"("deleted_at");

-- CreateIndex
CREATE INDEX "maintenance_groups_company_id_building_id_deleted_at_idx" ON "maintenance_groups"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "maintenance_assets_group_id_idx" ON "maintenance_assets"("group_id");

-- CreateIndex
CREATE INDEX "maintenance_assets_asset_id_idx" ON "maintenance_assets"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_assets_group_id_asset_id_key" ON "maintenance_assets"("group_id", "asset_id");

-- CreateIndex
CREATE INDEX "maintenance_tasks_group_id_idx" ON "maintenance_tasks"("group_id");

-- CreateIndex
CREATE INDEX "maintenance_tasks_scheduled_date_idx" ON "maintenance_tasks"("scheduled_date");

-- CreateIndex
CREATE INDEX "maintenance_tasks_deleted_at_idx" ON "maintenance_tasks"("deleted_at");

-- CreateIndex
CREATE INDEX "report_statuses_company_id_idx" ON "report_statuses"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_reports_code_key" ON "maintenance_reports"("code");

-- CreateIndex
CREATE INDEX "maintenance_reports_company_id_idx" ON "maintenance_reports"("company_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_asset_id_idx" ON "maintenance_reports"("asset_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_status_idx" ON "maintenance_reports"("status");

-- CreateIndex
CREATE INDEX "maintenance_reports_work_order_id_idx" ON "maintenance_reports"("work_order_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_created_at_idx" ON "maintenance_reports"("created_at");

-- CreateIndex
CREATE INDEX "maintenance_reports_deleted_at_idx" ON "maintenance_reports"("deleted_at");

-- CreateIndex
CREATE INDEX "maintenance_reports_room_id_idx" ON "maintenance_reports"("room_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_building_id_idx" ON "maintenance_reports"("building_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_company_id_building_id_deleted_at_idx" ON "maintenance_reports"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "maintenance_reports_company_id_status_created_at_idx" ON "maintenance_reports"("company_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "maintenance_reports_asset_id_created_at_idx" ON "maintenance_reports"("asset_id", "created_at");

-- CreateIndex
CREATE INDEX "maintenance_reports_room_id_created_at_idx" ON "maintenance_reports"("room_id", "created_at");

-- CreateIndex
CREATE INDEX "report_images_report_id_idx" ON "report_images"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "buildings_code_key" ON "buildings"("code");

-- CreateIndex
CREATE INDEX "buildings_company_id_idx" ON "buildings"("company_id");

-- CreateIndex
CREATE INDEX "buildings_deleted_at_idx" ON "buildings"("deleted_at");

-- CreateIndex
CREATE INDEX "floors_building_id_idx" ON "floors"("building_id");

-- CreateIndex
CREATE INDEX "floors_deleted_at_idx" ON "floors"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "floors_building_id_code_key" ON "floors"("building_id", "code");

-- CreateIndex
CREATE INDEX "rooms_floor_id_idx" ON "rooms"("floor_id");

-- CreateIndex
CREATE INDEX "rooms_building_id_idx" ON "rooms"("building_id");

-- CreateIndex
CREATE INDEX "rooms_deleted_at_idx" ON "rooms"("deleted_at");

-- CreateIndex
CREATE INDEX "rooms_building_id_floor_id_deleted_at_idx" ON "rooms"("building_id", "floor_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_floor_id_code_key" ON "rooms"("floor_id", "code");

-- CreateIndex
CREATE INDEX "contract_types_company_id_idx" ON "contract_types"("company_id");

-- CreateIndex
CREATE INDEX "vendors_company_id_idx" ON "vendors"("company_id");

-- CreateIndex
CREATE INDEX "vendors_deleted_at_idx" ON "vendors"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts"("code");

-- CreateIndex
CREATE INDEX "contracts_company_id_idx" ON "contracts"("company_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_start_date_idx" ON "contracts"("start_date");

-- CreateIndex
CREATE INDEX "contracts_end_date_idx" ON "contracts"("end_date");

-- CreateIndex
CREATE INDEX "contracts_deleted_at_idx" ON "contracts"("deleted_at");

-- CreateIndex
CREATE INDEX "contracts_building_id_idx" ON "contracts"("building_id");

-- CreateIndex
CREATE INDEX "contracts_company_id_building_id_deleted_at_idx" ON "contracts"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "contracts_status_start_date_end_date_idx" ON "contracts"("status", "start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_id_number_key" ON "drivers"("id_number");

-- CreateIndex
CREATE INDEX "drivers_company_id_idx" ON "drivers"("company_id");

-- CreateIndex
CREATE INDEX "drivers_deleted_at_idx" ON "drivers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_code_key" ON "vehicles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_asset_id_key" ON "vehicles"("asset_id");

-- CreateIndex
CREATE INDEX "vehicles_asset_id_idx" ON "vehicles"("asset_id");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE INDEX "vehicles_deleted_at_idx" ON "vehicles"("deleted_at");

-- CreateIndex
CREATE INDEX "vehicles_company_id_building_id_deleted_at_idx" ON "vehicles"("company_id", "building_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vehicles_code_idx" ON "vehicles"("code");

-- CreateIndex
CREATE INDEX "vehicle_drivers_vehicle_id_idx" ON "vehicle_drivers"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_drivers_driver_id_idx" ON "vehicle_drivers"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_drivers_vehicle_id_driver_id_key" ON "vehicle_drivers"("vehicle_id", "driver_id");

-- CreateIndex
CREATE INDEX "oil_change_requests_vehicle_id_idx" ON "oil_change_requests"("vehicle_id");

-- CreateIndex
CREATE INDEX "oil_change_requests_driver_id_idx" ON "oil_change_requests"("driver_id");

-- CreateIndex
CREATE INDEX "oil_change_requests_status_idx" ON "oil_change_requests"("status");

-- CreateIndex
CREATE INDEX "oil_change_requests_deleted_at_idx" ON "oil_change_requests"("deleted_at");

-- CreateIndex
CREATE INDEX "oil_change_requests_vehicle_id_status_idx" ON "oil_change_requests"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "oil_change_requests_status_requested_at_idx" ON "oil_change_requests"("status", "requested_at");

-- CreateIndex
CREATE INDEX "accident_requests_vehicle_id_idx" ON "accident_requests"("vehicle_id");

-- CreateIndex
CREATE INDEX "accident_requests_driver_id_idx" ON "accident_requests"("driver_id");

-- CreateIndex
CREATE INDEX "accident_requests_status_idx" ON "accident_requests"("status");

-- CreateIndex
CREATE INDEX "accident_requests_deleted_at_idx" ON "accident_requests"("deleted_at");

-- CreateIndex
CREATE INDEX "accident_requests_vehicle_id_status_idx" ON "accident_requests"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "accident_requests_status_requested_at_idx" ON "accident_requests"("status", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_buildings_user_id_building_id_key" ON "user_buildings"("user_id", "building_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_statuses" ADD CONSTRAINT "asset_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_types" ADD CONSTRAINT "asset_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "asset_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_priorities" ADD CONSTRAINT "work_order_priorities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_statuses" ADD CONSTRAINT "work_order_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "work_order_priorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "work_order_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_items" ADD CONSTRAINT "work_order_items_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "movement_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_types" ADD CONSTRAINT "movement_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_frequencies" ADD CONSTRAINT "maintenance_frequencies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_groups" ADD CONSTRAINT "maintenance_groups_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_groups" ADD CONSTRAINT "maintenance_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_groups" ADD CONSTRAINT "maintenance_groups_frequency_id_fkey" FOREIGN KEY ("frequency_id") REFERENCES "maintenance_frequencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_assets" ADD CONSTRAINT "maintenance_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_assets" ADD CONSTRAINT "maintenance_assets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "maintenance_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "maintenance_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_statuses" ADD CONSTRAINT "report_statuses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_converted_to_work_order_id_fkey" FOREIGN KEY ("converted_to_work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_investigated_by_id_fkey" FOREIGN KEY ("investigated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "maintenance_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_types" ADD CONSTRAINT "contract_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_drivers" ADD CONSTRAINT "vehicle_drivers_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_drivers" ADD CONSTRAINT "vehicle_drivers_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_change_requests" ADD CONSTRAINT "oil_change_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_change_requests" ADD CONSTRAINT "oil_change_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_change_requests" ADD CONSTRAINT "oil_change_requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_requests" ADD CONSTRAINT "accident_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_requests" ADD CONSTRAINT "accident_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_requests" ADD CONSTRAINT "accident_requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_buildings" ADD CONSTRAINT "user_buildings_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_buildings" ADD CONSTRAINT "user_buildings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
