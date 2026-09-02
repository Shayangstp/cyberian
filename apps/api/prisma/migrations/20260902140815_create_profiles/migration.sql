-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "source_key" VARCHAR(80) NOT NULL,
    "linkedin_id" VARCHAR(255),
    "linkedin_url" TEXT,
    "full_name" VARCHAR(255),
    "first_name" VARCHAR(120),
    "last_name" VARCHAR(120),
    "industry" VARCHAR(255),
    "job_title" VARCHAR(255),
    "job_title_role" VARCHAR(255),
    "current_company_name" VARCHAR(255),
    "location_name" VARCHAR(255),
    "country" VARCHAR(120),
    "summary" TEXT,
    "inferred_years_experience" DOUBLE PRECISION,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" JSONB,
    "education" JSONB,
    "source_updated_at" TIMESTAMP(3),
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_source_key_key" ON "profiles"("source_key");

-- CreateIndex
CREATE INDEX "profiles_job_title_idx" ON "profiles"("job_title");

-- CreateIndex
CREATE INDEX "profiles_industry_idx" ON "profiles"("industry");

-- CreateIndex
CREATE INDEX "profiles_country_idx" ON "profiles"("country");
