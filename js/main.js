// Общие функции страниц. Запускаются после загрузки HTML.
$(function () {
    const language = window.siteLanguage;
    const translate = language.translate;

    function animationTime(milliseconds) {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : milliseconds;
    }

    // Кнопка «Наверх».
    const backToTop = $('#backToTopBtn');
    $(window)
        .on('scroll', function () {
            backToTop.stop(true, true);
            if (window.scrollY > 250) {
                backToTop.fadeIn(animationTime(150));
            } else {
                backToTop.fadeOut(animationTime(150));
            }
        })
        .triggerHandler('scroll');
    backToTop.on('click', function () {
        window.scrollTo({ top: 0, behavior: animationTime(500) ? 'smooth' : 'instant' });
    });

    // FAQ: открываем выбранный ответ, остальные закрываем.
    const faqButtons = $('.accordion-toggle-btn');
    faqButtons.each(function (index) {
        const button = $(this);
        const panel = button.next('.accordion-toggle-content');
        const panelId = 'faq-answer-' + index;
        this.id = 'faq-question-' + index;
        button.attr('aria-controls', panelId);
        button.attr('aria-expanded', String(button.hasClass('open')));
        panel.attr({ id: panelId, role: 'region', 'aria-labelledby': this.id });
    });

    faqButtons.on('click', function () {
        const button = $(this);
        const shouldOpen = !button.hasClass('open');
        faqButtons.removeClass('open').attr('aria-expanded', 'false');
        faqButtons.next('.accordion-toggle-content').stop(true, true).slideUp(animationTime(200));
        if (shouldOpen) {
            button.addClass('open').attr('aria-expanded', 'true');
            button.next('.accordion-toggle-content').stop(true, true).slideDown(animationTime(200));
        }
    });

    // Часы студии: понедельник–пятница, 09:00–18:00 по времени Астаны.
    function setupOfficeStatus() {
        const badge = document.getElementById('officeStatusBadge');
        if (!badge) return;

        function updateStatus() {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Almaty',
                weekday: 'short',
                hour: '2-digit',
                hourCycle: 'h23',
            });
            const parts = formatter.formatToParts(new Date());
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let day = 0;
            let hour = 0;
            for (const part of parts) {
                if (part.type === 'weekday') day = weekdays.indexOf(part.value);
                if (part.type === 'hour') hour = Number(part.value);
            }

            const workingDay = day >= 1 && day <= 5;
            const open = workingDay && hour >= 9 && hour < 18;
            badge.classList.toggle('bg-success', open);
            badge.classList.toggle('bg-secondary', !open);

            if (open) {
                badge.textContent = translate('Open now · until 18:00 · Astana');
            } else if (workingDay && hour < 9) {
                badge.textContent = translate('Closed · opens today at 09:00 · Astana');
            } else {
                let nextDay = day + 1;
                if (nextDay > 5) nextDay = 1;

                // 7 января 2024 — воскресенье; прибавляем номер нужного дня недели.
                const nextDate = new Date(Date.UTC(2024, 0, 7 + nextDay));
                const dayName = nextDate.toLocaleDateString(language.locale, {
                    weekday: 'long',
                    timeZone: 'UTC',
                });
                badge.textContent = translate('Closed · opens {day} at 09:00 · Astana', {
                    day: dayName,
                });
            }
        }

        updateStatus();
        setInterval(updateStatus, 60000);
        document.addEventListener('languagechange', updateStatus);
    }

    // Форма: проверяем поля, показываем ошибки и считаем символы.
    function setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        const message = document.getElementById('userMessage');
        const alert = $('#contactAlert');
        const fields = [];
        let formStatus = '';
        let submittedName = '';

        for (const id of ['userName', 'userEmail', 'userSubject', 'userMessage', 'userConsent']) {
            const field = document.getElementById(id);
            fields.push(field);
            const error = field.closest('.mb-3, .mb-4').querySelector('.invalid-feedback');
            error.id = id + '-error';
            let description = error.id;
            if (field === message) description += ' charCount';
            field.setAttribute('aria-describedby', description);
        }

        function updateCounter() {
            document.getElementById('charCount').textContent = translate(
                '{count} / 500 characters',
                {
                    count: message.value.length,
                },
            );
        }

        function checkField(field) {
            const value = field.value.trim();
            let valid;
            switch (field.id) {
                case 'userName':
                    valid = value.length >= 3 && value.length <= 100;
                    break;
                case 'userEmail':
                    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
                    break;
                case 'userMessage':
                    valid = value.length >= 10 && value.length <= 500;
                    break;
                case 'userConsent':
                    valid = field.checked;
                    break;
                default:
                    valid = value !== '';
            }
            field.classList.toggle('is-valid', valid);
            field.classList.toggle('is-invalid', !valid);
            field.setAttribute('aria-invalid', String(!valid));
            return valid;
        }

        function updateAlert() {
            if (!formStatus) return;
            alert.removeClass('alert-success alert-danger');
            if (formStatus === 'success') {
                alert.addClass('alert-success');
                alert.text(
                    translate(
                        'Thank you, {name}! Your inquiry passes validation. This is a demo: nothing was sent. Your entries remain available for editing.',
                        {
                            name: submittedName,
                        },
                    ),
                );
            } else {
                alert.addClass('alert-danger');
                alert.text(translate('Please correct the highlighted fields.'));
            }
            // .text() выводит имя как текст, а не как HTML-код.
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            let firstError = null;
            for (const field of fields) {
                const valid = checkField(field);
                if (!valid && !firstError) firstError = field;
            }

            if (firstError) {
                formStatus = 'error';
                firstError.focus();
            } else {
                formStatus = 'success';
                submittedName = document.getElementById('userName').value.trim();
            }
            updateAlert();
            alert.stop(true, true).slideDown(animationTime(200));
            if (!firstError) document.getElementById('contactAlert').focus();
        });

        form.addEventListener('input', function (event) {
            updateCounter();
            const field = event.target;
            if (fields.includes(field) && field.hasAttribute('aria-invalid')) {
                checkField(field);
            }
            if (formStatus === 'success') {
                formStatus = '';
                alert.hide();
            }
        });

        document.addEventListener('languagechange', function () {
            updateCounter();
            updateAlert();
        });
        updateCounter();
    }

    setupOfficeStatus();
    setupContactForm();
});
