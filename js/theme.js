document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeToggleBtn');
    
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('gatepass_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('gatepass_theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeBtn) return;
        if (theme === 'dark') {
            themeBtn.innerHTML = '<i class="ri-sun-line"></i>'; // Needs Remix Icon or similar, we will use FontAwesome/Remix in HTML
        } else {
            themeBtn.innerHTML = '<i class="ri-moon-line"></i>';
        }
    }
});
