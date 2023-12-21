import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Movies",
  password: "jimdim2001",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/styles', express.static('public/styles'));
app.use('/assets', express.static('public/assets'));
app.set('view engine', 'ejs');

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

    const dbResponse = await db.query(`SELECT * FROM movie_info ORDER BY ${orderBy}`);
    const movies = dbResponse.rows;

    const apiKey = '3330d8c9';
    for (const movie of movies) {
      const omdbApiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movie.title)}&apikey=${apiKey}`;
      const response = await axios.get(omdbApiUrl);
      movie.cover_url = response.data.Poster || '';
    }

    // Render the 'index' view with the updated movie details
    res.render('index', { movies, onlyMovieDetails: req.query.sortBy !== undefined }, (err, html) => {
      if (err) throw err;
      res.send(html);
    });
    
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).send('Error fetching movie details');
  }
  });



// GET route for rendering the add.ejs page
app.get('/add', (req, res) => {
  res.render('add', { errorMessage: '' });
});

app.post('/add', async (req, res) => {
  try {
    const movieTitle = req.body.newItem;

    // Check if the movie already exists in the database
    const existingMovie = await db.query('SELECT * FROM movie_info WHERE title = $1', [movieTitle]);

    if (existingMovie.rows.length > 0) {
      // Movie already exists, render the 'add' view with an error message
      return res.render('add', { errorMessage: 'Movie already added.' });
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

    // Insert the new movie into the database
    const insertQuery = 'INSERT INTO movie_info (title, director, rating, comment, cover_url) VALUES ($1, $2, $3, $4, $5)';
    const values = [movie.Title, req.body.director, req.body.rating, req.body.comment, coverUrl];
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

    res.render('add', { errorMessage });
  }
});

// GET route for rendering the update.ejs page
app.get('/update/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const dbResponse = await db.query('SELECT * FROM movie_info WHERE id = $1', [movieId]);

    if (dbResponse.rows.length === 0) {
      return res.status(404).send('Movie not found');
    }

    const movie = dbResponse.rows[0];
    res.render('update', { movie });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching movie details');
  }
});

// POST route for handling movie updates
app.post('/update/:id', async (req, res) => {
  const movieId = req.params.id;
  const { title, director, rating, comment } = req.body;

  try {
    const updateQuery = 'UPDATE movie_info SET title = $1, director = $2, rating = $3, comment = $4 WHERE id = $5';
    const values = [title, director, rating, comment, movieId];
    await db.query(updateQuery, values);

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating movie');
  }
});

// POST route for handling movie deletions
app.get('/delete/:id', async (req, res) => {
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
  res.status(500).send('Something went wrong on our end! Error details: ' + err.message);
});
  
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});