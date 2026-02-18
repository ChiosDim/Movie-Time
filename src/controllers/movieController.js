import Movie from '../models/Movie.js';
import { searchMovie } from '../utils/omdb.js';
import { validateMovieInput } from '../utils/validators.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import config from '../config/index.js';

export async function getMovies(req, res, next) {
  try {
    const sortBy = req.query.sortBy || 'title';
    const orderBy = mapSortToOrderBy(sortBy);
    const movies = await Movie.findAll(orderBy);

    // Only fetch OMDB data if not a partial update from sorting
    if (!req.query.sortBy) {
      for (const movie of movies) {
        try {
          const omdbData = await searchMovie(movie.title);
          movie.cover_url = omdbData.poster;
        } catch (error) {
          logger.warn(`Failed to fetch OMDB data for ${movie.title}`);
          movie.cover_url = movie.cover_url || null;
        }
      }
    }

    // Split comment into description and userComment for display
    for (const movie of movies) {
      if (movie.comment && movie.comment.includes('\n\n---\n')) {
        const parts = movie.comment.split('\n\n---\n');
        movie.description = parts[0];
        movie.userComment = parts[1] || '';
      } else {
        movie.description = movie.comment || '';
        movie.userComment = '';
      }
    }

    const isPartialUpdate = req.query.sortBy !== undefined;

    res.render('index', {
      movies,
      isPartialUpdate,
      currentSort: sortBy,
    });
  } catch (error) {
    logger.error('Error in getMovies', error.message);
    next(error);
  }
}

export async function getAddPage(req, res, next) {
  try {
    const movieTitle = req.query.title || '';
    let formData = {
      title: '',
      director: '',
      rating: 5,
      description: '',
      userComment: '',
    };
    let errorMessage = '';

    // If title is provided, fetch OMDB data to pre-fill the form
    if (movieTitle) {
      try {
        const omdbData = await searchMovie(movieTitle);
        formData = {
          title: omdbData.title,
          director: omdbData.director || '',
          rating: 5,
          description: omdbData.plot || '',
          userComment: '',
          cover_url: omdbData.poster,
        };
      } catch (error) {
        // If OMDB search fails, just use the title
        formData.title = movieTitle;
        logger.warn(`Failed to auto-fill movie data for ${movieTitle}`);
      }
    }

    res.render('add', {
      errorMessage,
      formData,
    });
  } catch (error) {
    logger.error('Error in getAddPage', error.message);
    next(error);
  }
}

export async function postAddMovie(req, res, next) {
  try {
    const {
      newItem: title,
      director,
      rating,
      description,
      userComment,
    } = req.body;

    // Combine description and userComment for validation
    const comment = description
      ? userComment
        ? `${description}\n\n---\n${userComment}`
        : description
      : userComment;

    // Validate input
    const validation = validateMovieInput({
      title,
      director,
      rating,
      comment,
    });

    if (!validation.valid) {
      return res.render('add', {
        errorMessage: Object.values(validation.errors)[0],
        formData: { title, director, rating, description, userComment },
      });
    }

    // Check if movie already exists
    const existingMovie = await Movie.findByTitle(title);
    if (existingMovie) {
      return res.render('add', {
        errorMessage: 'This movie is already in your list.',
        formData: { title, director, rating, description, userComment },
      });
    }

    // Fetch from OMDB
    let omdbData;
    try {
      omdbData = await searchMovie(title);
    } catch (error) {
      return res.render('add', {
        errorMessage: 'Movie not found. Please check the title and try again.',
        formData: { title, director, rating, description, userComment },
      });
    }

    // Create movie
    const movieData = {
      title: omdbData.title || title,
      director,
      rating: parseFloat(rating),
      comment,
      cover_url: omdbData.poster,
    };

    await Movie.create(movieData);
    logger.info(`Movie added by user: ${title}`);

    res.redirect('/');
  } catch (error) {
    logger.error('Error in postAddMovie', error.message);
    next(error);
  }
}

