import {
  PrismaClient,
  TreatmentType,
  MealType,
  PurineLevel,
  LinkStatus,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean slate
  await prisma.caregiverLink.deleteMany();
  await prisma.dietEntry.deleteMany();
  await prisma.symptomEntry.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.treatmentEntry.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Test1234!', 10);

  const patient = await prisma.user.create({
    data: {
      email: 'patient@example.com',
      passwordHash,
      role: UserRole.PATIENT,
    },
  });

  const caregiver = await prisma.user.create({
    data: {
      email: 'caregiver@example.com',
      passwordHash,
      role: UserRole.CAREGIVER,
    },
  });

  const now = new Date('2026-04-19T00:00:00Z');
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

  await prisma.treatmentEntry.createMany({
    data: [
      {
        userId: patient.id,
        date: daysAgo(60),
        type: TreatmentType.INFUSION,
        uricAcidLevel: 7.8,
        painScore: 5,
        notes: 'First infusion cycle',
      },
      { userId: patient.id, date: daysAgo(45), type: TreatmentType.CLINIC_VISIT, painScore: 4 },
      {
        userId: patient.id,
        date: daysAgo(30),
        type: TreatmentType.INFUSION,
        uricAcidLevel: 6.5,
        painScore: 3,
      },
      {
        userId: patient.id,
        date: daysAgo(15),
        type: TreatmentType.MEDICATION,
        painScore: 2,
        notes: 'Allopurinol dose adjusted',
      },
      {
        userId: patient.id,
        date: daysAgo(5),
        type: TreatmentType.INFUSION,
        uricAcidLevel: 5.9,
        painScore: 2,
      },
    ],
  });

  await prisma.labResult.createMany({
    data: [
      { userId: patient.id, date: daysAgo(60), uricAcidLevel: 7.8 },
      { userId: patient.id, date: daysAgo(45), uricAcidLevel: 7.2 },
      { userId: patient.id, date: daysAgo(30), uricAcidLevel: 6.5 },
      { userId: patient.id, date: daysAgo(15), uricAcidLevel: 6.1 },
      { userId: patient.id, date: daysAgo(5), uricAcidLevel: 5.9 },
    ],
  });

  await prisma.symptomEntry.createMany({
    data: [
      { userId: patient.id, date: daysAgo(58), symptomType: 'joint_pain', severity: 7 },
      { userId: patient.id, date: daysAgo(50), symptomType: 'swelling', severity: 5 },
      { userId: patient.id, date: daysAgo(43), symptomType: 'fatigue', severity: 6 },
      { userId: patient.id, date: daysAgo(35), symptomType: 'joint_pain', severity: 4 },
      { userId: patient.id, date: daysAgo(28), symptomType: 'nausea', severity: 3 },
      { userId: patient.id, date: daysAgo(20), symptomType: 'swelling', severity: 3 },
      { userId: patient.id, date: daysAgo(14), symptomType: 'joint_pain', severity: 2 },
      { userId: patient.id, date: daysAgo(10), symptomType: 'fatigue', severity: 2 },
      { userId: patient.id, date: daysAgo(7), symptomType: 'joint_pain', severity: 2 },
      { userId: patient.id, date: daysAgo(3), symptomType: 'swelling', severity: 1 },
    ],
  });

  await prisma.dietEntry.createMany({
    data: [
      {
        userId: patient.id,
        date: daysAgo(7),
        meal: 'Oatmeal with berries',
        mealType: MealType.BREAKFAST,
        purineLevel: PurineLevel.LOW,
        riskScore: 0.1,
      },
      {
        userId: patient.id,
        date: daysAgo(7),
        meal: 'Grilled chicken salad',
        mealType: MealType.LUNCH,
        purineLevel: PurineLevel.MEDIUM,
        riskScore: 0.4,
      },
      {
        userId: patient.id,
        date: daysAgo(6),
        meal: 'Sardines on toast',
        mealType: MealType.DINNER,
        purineLevel: PurineLevel.HIGH,
        riskScore: 0.85,
        aiAnalysis: 'High-purine fish; consider limiting to once per week.',
      },
      {
        userId: patient.id,
        date: daysAgo(6),
        meal: 'Apple',
        mealType: MealType.SNACK,
        purineLevel: PurineLevel.LOW,
        riskScore: 0.05,
      },
      {
        userId: patient.id,
        date: daysAgo(5),
        meal: 'Whole-grain toast with egg',
        mealType: MealType.BREAKFAST,
        purineLevel: PurineLevel.LOW,
        riskScore: 0.15,
      },
      {
        userId: patient.id,
        date: daysAgo(5),
        meal: 'Beef stew',
        mealType: MealType.DINNER,
        purineLevel: PurineLevel.HIGH,
        riskScore: 0.78,
        aiAnalysis: 'Red meat is a high-purine source; substitute with tofu or legumes.',
      },
      {
        userId: patient.id,
        date: daysAgo(4),
        meal: 'Vegetable soup',
        mealType: MealType.LUNCH,
        purineLevel: PurineLevel.LOW,
        riskScore: 0.1,
      },
      {
        userId: patient.id,
        date: daysAgo(4),
        meal: 'Salmon with rice',
        mealType: MealType.DINNER,
        purineLevel: PurineLevel.MEDIUM,
        riskScore: 0.45,
      },
    ],
  });

  await prisma.caregiverLink.create({
    data: {
      caregiverId: caregiver.id,
      patientId: patient.id,
      status: LinkStatus.ACTIVE,
    },
  });

  console.log(
    'Seed complete: 2 users, 5 treatments, 5 labs, 10 symptoms, 8 diet entries, 1 caregiver link',
  );
}

main()
  .catch((e) => {
    console.error('Seed failed:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
