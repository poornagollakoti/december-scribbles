-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "instagramUrl" TEXT;

-- AlterTable
ALTER TABLE "SiteProfile" ADD COLUMN     "aboutImageId" UUID;

-- AddForeignKey
ALTER TABLE "SiteProfile" ADD CONSTRAINT "SiteProfile_aboutImageId_fkey" FOREIGN KEY ("aboutImageId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
