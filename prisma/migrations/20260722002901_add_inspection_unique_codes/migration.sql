/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `inspection_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,code]` on the table `inspection_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "inspection_categories_companyId_code_key" ON "inspection_categories"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_items_categoryId_code_key" ON "inspection_items"("categoryId", "code");
