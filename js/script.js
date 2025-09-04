document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('themeCheckbox');

  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    checkbox.checked = true;
  }

  checkbox.addEventListener('change', () => {
    const isDark = checkbox.checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});
