// Переводы берутся из translations.js. Здесь только выбор языка и обновление страницы.
function setupLanguage() {
    const languages = ['en', 'ru', 'kk'];
    const locales = { en: 'en-US', ru: 'ru-RU', kk: 'kk-KZ' };
    const textItems = [];
    const attributeItems = [];
    const select = document.getElementById('languageSelect');

    // Остальные файлы читают текущий язык и вызывают translate().
    window.siteLanguage = {
        language: 'en',
        locale: 'en-US',
        translate: translate,
    };

    function translate(english, values = {}) {
        let result = english;
        const translation = window.translations[english];
        const currentLanguage = window.siteLanguage.language;

        if (currentLanguage !== 'en' && translation) {
            result = translation[currentLanguage];
        }

        // Например, {count} заменяется количеством найденных проектов.
        for (const name in values) {
            result = result.replaceAll('{' + name + '}', String(values[name]));
        }
        return result;
    }

    // Запоминаем английский текст один раз. Поля ввода и динамические блоки не трогаем.
    for (const element of document.querySelectorAll('*')) {
        if (element.closest('script, style, [data-live], #themeToggle')) {
            continue;
        }

        for (const node of element.childNodes) {
            if (node.nodeType !== Node.TEXT_NODE) {
                continue;
            }
            const english = node.textContent.replace(/\s+/g, ' ').trim();
            if (window.translations[english] || english.endsWith(' m²')) {
                textItems.push({ node: node, english: english, original: node.textContent });
            }
        }

        for (const name of ['alt', 'placeholder', 'aria-label', 'title']) {
            const english = element.getAttribute(name);
            if (english && window.translations[english]) {
                attributeItems.push({ element: element, name: name, english: english });
            }
        }
    }

    function changeLanguage(language) {
        if (!languages.includes(language)) {
            language = 'en';
        }
        window.siteLanguage.language = language;
        window.siteLanguage.locale = locales[language];
        document.documentElement.lang = language;
        select.value = language;

        for (const item of textItems) {
            let text = translate(item.english);
            if (language !== 'en' && item.english.endsWith(' m²')) {
                text = text.replace('m²', 'м²');
            }
            item.node.textContent = item.original.replace(item.original.trim(), text);
        }
        for (const item of attributeItems) {
            item.element.setAttribute(item.name, translate(item.english));
        }

        try {
            localStorage.setItem('minimalist-language', language);
        } catch (error) {
            // Перевод работает и при запрещённом localStorage, но выбор не сохраняется.
        }
        // Калькулятор, форма и проекты обновляют свои динамические тексты.
        document.dispatchEvent(new Event('languagechange'));
    }

    select.addEventListener('change', function () {
        changeLanguage(select.value);
    });

    let savedLanguage = 'en';
    try {
        savedLanguage = localStorage.getItem('minimalist-language') || 'en';
    } catch (error) {
        // Если хранилище недоступно, используем английский.
    }
    changeLanguage(savedLanguage);
}

setupLanguage();
