import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    dialect: 'postgres';
    logging: boolean;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: boolean | string | string[];
    credentials: boolean;
  };
  bcrypt: {
    rounds: number;
  };
  encryption: {
    key: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'cashcraft_user',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'cashcraft_db',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  },
  bcrypt: {
    rounds: 10,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'your-encryption-key',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
};

export default config;
