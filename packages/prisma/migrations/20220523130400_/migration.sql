/*
  Warnings:

  - The `route` column on the `App_RoutingForms_Form` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "App_RoutingForms_Form" DROP COLUMN "route",
ADD COLUMN     "route" JSONB;
