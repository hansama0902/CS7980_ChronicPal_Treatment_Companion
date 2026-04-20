-- Remove ADVISOR value from UserRole enum (PostgreSQL requires recreating the type)
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'CAREGIVER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'ADVISOR' THEN 'PATIENT'::"UserRole"
    ELSE "role"::text::"UserRole"
  END
);
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PATIENT';
DROP TYPE "UserRole_old";

-- Add expiresAt to CaregiverLink for 48h invite token expiry (CP-11)
ALTER TABLE "CaregiverLink" ADD COLUMN "expiresAt" TIMESTAMP(3);
