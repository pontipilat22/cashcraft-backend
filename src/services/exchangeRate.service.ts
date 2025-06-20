import axios from 'axios';
import CurrencyCache from '../models/CurrencyCache';
import { Op } from 'sequelize';

const OPEN_EXCHANGE_RATES_API_KEY = process.env.OPEN_EXCHANGE_RATES_API_KEY || 'f4ea503186da4984a1e614c82c1075db';
const BASE_URL = 'https://openexchangerates.org/api';

// Список валют которые поддерживает приложение
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'RUB', 'JPY', 'CNY', 'INR', 'BRL', 'CAD', 'AUD',
  'KRW', 'MXN', 'TRY', 'UAH', 'PLN', 'THB', 'SGD', 'CHF', 'KZT', 'BYN',
  'UZS', 'GEL', 'AMD', 'AZN', 'SAR', 'AED', 'IDR', 'MYR', 'VND', 'PHP',
  'NZD', 'HKD', 'SEK', 'NOK', 'DKK', 'CZK', 'HUF'
];

export class ExchangeRateService {
  /**
   * Проверить, нужно ли обновить курсы (прошло больше 24 часов)
   */
  static async needsUpdate(): Promise<boolean> {
    try {
      // Проверяем количество записей в кеше
      const count = await CurrencyCache.count();
      
      // Если записей меньше минимального количества, нужно обновить
      // Минимум должно быть около 1400+ записей (37 валют * 37 валют примерно)
      if (count < 100) {
        console.log(`Currency cache has only ${count} entries, needs update`);
        return true;
      }

      const lastUpdate = await CurrencyCache.findOne({
        order: [['last_updated', 'DESC']],
      });

      if (!lastUpdate) {
        return true; // Курсы еще не загружались
      }

      const now = new Date();
      const lastUpdateTime = new Date(lastUpdate.last_updated);
      const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);

      return hoursSinceUpdate >= 24; // Обновляем раз в 24 часа
    } catch (error) {
      console.error('Error checking if rates need update:', error);
      return true;
    }
  }

  /**
   * Получить курсы валют с Open Exchange Rates
   */
  static async fetchRatesFromAPI(): Promise<{ [key: string]: number }> {
    try {
      console.log('Fetching fresh rates from Open Exchange Rates...');
      const response = await axios.get(`${BASE_URL}/latest.json`, {
        params: {
          app_id: OPEN_EXCHANGE_RATES_API_KEY,
          symbols: SUPPORTED_CURRENCIES.join(','),
        },
      });

      return response.data.rates;
    } catch (error) {
      console.error('Error fetching rates from Open Exchange Rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  /**
   * Обновить кеш курсов валют
   */
  static async updateRatesCache(): Promise<void> {
    try {
      console.log('Updating currency rates cache...');
      const rates = await this.fetchRatesFromAPI();
      const now = new Date();

      // Массив для bulk insert
      const cacheEntries = [];

      // USD является базовой валютой, добавляем все курсы относительно USD
      for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== 'USD') {
          cacheEntries.push({
            base_currency: 'USD',
            target_currency: currency,
            rate: rate,
            source: 'openexchangerates',
            last_updated: now,
          });
        }
      }

      // Добавляем кросс-курсы для популярных валют
      const popularCurrencies = ['EUR', 'GBP', 'RUB', 'CNY', 'JPY', 'KZT', 'UAH', 'BYN', 'TRY', 'PLN'];
      for (const baseCurrency of popularCurrencies) {
        if (rates[baseCurrency]) {
          for (const targetCurrency of SUPPORTED_CURRENCIES) {
            if (targetCurrency !== baseCurrency && rates[targetCurrency]) {
              const crossRate = rates[targetCurrency] / rates[baseCurrency];
              cacheEntries.push({
                base_currency: baseCurrency,
                target_currency: targetCurrency,
                rate: crossRate,
                source: 'openexchangerates',
                last_updated: now,
              });
            }
          }
        }
      }

      // Обновляем или создаем записи в кеше
      for (const entry of cacheEntries) {
        await CurrencyCache.upsert(entry);
      }

      console.log(`Updated ${cacheEntries.length} currency rates in cache`);
    } catch (error) {
      console.error('Error updating rates cache:', error);
      throw error;
    }
  }

  /**
   * Получить курс между двумя валютами (сначала из кеша, потом из API)
   */
  static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    try {
      console.log(`[ExchangeRateService] Getting rate: ${fromCurrency} -> ${toCurrency}`);
      
      if (fromCurrency === toCurrency) return 1;

      // Сначала проверяем кеш
      const cachedRate = await CurrencyCache.findOne({
        where: {
          base_currency: fromCurrency,
          target_currency: toCurrency,
        },
      });
      
      console.log(`[ExchangeRateService] Cached rate found:`, cachedRate ? 'Yes' : 'No');

      if (cachedRate) {
        // Проверяем, не устарел ли кеш
        const hoursSinceUpdate = (new Date().getTime() - new Date(cachedRate.last_updated).getTime()) / (1000 * 60 * 60);
        console.log(`[ExchangeRateService] Hours since update: ${hoursSinceUpdate}, Rate: ${cachedRate.rate}`);
        
        if (hoursSinceUpdate < 24 && cachedRate.rate) {
          const rate = parseFloat(cachedRate.rate.toString());
          console.log(`[ExchangeRateService] Returning cached rate: ${rate}`);
          return rate;
        }
      }

      // Если кеша нет или он устарел, обновляем все курсы
      if (await this.needsUpdate()) {
        await this.updateRatesCache();
        
        // Пробуем снова получить из кеша
        const newCachedRate = await CurrencyCache.findOne({
          where: {
            base_currency: fromCurrency,
            target_currency: toCurrency,
          },
        });

        if (newCachedRate && newCachedRate.rate) {
          return parseFloat(newCachedRate.rate.toString());
        }
      }

      // Если все еще не нашли, пробуем обратный курс
      const reverseRate = await CurrencyCache.findOne({
        where: {
          base_currency: toCurrency,
          target_currency: fromCurrency,
        },
      });

      if (reverseRate && reverseRate.rate) {
        return 1 / parseFloat(reverseRate.rate.toString());
      }
      
      // Если прямого и обратного курса нет, пробуем через USD
      if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
        console.log(`[ExchangeRateService] No direct rate ${fromCurrency}->${toCurrency}, trying via USD`);
        
        // Получаем курсы через USD
        const fromToUsd = await this.getExchangeRate(fromCurrency, 'USD');
        const usdToTarget = await this.getExchangeRate('USD', toCurrency);
        
        if (fromToUsd && usdToTarget) {
          const crossRate = fromToUsd * usdToTarget;
          console.log(`[ExchangeRateService] Cross rate: ${fromCurrency}->${toCurrency} = ${crossRate}`);
          
          // Сохраняем кросс-курс в кеш для будущего использования
          await CurrencyCache.upsert({
            base_currency: fromCurrency,
            target_currency: toCurrency,
            rate: crossRate,
            source: 'calculated',
            last_updated: new Date(),
          });
          
          return crossRate;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return null;
    }
  }

  /**
   * Инициализация при запуске сервера
   */
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing exchange rate service...');
      
      // Проверяем, нужно ли обновить курсы
      if (await this.needsUpdate()) {
        console.log('Currency rates need update');
        await this.updateRatesCache();
      } else {
        console.log('Currency rates are up to date');
      }

      // Запускаем периодическое обновление каждые 6 часов
      setInterval(async () => {
        if (await this.needsUpdate()) {
          try {
            await this.updateRatesCache();
          } catch (error) {
            console.error('Error in scheduled rates update:', error);
          }
        }
      }, 6 * 60 * 60 * 1000); // Каждые 6 часов проверяем
    } catch (error) {
      console.error('Error initializing exchange rate service:', error);
    }
  }

  /**
   * Проверить поддерживается ли валюта
   */
  static isCurrencySupported(currency: string): boolean {
    return SUPPORTED_CURRENCIES.includes(currency);
  }

  /**
   * Получить список поддерживаемых валют
   */
  static getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }
}

