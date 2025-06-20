import CryptoJS from 'crypto-js';
import config from '../config/config';

// Ключ шифрования из переменных окружения
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || config.jwt.secret;

/**
 * Утилита для шифрования и дешифрования чувствительных данных
 */
export class EncryptionService {
  /**
   * Шифрует строку используя AES
   */
  static encrypt(text: string): string {
    if (!text) return text;
    
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Дешифрует строку
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Хеширует строку (одностороннее шифрование)
   */
  static hash(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }

  /**
   * Генерирует случайный токен
   */
  static generateToken(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Шифрует объект
   */
  static encryptObject(obj: any): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Дешифрует объект
   */
  static decryptObject<T = any>(encryptedText: string): T {
    const decrypted = this.decrypt(encryptedText);
    return JSON.parse(decrypted);
  }

  /**
   * Маскирует номер карты, оставляя только последние 4 цифры
   */
  static maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 8) return cardNumber;
    
    const cleaned = cardNumber.replace(/\s+/g, '');
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4) + lastFour;
    
    // Форматируем для отображения
    return masked.match(/.{1,4}/g)?.join(' ') || masked;
  }

  /**
   * Проверяет, является ли строка зашифрованной
   */
  static isEncrypted(text: string): boolean {
    try {
      // Пробуем расшифровать
      const decrypted = this.decrypt(text);
      // Если получилось и результат не пустой, значит было зашифровано
      return decrypted.length > 0;
    } catch {
      return false;
    }
  }
}

