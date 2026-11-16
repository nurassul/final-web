// Сохранённая тема применяется до отображения страницы, чтобы фон не мигал.
function setupTheme() {
    const page = document.documentElement;
    let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    let transitionTimer;

    try {
        const savedTheme = localStorage.getItem('minimalist-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            theme = savedTheme;
        }
    } catch (error) {
        // Без localStorage используем системную тему.
    }

    function applyTheme() {
        page.dataset.theme = theme;
        page.dataset.bsTheme = theme;
    }

    function updateThemeButton() {
        const button = document.getElementById('themeToggle');
        if (!button || !window.siteLanguage) {
            return;
        }
        const translate = window.siteLanguage.translate;
        const dark = theme === 'dark';
        const label = translate(dark ? 'Light theme' : 'Dark theme');
        button.title = label;
        button.querySelector('.theme-label').textContent = label;
        button.querySelector('[aria-hidden]').textContent = dark ? '☼' : '◐';
        button.setAttribute('aria-label', translate('Dark theme'));
        button.setAttribute('aria-pressed', String(dark));
    }

    function toggleTheme() {
        theme = theme === 'light' ? 'dark' : 'light';

        clearTimeout(transitionTimer);
        page.classList.add('theme-changing');
        applyTheme();
        updateThemeButton();
        transitionTimer = setTimeout(function () {
            page.classList.remove('theme-changing');
        }, 450);

        try {
            localStorage.setItem('minimalist-theme', theme);
        } catch (error) {
            // Кнопка продолжает работать, даже если браузер запретил сохранение.
        }
    }

    applyTheme();
    document.addEventListener('languagechange', updateThemeButton);
    document.addEventListener('DOMContentLoaded', function () {
        updateThemeButton();
        document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    });
}

setupTheme();
