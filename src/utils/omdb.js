import axios from 'axios';
import config from '../config/index.js';
import cache from './cache.js';
import logger from './logger.js';

const omdbClient = axios.create({
  baseURL: config.omdb.baseUrl,
  timeout: 10000,
});

export async function searchMovie(title) {
  try {
    const cacheKey = `omdb:${title.toLowerCase()}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for movie: ${title}`);
      return cachedData;
    }

    const response = await omdbClient.get('/', {
      params: {
        t: title,
        apikey: config.omdb.apiKey,
        type: 'movie',
      },
    });

    if (response.data.Response === 'False') {
      throw new Error(response.data.Error || 'Movie not found');
    }

    const movieData = {
      title: response.data.Title,
      poster: response.data.Poster !== 'N/A' ? response.data.Poster : null,
      year: response.data.Year,
      imdbId: response.data.imdbID,
      plot: response.data.Plot,
      director: response.data.Director || '',
    };

    cache.set(cacheKey, movieData);
    logger.debug(`Cache set for movie: ${title}`);

    return movieData;
  } catch (error) {
    logger.error(`OMDB API error for title: ${title}`, error.message);
    throw new Error(`Failed to fetch movie data: ${error.message}`);
  }
}

export default {
  searchMovie,
};
