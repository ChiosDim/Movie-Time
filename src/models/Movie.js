import db from '../config/database.js';
import logger from '../utils/logger.js';

class Movie {
  static async findAll(orderBy = 'title') {
    try {
      const validOrderBy = ['title', 'director', 'rating DESC'].includes(
        orderBy
      )
        ? orderBy
        : 'title';
      const result = await db.query(
        `SELECT * FROM movie_info ORDER BY ${validOrderBy}`
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all movies', error.message);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query('SELECT * FROM movie_info WHERE id = $1', [
        id,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching movie with id ${id}`, error.message);
      throw error;
    }
  }

  static async findByTitle(title) {
    try {
      const result = await db.query(
        'SELECT * FROM movie_info WHERE LOWER(title) = LOWER($1)',
        [title]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching movie with title ${title}`, error.message);
      throw error;
    }
  }

  static async create(movieData) {
    const { title, director, rating, comment, cover_url } = movieData;
    try {
      const result = await db.query(
        `INSERT INTO movie_info (title, director, rating, comment, cover_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, director, rating, comment, cover_url]
      );
      logger.info(`Movie created: ${title}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating movie: ${title}`, error.message);
      throw error;
    }
  }

  static async update(id, movieData) {
    const { title, director, rating, comment } = movieData;
    try {
      const result = await db.query(
        `UPDATE movie_info
         SET title = $1, director = $2, rating = $3, comment = $4
         WHERE id = $5
         RETURNING *`,
        [title, director, rating, comment, id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`Movie updated: ${title}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating movie with id ${id}`, error.message);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM movie_info WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`Movie deleted: ${result.rows[0].title}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting movie with id ${id}`, error.message);
      throw error;
    }
  }
}

export default Movie;
