import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import authRouter from './routes/auth';
import labsRouter from './routes/labs';
import treatmentsRouter from './routes/treatments';
import { AppError } from './utils/errors';
import { logger } from './utils/logger';

const app = express();

// Security + parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/treatments', treatmentsRouter);
app.use('/api/labs', labsRouter);

// Global error handler
app.use((err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.warn(err.message, { path: req.path, method: req.method, statusCode: err.statusCode });
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  logger.error('Unhandled error', { path: req.path, method: req.method, statusCode: 500 });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;

// Only start listening when this file is the process entry point.
// Importing `app` in tests must NOT start a server (would cause port conflicts).
if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    logger.info('Server started', { statusCode: 200 });
  });
}
