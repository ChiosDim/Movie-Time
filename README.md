# 🎬 Movie Time - Modern Movie Collection Manager

A sleek, modern web application for managing your personal movie collection with ease. Built with Node.js, Express, and PostgreSQL.

## ✨ Features

- 🎯 **Add Movies** - Search and add movies using the OMDB API
- 📋 **Manage Collection** - View, edit, and delete movies from your list
- ⭐ **Rate & Review** - Rate movies (1-10) and add your personal comments
- 🔍 **Smart Sorting** - Sort by title, director, or rating
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- ⚡ **Fast Performance** - Caching layer for API responses
- 🔒 **Secure** - Input validation and environment variable management

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** Database (Neon.tech recommended for free hosting)
- **OMDB API Key** (free at [omdbapi.com](https://www.omdbapi.com/apikey.aspx))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ChiosDim/movie-time.git
   cd "Movie Time"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:

   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:password@host/database
   OMDB_API_KEY=your_api_key_here
   ```

4. **Set up the database**

   Execute this SQL to create the required table:

   ```sql
   CREATE TABLE IF NOT EXISTS movie_info (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     director VARCHAR(255) NOT NULL,
     rating DECIMAL(3,1) NOT NULL,
     comment TEXT NOT NULL,
     cover_url TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_movie_title ON movie_info(title);
   CREATE INDEX idx_movie_rating ON movie_info(rating DESC);
   ```

5. **Start the application**

   **Development mode** (with auto-reload):

   ```bash
   npm run dev
   ```

   **Production mode**:

   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
movie-time/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection pool
│   │   └── index.js      # Centralized config
│   ├── controllers/       # Request handlers
│   │   └── movieController.js
│   ├── models/           # Data models
│   │   └── Movie.js
│   ├── routes/           # Route definitions
│   │   ├── index.js
│   │   └── movies.js
│   ├── middleware/       # Express middleware
│   │   └── errorHandler.js
│   └── utils/            # Utility functions
│       ├── logger.js      # Logging utility
│       ├── cache.js       # In-memory cache
│       ├── omdb.js        # OMDB API client
│       └── validators.js  # Input validation
├── views/               # EJS templates
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── index.ejs
│   ├── add.ejs
│   ├── update.ejs
│   ├── delete.ejs
│   └── error.ejs
├── public/              # Static files
│   ├── styles/
│   │   └── styles.css
│   └── assets/
├── app.js               # Application entry point
├── package.json         # Dependencies & scripts
└── .env.example         # Environment variables template
```

## 🛠️ Available Scripts

```bash
# Start the development server with auto-reload
npm run dev

# Start the production server
npm start

# Check code for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

## 🏗️ Architecture

### MVC Pattern

- **Models** (`src/models/`) - Database operations
- **Views** (`views/`) - EJS templates
- **Controllers** (`src/controllers/`) - Business logic

### Key Components

#### Database Layer

- Connection pooling with pg
- Parameterized queries to prevent SQL injection
- Error handling and logging

#### OMDB Integration

- In-memory caching to reduce API calls
- Error handling for missing movies
- Automatic poster fetching

#### Validation

- Input sanitization
- Type checking
- Range validation for ratings

#### Styling

- CSS variables for theming
- Dark mode support (system preference)
- Responsive grid layout
- Smooth animations

## 🎓 Learning Resources

This refactor demonstrates:

- ✅ Clean code architecture
- ✅ Separation of concerns
- ✅ Error handling best practices
- ✅ Input validation
- ✅ Logging and debugging
- ✅ Modern CSS techniques
- ✅ Responsive design
- ✅ Environment configuration
- ✅ ESLint & Prettier setup

## 🔐 Security Features

- Environment variable protection
- Input validation on all forms
- SQL injection prevention (parameterized queries)
- XSS protection through EJS escaping
- HTTPS ready (ssl enabled for Neon.tech)

## 🌙 Dark Mode

The application automatically detects your system preference:

- Light mode for light theme preference
- Dark mode for dark theme preference
- Smooth theme transitions

## 📱 Responsive Design

Fully responsive breakpoints:

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🐛 Troubleshooting

### "Missing required environment variables"

Ensure all variables from `.env.example` are set in `.env`

### "Cannot find module"

Run `npm install` to install all dependencies

### "Database connection failed"

Check your DATABASE_URL in `.env` and ensure the database is running

### "Movie not found"

The OMDB API might not have exact matches. Try searching with different titles.

## 🚀 Future Enhancements

- [ ] User authentication & multiple profiles
- [ ] Movie search with filters
- [ ] Watchlist/favorites system
- [ ] Statistics dashboard
- [ ] Export collection as PDF
- [ ] Integration with IMDb ratings
- [ ] Movie recommendations
- [ ] REST API endpoints
- [ ] Unit & integration tests

## 📦 Dependencies

**Production:**

- `express` - Web framework
- `pg` - PostgreSQL client
- `axios` - HTTP client
- `ejs` - Template engine
- `body-parser` - Request parsing
- `dotenv` - Environment variables

**Development:**

- `eslint` - Code linting
- `prettier` - Code formatting


**To contribute:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👤 Author

**Dimitris Chios**

- LinkedIn: [dimitris-chios](https://www.linkedin.com/in/dimitris-chios/)
- GitHub: [@ChiosDim](https://github.com/ChiosDim)

🎬
