import config from '../config/index.js';

export function validateMovieTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Title is required' };
  }

  const trimmed = title.trim();
  if (trimmed.length < config.validation.movieTitleMinLength) {
    return { valid: false, error: 'Title is too short' };
  }

  if (trimmed.length > config.validation.movieTitleMaxLength) {
    return { valid: false, error: 'Title is too long' };
  }

  return { valid: true };
}

export function validateDirector(director) {
  if (!director || typeof director !== 'string') {
    return { valid: false, error: 'Director is required' };
  }

  if (director.trim().length === 0) {
    return { valid: false, error: 'Director cannot be empty' };
  }

  return { valid: true };
}

export function validateRating(rating) {
  const num = parseFloat(rating);

  if (isNaN(num)) {
    return { valid: false, error: 'Rating must be a number' };
  }

  if (num < config.validation.ratingMin || num > config.validation.ratingMax) {
    return {
      valid: false,
      error: `Rating must be between ${config.validation.ratingMin} and ${config.validation.ratingMax}`,
    };
  }

  return { valid: true };
}

export function validateComment(comment) {
  if (typeof comment !== 'string') {
    return { valid: false, error: 'Comment must be a string' };
  }

  if (comment.length > config.validation.commentMaxLength) {
    return { valid: false, error: 'Comment is too long' };
  }

  return { valid: true };
}

export function validateMovieInput(data) {
  const errors = {};

  const titleValidation = validateMovieTitle(data.title);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error;
  }

  const directorValidation = validateDirector(data.director);
  if (!directorValidation.valid) {
    errors.director = directorValidation.error;
  }

  const ratingValidation = validateRating(data.rating);
  if (!ratingValidation.valid) {
    errors.rating = ratingValidation.error;
  }

  const commentValidation = validateComment(data.comment);
  if (!commentValidation.valid) {
    errors.comment = commentValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export default {
  validateMovieTitle,
  validateDirector,
  validateRating,
  validateComment,
  validateMovieInput,
};
