import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config/config';
import { testConnection } from './config/database';
import { sequelize } from './models';
import routes from './routes';
import { forceHttps, securityHeaders, requestSecurity } from './middleware/security';
import { ExchangeRateService } from './services/exchangeRate.service';

const app = express();

// ✅ Лог всех входящих запросов — САМОЕ ПЕРВОЕ
app.use((req, res, next) => {
  console.log(`INCOMING REQUEST: ${req.method} ${req.url}`);
  next();
});

// Security middleware
app.use(forceHttps);
app.use(helmet());
app.use(securityHeaders);

// CORS
app.use(cors(config.cors));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request security
app.use(requestSecurity);

// Логирование
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 🔥 Публичный маршрут для теста
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Тестовый JSON маршрут
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Основные API-роуты
app.use('/api/v1', routes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Глобальный обработчик ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// Запуск сервера
const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: config.server.nodeEnv === 'development' });
    console.log('Database models synchronized');

    await ExchangeRateService.initialize();

    app.listen(config.server.port, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://0.0.0.0:${config.server.port}`);
      console.log(`🌱 Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
