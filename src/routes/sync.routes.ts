import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { syncController } from '../controllers/sync.controller';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Синхронизация данных (отправка на сервер)
router.post('/', syncController.syncData);

// Загрузка данных с сервера
router.get('/download', syncController.downloadData);

// Получение статуса синхронизации
router.get('/status', syncController.getSyncStatus);

export default router; 