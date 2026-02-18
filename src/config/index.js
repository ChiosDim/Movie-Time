import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  omdb: {
    apiKey: process.env.OMDB_API_KEY,
    baseUrl: 'http://www.omdbapi.com',
  },
  cache: {
    ttl: 60 * 60 * 24, // 24 hours in seconds
  },
  validation: {
    movieTitleMinLength: 1,
    movieTitleMaxLength: 255,
    ratingMin: 1,
    ratingMax: 10,
    commentMaxLength: 1000,
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'OMDB_API_KEY'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export default config;
