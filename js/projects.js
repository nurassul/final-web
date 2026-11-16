// Портфолио: JSON → карточки → поиск → окно выбранного проекта.
$(function () {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    const language = window.siteLanguage;
    const translate = language.translate;
    const search = document.getElementById('projectSearch');
    const modal = document.getElementById('projectModal');
    const template = document.getElementById('projectCardTemplate');
    const categoryNames = {
        architecture: 'Architecture',
        interior: 'Interior',
        cultural: 'Cultural',
    };
    let projects = [];
    let selectedCategory = 'all';
    let selectedProject = null;

    // Текст для поиска содержит название, город, описание и их переводы.
    function getSearchText(project) {
        const parts = [
            project.name,
            project.city,
            project.summary,
            project.description,
            categoryNames[project.category],
        ];
        let text = '';
        for (const part of parts) {
            text += ' ' + part;
            const translations = window.translations[part];
            if (translations) text += ' ' + translations.ru + ' ' + translations.kk;
        }
        return text.normalize('NFKC').toLocaleLowerCase();
    }

    // Заполняем копию HTML-шаблона; текст не вставляем через innerHTML.
    function createCard(project) {
        const card = template.content.cloneNode(true);
        card.querySelector('.project-item').dataset.category = project.category;
        card.querySelector('img').src = project.image;
        card.querySelector('img').alt = translate(project.alt);
        card.querySelector('.project-category').textContent = translate(
            categoryNames[project.category],
        );
        card.querySelector('.project-name').textContent = project.name;
        card.querySelector('.project-summary').textContent = translate(project.summary);
        card.querySelector('.project-location').textContent =
            translate(project.city) + ', ' + project.year;

        const button = card.querySelector('.project-open');
        button.textContent = translate('Quick View');
        button.dataset.project = project.id;
        button.setAttribute(
            'aria-label',
            translate('View project: {name}', { name: project.name }),
        );
        return card;
    }

    function showCards(animate = false) {
        const query = search.value.normalize('NFKC').trim().toLocaleLowerCase();
        const words = query.split(/\s+/);
        const visibleProjects = projects.filter(function (project) {
            const categoryMatches =
                selectedCategory === 'all' || project.category === selectedCategory;
            const searchMatches = words.every((word) => project.searchText.includes(word));
            return categoryMatches && searchMatches;
        });

        grid.replaceChildren();
        for (const project of visibleProjects) {
            grid.appendChild(createCard(project));
        }

        document.getElementById('projectCount').textContent = translate('{count} projects shown', {
            count: visibleProjects.length,
        });
        document.getElementById('noProjects').hidden = visibleProjects.length > 0;
        if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            $(grid).children().hide().fadeIn(220);
        }
    }

    function selectCategory(category) {
        selectedCategory = category;
        $('.filter-btn').each(function () {
            const selected = this.dataset.filter === category;
            $(this).toggleClass('active', selected);
            this.setAttribute('aria-pressed', String(selected));
        });
    }

    // Для всех проектов используется одно окно Bootstrap.
    function fillModal(project) {
        selectedProject = project;
        modal.querySelector('.project-detail-image').src = project.image;
        modal.querySelector('.project-detail-image').alt = translate(project.alt);
        modal.querySelector('#projectModalTitle').textContent = project.name;
        modal.querySelector('.project-description').textContent = translate(project.description);
        modal.querySelector('.project-year').textContent = project.year;
        modal.querySelector('.project-type').textContent = translate(project.type);
        modal.querySelector('.project-city').textContent = translate(project.city);

        const unit = language.language === 'en' ? ' m²' : ' м²';
        modal.querySelector('.project-area').textContent =
            project.area.toLocaleString(language.locale) + unit;

        const credit = modal.querySelector('.project-credit');
        credit.hidden = !project.credit;
        if (project.credit) {
            credit.querySelector('a').textContent = project.credit.author + ' / Unsplash';
            credit.querySelector('a').href = project.credit.url;
        }

        const subject = project.category === 'interior' ? 'Interior' : 'Architecture';
        const query = new URLSearchParams({ projectName: project.name, subject: subject });
        modal.querySelector('.project-inquiry').href =
            'contact.html?' + query.toString() + '#contactForm';
    }

    // Обработчик на контейнере работает и для карточек, созданных позже.
    $(grid).on('click', '.project-open', function () {
        const project = projects.find((project) => project.id === this.dataset.project);
        if (project) fillModal(project);
    });
    $('.filter-btn').on('click', function () {
        selectCategory(this.dataset.filter);
        showCards(true);
    });
    search.addEventListener('input', function () {
        showCards();
    });
    document.getElementById('resetProjects').addEventListener('click', function () {
        search.value = '';
        selectCategory('all');
        showCards(true);
        search.focus();
    });
    document.addEventListener('languagechange', function () {
        showCards();
        if (selectedProject) fillModal(selectedProject);
    });

    function loadProjects(data) {
        projects = data;
        for (const project of projects) {
            project.searchText = getSearchText(project);
        }
        showCards();

        // Ссылка с главной может сразу открыть нужный проект.
        const query = new URLSearchParams(location.search);
        const project = projects.find((project) => project.id === query.get('project'));
        if (project) {
            fillModal(project);
            bootstrap.Modal.getOrCreateInstance(modal).show();
        }
    }

    function loadOfflineProjects() {
        const json = document.getElementById('projectsOffline').textContent;
        loadProjects(JSON.parse(json));
    }

    // При открытии HTML двойным кликом браузер блокирует запрос внешнего JSON.
    if (location.protocol === 'file:') {
        loadOfflineProjects();
    } else {
        $.getJSON('data/projects.json').done(loadProjects).fail(loadOfflineProjects);
    }
});
