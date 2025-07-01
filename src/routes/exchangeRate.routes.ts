import { Router } from 'express';
import { 
  getExchangeRate, 
  getAllExchangeRates,
  saveExchangeRate,
  deleteExchangeRate,
  setExchangeRateMode,
  getLastUpdate, 
  updateRates 
} from '../controllers/exchangeRate.controller';

const router = Router();

// Публичные роуты (получение курсов из внешнего API)
router.get('/rate', async (req, res) => { await getExchangeRate(req, res); });
router.get('/last-update', async (req, res) => { await getLastUpdate(req, res); });
router.post('/update', async (req, res) => { await updateRates(req, res); });

// Глобальные роуты (курсы для всех)
router.get('/all', async (req, res) => { await getAllExchangeRates(req, res); });
router.post('/save', async (req, res) => { await saveExchangeRate(req, res); });
router.delete('/:from_currency/:to_currency', async (req, res) => { await deleteExchangeRate(req, res); });
router.put('/mode', async (req, res) => { await setExchangeRateMode(req, res); });

export default router;
