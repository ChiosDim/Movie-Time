import express from 'express';
import movieController from '../controllers/movieController.js';

const router = express.Router();

// Movie collection (GET /)
router.get('/', movieController.getMovies);

// OMDB search autocomplete (GET /api/search?q=...)
router.get('/api/search', movieController.searchMoviesAPI);

// OMDB movie details for form auto-fill (GET /api/movie-details?title=...)
router.get('/api/movie-details', movieController.getMovieDetails);

// Add movie form (GET /add)
router.get('/add', movieController.getAddPage);

// Add movie submission (POST /add)
router.post('/add', movieController.postAddMovie);

// Edit movie form (GET /update/:id)
router.get('/update/:id', movieController.getUpdatePage);

// Update movie submission (POST /update/:id)
router.post('/update/:id', movieController.postUpdateMovie);

// Delete confirmation page (GET /delete/:id)
router.get('/delete/:id', movieController.getDeletePage);

// Perform deletion (POST /delete/:id)
router.post('/delete/:id', movieController.deleteMovie);

export default router;
