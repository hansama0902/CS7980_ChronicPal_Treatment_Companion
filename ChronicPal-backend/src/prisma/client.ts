import { PrismaClient } from '@prisma/client';

// Singleton pattern — reuse one connection pool across the app.
// In test environments each test file imports this and can vi.mock() it.
const prisma = new PrismaClient();

export default prisma;
