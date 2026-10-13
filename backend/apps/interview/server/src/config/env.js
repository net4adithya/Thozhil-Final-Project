import dotenv from 'dotenv';
import dns from 'dns';
import Joi from 'joi';
import path from 'path';

// Force Node.js DNS resolver to prioritize IPv4 to eliminate IPv6 network timeouts
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

dotenv.config();
try {
  dotenv.config({ path: path.resolve('server/.env') });
} catch (e) {}

// Normalize SARVAM_API_KEY across all variations
process.env.SARVAM_API_KEY = (process.env.SARVAM_API_KEY || process.env.SARVAM_API_Key || process.env.SARVAM_KEY || '').trim();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
    PORT: Joi.number().default(5000),
    SUPABASE_URL: Joi.string().required().description('Supabase project URL'),
    SUPABASE_SECRET_KEY: Joi.string().required().description('Supabase service role secret key'),
    SARVAM_API_KEY: Joi.string().allow('').description('Sarvam AI API key'),
    MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB in bytes
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173,http://localhost:5174'),
    RATE_LIMIT_MAX: Joi.number().description('Max requests per 15-minute rate limit window'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  supabase: {
    url: envVars.SUPABASE_URL,
    serviceRoleKey: envVars.SUPABASE_SECRET_KEY,
  },
  maxFileSize: envVars.MAX_FILE_SIZE,
  allowedOrigins: envVars.ALLOWED_ORIGINS.split(','),
  rateLimitMax: envVars.RATE_LIMIT_MAX || (envVars.NODE_ENV === 'production' ? 200 : 10000),
};

export const config = env;

