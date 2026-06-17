// Dropdown functionality
const sortDropdown = document.getElementById('sortDropdown');
if (sortDropdown) {
  const trigger = sortDropdown.querySelector('.custom-select-trigger');
  const menu = sortDropdown.querySelector('.custom-select-dropdown');
  const options = menu.querySelectorAll('.custom-select-option');

  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = sortDropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  options.forEach(option => {
    option.addEventListener('click', function(e) {
      // Navigation happens via href, dropdown closes automatically
      sortDropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', function(e) {
    if (!sortDropdown.contains(e.target)) {
      sortDropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      sortDropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

// Delete confirmation
const deleteForms = document.querySelectorAll('.delete-form');
deleteForms.forEach(form => {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const movieTitle = this.dataset.movieTitle;
    if (confirm(`Are you sure you want to delete "${movieTitle}"?`)) {
      this.submit();
    }
  });
});

// Handle image errors
document.querySelectorAll('.movie-poster img').forEach(img => {
  img.addEventListener('error', function() {
    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSIwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2MwMCI+PnBsYWNlaG9sZD48L3RleHQ+PC9zdmc+';
  });
});