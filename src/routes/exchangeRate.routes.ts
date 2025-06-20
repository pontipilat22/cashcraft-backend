import { Router } from 'express';
import { 
  getExchangeRate, 
  getUserExchangeRates,
  saveUserExchangeRate,
  deleteUserExchangeRate,
  setExchangeRateMode,
  getLastUpdate, 
  updateRates 
} from '../controllers/exchangeRate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Публичные роуты (получение курсов из внешнего API)
router.get('/rate', async (req, res) => { await getExchangeRate(req, res); });
router.get('/last-update', async (req, res) => { await getLastUpdate(req, res); });
router.post('/update', async (req, res) => { await updateRates(req, res); });

// Защищенные роуты (пользовательские курсы)
router.get('/user', authenticate, async (req, res) => { await getUserExchangeRates(req as any, res); });
router.post('/user', authenticate, async (req, res) => { await saveUserExchangeRate(req as any, res); });
router.delete('/user/:from_currency/:to_currency', authenticate, async (req, res) => { await deleteUserExchangeRate(req as any, res); });
router.put('/user/mode', authenticate, async (req, res) => { await setExchangeRateMode(req as any, res); });

export default router;
