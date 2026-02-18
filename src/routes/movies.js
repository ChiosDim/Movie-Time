import express from 'express';
import movieController from '../controllers/movieController.js';

const router = express.Router();

// Movies list (GET /)
router.get('/', movieController.getMovies);

// Search API for autocomplete (GET /api/search)
router.get('/api/search', movieController.searchMoviesAPI);

// Get movie details for form auto-fill (GET /api/movie-details)
router.get('/api/movie-details', movieController.getMovieDetails);

// Add movie form (GET /add)
router.get('/add', movieController.getAddPage);

// Add movie (POST /add)
router.post('/add', movieController.postAddMovie);

// Edit movie form (GET /update/:id)
router.get('/update/:id', movieController.getUpdatePage);

// Update movie (POST /update/:id)
router.post('/update/:id', movieController.postUpdateMovie);

// Delete movie (GET /delete/:id)
router.get('/delete/:id', movieController.deleteMovie);

export default router;