export async function getUpdatePage(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).render('error', {
        error: 'Movie not found',
        statusCode: 404,
      });
    }

    // Split comment into description and userComment
    if (movie.comment && movie.comment.includes('\n\n---\n')) {
      const parts = movie.comment.split('\n\n---\n');
      movie.description = parts[0];
      movie.userComment = parts[1] || '';
    } else {
      movie.description = movie.comment || '';
      movie.userComment = '';
    }

    res.render('update', {
      movie,
      errorMessage: '',
    });
  } catch (error) {
    logger.error('Error in getUpdatePage', error.message);
    next(error);
  }
}

export async function postUpdateMovie(req, res, next) {
  try {
    const { id } = req.params;
    const { title, director, rating, description, userComment } = req.body;

    // Combine description and userComment
    const comment = description
      ? userComment
        ? `${description}\n\n---\n${userComment}`
        : description
      : userComment;

    // Validate input
    const validation = validateMovieInput({
      title,
      director,
      rating,
      comment,
    });

    if (!validation.valid) {
      const movie = await Movie.findById(id);
      return res.render('update', {
        movie,
        errorMessage: Object.values(validation.errors)[0],
      });
    }

    // Update movie
    const updated = await Movie.update(id, {
      title,
      director,
      rating: parseFloat(rating),
      comment,
    });

    if (!updated) {
      return res.status(404).render('error', {
        error: 'Movie not found',
        statusCode: 404,
      });
    }

    logger.info(`Movie updated: ${title}`);
    res.redirect('/');
  } catch (error) {
    logger.error('Error in postUpdateMovie', error.message);
    next(error);
  }
}

export async function deleteMovie(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await Movie.delete(id);

    if (!movie) {
      return res.status(404).render('error', {
        error: 'Movie not found',
        statusCode: 404,
      });
    }

    logger.info(`Movie deleted: ${movie.title}`);
    res.redirect('/');
  } catch (error) {
    logger.error('Error in deleteMovie', error.message);
    next(error);
  }
}

// Helper function to map sort query to ORDER BY clause
function mapSortToOrderBy(sortBy) {
  const sortMap = {
    title: 'title',
    director: 'director',
    rating: 'rating DESC',
  };
  return sortMap[sortBy] || 'title';
}

// Search for movies from OMDB API for autocomplete
export async function searchMoviesAPI(req, res, next) {
  try {
    const query = req.query.q || '';

    // Validate query
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    if (query.trim().length < 2) {
      return res.json([]);
    }

    // Search OMDB using static import
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        s: query,
        type: 'movie',
        apikey: config.omdb.apiKey,
      },
      timeout: 5000,
    });

    if (response.data.Response === 'False') {
      return res.json([]);
    }

    const suggestions = (response.data.Search || [])
      .slice(0, 10) // Limit to 10 results
      .map((movie) => ({
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster !== 'N/A' ? movie.Poster : null,
        imdbId: movie.imdbID,
      }));

    res.json(suggestions);
  } catch (error) {
    logger.error('Error in searchMoviesAPI', error.message);
    // Return empty array on error instead of failing
    res.json([]);
  }
}

export default {
  getMovies,
  getAddPage,
  postAddMovie,
  getUpdatePage,
  postUpdateMovie,
  deleteMovie,
  searchMoviesAPI,
  getMovieDetails,
};

// Get movie details as JSON for form auto-fill
export async function getMovieDetails(req, res, next) {
  try {
    const title = req.query.title || '';

    if (!title || title.trim().length === 0) {
      return res.json({ error: 'Title is required', success: false });
    }

    const movieData = await searchMovie(title);

    res.json({
      success: true,
      data: {
        title: movieData.title,
        director: movieData.director || '',
        poster: movieData.poster,
        plot: movieData.plot || '',
      },
    });
  } catch (error) {
    logger.error('Error in getMovieDetails', error.message);
    res.json({ error: error.message, success: false });
  }
}
