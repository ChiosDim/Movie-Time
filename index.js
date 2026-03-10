import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon.tech
  },
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.set('view engine', 'ejs');

// API route for OMDB search autocomplete
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const apiKey = process.env.OMDB_API_KEY;
    const response = await axios.get(
      `http://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=${apiKey}`,
      { timeout: 5000 }
    );

    if (response.data.Response === 'False') {
      return res.json([]);
    }

    const suggestions = (response.data.Search || [])
      .slice(0, 10)
      .map((movie) => ({
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster !== 'N/A' ? movie.Poster : null,
        imdbId: movie.imdbID,
      }));

    res.json(suggestions);
  } catch (error) {
    console.error('Search API error:', error.message);
    res.json([]);
  }
});

// API route for movie details
app.get('/api/movie-details', async (req, res) => {
  try {
    const title = req.query.title || '';

    if (!title || title.trim().length === 0) {
      return res.json({ error: 'Title is required', success: false });
    }

    const apiKey = process.env.OMDB_API_KEY;
    const response = await axios.get(
      `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`
    );

    if (response.data.Response === 'False') {
      return res.json({ error: 'Movie not found', success: false });
    }

    res.json({
      success: true,
      data: {
        title: response.data.Title,
        director: response.data.Director || '',
        poster: response.data.Poster,
        plot: response.data.Plot || '',
      },
    });
  } catch (error) {
    console.error('Movie details API error:', error.message);
    res.json({ error: error.message, success: false });
  }
});

app.get('/', async (req, res) => {
  try {
    // Fetch movies from the database
    let sortBy = req.query.sortBy || 'title';
    let orderBy;

    // Validate and set the orderBy clause based on the selected sortBy option
    switch (sortBy) {
      case 'title':
        orderBy = 'title';
        break;
      case 'director':
        orderBy = 'director';
        break;
      case 'rating':
        orderBy = 'rating DESC'; // Sort ratings in descending order
        break;
      default:
        orderBy = 'title'; // Default to sorting by title
    }

    const dbResponse = await db.query(
      `SELECT * FROM movie_info ORDER BY ${orderBy}`
    );
    const movies = dbResponse.rows;

    // Split comment into description and userComment for each movie
    for (const movie of movies) {
      const movieComment = movie.comment || '';
      if (movieComment.includes('\n\n---\n')) {
        const parts = movieComment.split('\n\n---\n');
        movie.description = parts[0];
        movie.userComment = parts[1] || '';
      } else {
        movie.description = movieComment;
        movie.userComment = '';
      }
    }

    const apiKey = process.env.OMDB_API_KEY;
    for (const movie of movies) {
      const omdbApiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movie.title)}&apikey=${process.env.OMDB_API_KEY}`;
      const response = await axios.get(omdbApiUrl);
      movie.cover_url = response.data.Poster || '';
    }

    // Render the 'index' view with the updated movie details - NO CALLBACK!
    res.render('index', {
      movies: movies,
      currentSort: sortBy,
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).send('Error fetching movie details');
  }
});

// GET route for rendering the add.ejs page
app.get('/add', (req, res) => {
  res.render('add', { errorMessage: '', formData: {} });
});

app.post('/add', async (req, res) => {
  try {
    const movieTitle = req.body.newItem;

    // Check if the movie already exists in the database
    const existingMovie = await db.query(
      'SELECT * FROM movie_info WHERE title = $1',
      [movieTitle]
    );

    if (existingMovie.rows.length > 0) {
      // Movie already exists, render the 'add' view with an error message
      return res.render('add', {
        errorMessage: 'Movie already added.',
        formData: req.body,
      });
    }

    const apiKey = '3330d8c9';
    const omdbApiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&apikey=${apiKey}`;

    const response = await axios.get(omdbApiUrl);
    const movie = response.data;

    if (movie.Response === 'False') {
      // If the movie doesn't exist in the API, render the 'add' view with an error message
      throw new Error(`OMDB API error: ${movie.Error}`);
    }

    // Extract cover URL from API response
    const coverUrl = movie.Poster || '';

    // Combine description and userComment for storage
    let commentText = req.body.description || '';
    if (req.body.userComment) {
      commentText = commentText
        ? `${commentText}\n\n---\n${req.body.userComment}`
        : req.body.userComment;
    }

    // Insert the new movie into the database
    const insertQuery =
      'INSERT INTO movie_info (title, director, rating, comment, cover_url) VALUES ($1, $2, $3, $4, $5)';
    const values = [
      movie.Title,
      req.body.director,
      req.body.rating,
      commentText,
      coverUrl,
    ];
    await db.query(insertQuery, values);

    res.redirect('/'); // Redirect to the main page after adding the movie
  } catch (error) {
    console.error(error);
    // Render the 'add' view with an error message
    let errorMessage = 'An unexpected error occurred. Please try again.';

    // Check specific error conditions and update the error message
    if (error.message.includes('Movie already added.')) {
      errorMessage = 'Movie already added.';
    } else if (error.message.includes('OMDB API error')) {
      errorMessage = 'This movie does not exist. Try another title.';
    }

    res.render('add', {
      errorMessage,
      formData: req.body,
    });
  }
});

// GET route for rendering the update.ejs page
app.get('/update/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const dbResponse = await db.query(
      'SELECT * FROM movie_info WHERE id = $1',
      [movieId]
    );

    if (dbResponse.rows.length === 0) {
      return res.status(404).send('Movie not found');
    }

    const movie = dbResponse.rows[0];

    // Split comment into description and userComment
    const movieComment = movie.comment || '';
    if (movieComment.includes('\n\n---\n')) {
      const parts = movieComment.split('\n\n---\n');
      movie.description = parts[0];
      movie.userComment = parts[1] || '';
    } else {
      movie.description = movieComment;
      movie.userComment = '';
    }

    res.render('update', { movie, errorMessage: '' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching movie details');
  }
});

// POST route for handling movie updates
app.post('/update/:id', async (req, res) => {
  const movieId = req.params.id;
  const { title, director, rating, description, userComment } = req.body;

  try {
    // Combine description and userComment for storage
    let commentText = description || '';
    if (userComment) {
      commentText = commentText
        ? `${commentText}\n\n---\n${userComment}`
        : userComment;
    }

    const updateQuery =
      'UPDATE movie_info SET title = $1, director = $2, rating = $3, comment = $4 WHERE id = $5';
    const values = [title, director, rating, commentText, movieId];
    await db.query(updateQuery, values);

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating movie');
  }
});

// POST route for handling movie deletions
app.post('/delete/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    await db.query('DELETE FROM movie_info WHERE id = $1', [movieId]);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting movie');
  }
});

// Express error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .send('Something went wrong on our end! Error details: ' + err.message);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
