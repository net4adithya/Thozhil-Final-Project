import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').default('development'),
    PORT: Joi.number().default(5000),
    SUPABASE_URL: Joi.string().required().description('Supabase project URL'),
    SUPABASE_SECRET_KEY: Joi.string().required().description('Supabase service role secret key'),
    MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB in bytes
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173,http://localhost:5174'),
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
};

export const config = env;

