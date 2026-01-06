document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('themeCheckbox');
  const saved = localStorage.getItem('theme');

  const isDark = saved === 'dark';

  document.body.classList.toggle('dark-mode', isDark);
  checkbox.checked = isDark;

  checkbox.addEventListener('change', () => {
    const isDark = checkbox.checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});
