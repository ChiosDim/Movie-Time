(function () {
  const titleInput = document.getElementById('newItem');
  const directorInput = document.getElementById('director');
  const descriptionInput = document.getElementById('description');
  const searchDropdown = document.getElementById('search-dropdown');

  if (!titleInput || !searchDropdown) return;

  let searchTimeout = null;

  function showDropdown(html) {
    searchDropdown.innerHTML = html;
    searchDropdown.style.display = 'block';

    // Attach event listeners for search results using event delegation
    searchDropdown.addEventListener('click', function(e) {
      const result = e.target.closest('.search-result');
      if (result) {
        const title = result.getAttribute('data-title');
        if (title) {
          selectMovie(title);
        }
      }
    });

    searchDropdown.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const result = e.target.closest('.search-result');
        if (result) {
          const title = result.getAttribute('data-title');
          if (title) {
            selectMovie(title);
          }
          e.preventDefault(); // Prevent form submission or other default actions
        }
      }
    });
  }

  function hideDropdown() {
    searchDropdown.innerHTML = '';
    searchDropdown.style.display = 'none';
  }

  function renderSearchResults(results) {
    if (!results.length) {
      showDropdown('<div class="search-no-results"><i class="fas fa-search-minus"></i> No movies found</div>');
      return;
    }

    const html = results.slice(0, 5).map(function (movie) {
      const safeTitle = (movie.title || '').replace(/'/g, "\\'").replace(/"/g, '"');
      const posterSrc = movie.poster
        ? movie.poster
        : 'https://placehold.co/32x48/e2e8f0/94a3b8?text=N%2FA';
      const year = movie.year || '';

      return [
        '<div class="search-result" role="option" tabindex="0" data-title="' + safeTitle + '">',
        '<img src="' + posterSrc + '" alt="" class="result-poster" loading="lazy" />',
        '<div class="result-info">',
        '<div class="result-title">' + movie.title + '</div>',
        '<div class="result-year">' + year + '</div>',
        '</div>',
        '</div>',
      ].join('');
    }).join('');

    showDropdown(html);
  }

  // Debounced search
  titleInput.addEventListener('input', function () {
    const query = titleInput.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      hideDropdown();
      return;
    }

    showDropdown('<div class="search-loading"><span class="spinner" aria-hidden="true"></span> Searching...</div>');

    searchTimeout = setTimeout(async function () {
      try {
        const response = await fetch('/api/search?q=' + encodeURIComponent(query));
        if (!response.ok) throw new Error('Search failed');
        const results = await response.json();
        renderSearchResults(Array.isArray(results) ? results : []);
      } catch (_err) {
        showDropdown('<div class="search-no-results"><i class="fas fa-exclamation-triangle"></i> Search unavailable</div>');
      }
    }, 400);
  });

  // Select a movie and auto-fill form fields
  const selectMovie = async function (title) {
    titleInput.value = title;
    hideDropdown();

    try {
      const response = await fetch('/api/movie-details?title=' + encodeURIComponent(title));
      if (!response.ok) return;
      const data = await response.json();

      if (data.success && data.data) {
        if (directorInput && data.data.director) directorInput.value = data.data.director;
        if (descriptionInput && data.data.plot) descriptionInput.value = data.data.plot;
      }
    } catch (_err) {
      // Silently ignore; form keeps current values
    }
  };

  // Close dropdown on outside click
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-input-wrapper')) {
      hideDropdown();
    }
  });

  // Close dropdown on Escape
  titleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      hideDropdown();
    }
  });
})();