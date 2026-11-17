import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.js';
import newsRoutes from './routes/news.js';
import taskRoutes from './routes/tasks.js';
import reminderRoutes from './routes/reminders.js';
import notificationRoutes from './routes/notifications.js';
import telegramRoutes from './routes/telegram.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import cronRoutes from './routes/cron.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());

  const allowedOrigins = env.frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          /^http:\/\/localhost:\d+$/.test(origin) ||
          /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.use('/api/health', healthRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/telegram', telegramRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/cron', cronRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
