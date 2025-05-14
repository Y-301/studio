
// backend/src/utils/authUtils.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { log } from '../services/logService';

// Load .env file from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MIN_JWT_SECRET_LENGTH = 32; // Recommended minimum length for a strong secret
const DEV_FALLBACK_SECRET = 'DEV_ONLY_DEFAULT_FALLBACK_SECRET_CHANGE_ME_PLEASE_12345';

function getEffectiveJwtSecret(): string {
  const secretFromEnv = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secretFromEnv || secretFromEnv.length < MIN_JWT_SECRET_LENGTH || secretFromEnv === DEV_FALLBACK_SECRET) {
      log('error', 'CRITICAL: JWT_SECRET is not configured, is a placeholder, or is too short for production. Exiting.', undefined, { component: 'AuthUtils' });
      console.error('CRITICAL: JWT_SECRET is not configured, is a placeholder, or is too short for production. Please set a strong, unique JWT_SECRET in your .env file. Application will now exit.');
      process.exit(1); // Exit if secret is insecure in production
    }
    return secretFromEnv;
  } else {
    // Development or other environments
    if (!secretFromEnv || secretFromEnv.length < MIN_JWT_SECRET_LENGTH || secretFromEnv === DEV_FALLBACK_SECRET) {
      log('warn', `JWT_SECRET is missing, a placeholder, or too short. Using an INSECURE default secret for development. DO NOT USE THIS IN PRODUCTION. Please set a strong JWT_SECRET in .env. Length: ${secretFromEnv?.length || 0}`, undefined, { component: 'AuthUtils' });
      return DEV_FALLBACK_SECRET;
    }
    return secretFromEnv;
  }
}

const JWT_SECRET = getEffectiveJwtSecret();

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day
};

export const verifyToken = (token: string): { id: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; iat: number; exp: number };
    return { id: decoded.id, email: decoded.email };
  } catch (error) {
    log('warn', 'JWT verification failed', undefined, { component: 'AuthUtils', error: (error as Error).message });
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
