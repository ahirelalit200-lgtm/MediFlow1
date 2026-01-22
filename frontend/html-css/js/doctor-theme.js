// Doctor Portal Theme Logic

function initializeTheme() {
    const savedTheme = localStorage.getItem('doctorTheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let theme = 'light';
    if (savedTheme) {
        theme = savedTheme;
    } else if (prefersDark) {
        theme = 'dark';
    }

    setTheme(theme);
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('doctorTheme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('doctorTheme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeTheme);
