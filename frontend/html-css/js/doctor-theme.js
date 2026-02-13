// Doctor Portal Theme Logic

function initializeTheme() {
    // Force light theme for all doctor portal pages
    const theme = 'light';
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
    // Keep theme always light - disable toggle
    const theme = 'light';
    setTheme(theme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeTheme);
