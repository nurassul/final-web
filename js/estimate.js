// Калькулятор и перенос выбранных параметров в форму через адрес страницы.
function setupEstimate() {
    const language = window.siteLanguage;
    const translate = language.translate;
    const query = new URLSearchParams(location.search);
    const service = document.getElementById('servicePackage');
    const area = document.getElementById('areaSlider');
    const message = document.getElementById('userMessage');
    const packageNames = {
        35: 'Basic Architecture ($35 / m²)',
        65: 'Architecture & Interior Combined ($65 / m²)',
        90: 'Full Commercial & BIM Engineering ($90 / m²)',
    };
    const projectName = (query.get('projectName') || '').trim().slice(0, 80);
    let previousDraft = '';

    function readEstimate() {
        const rate = Number(query.get('package'));
        const size = Number(query.get('area'));
        // Адрес можно изменить вручную, поэтому проверяем допустимые значения.
        if (query.get('estimate') !== '1') return null;
        if (!packageNames[rate]) return null;
        if (!Number.isInteger(size) || size < 30 || size > 400 || size % 10 !== 0) return null;

        return {
            rate: rate,
            area: size,
            render: query.get('render') === '1',
            express: query.get('express') === '1',
        };
    }

    function calculateTotal(estimate) {
        let total = estimate.rate * estimate.area;
        if (estimate.render) total += 350;
        if (estimate.express) total += 500;
        return total;
    }

    function formatPrice(value) {
        return value.toLocaleString(language.locale, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        });
    }

    function formatArea(value) {
        if (language.language === 'en') return value + ' m²';
        return value + ' м²';
    }

    function createEstimateLink(page, estimate) {
        const params = new URLSearchParams({
            estimate: '1',
            package: estimate.rate,
            area: estimate.area,
            render: Number(estimate.render),
            express: Number(estimate.express),
        });
        return page + '?' + params.toString();
    }

    function updateCalculator() {
        if (!service || !area) return;
        const estimate = {
            rate: Number(service.value),
            area: Number(area.value),
            render: document.getElementById('addon3D').checked,
            express: document.getElementById('addonExpress').checked,
        };
        const areaText = formatArea(estimate.area);
        document.getElementById('areaValueText').textContent = areaText;
        area.setAttribute('aria-valuetext', areaText);
        document.getElementById('totalPrice').textContent = formatPrice(calculateTotal(estimate));
        document.getElementById('requestEstimate').href =
            createEstimateLink('contact.html', estimate) + '#contactForm';
    }

    function fillDraft(text) {
        // Если посетитель уже изменил текст, переключение языка не перезапишет его.
        if (message.value !== '' && message.value !== previousDraft) return;
        previousDraft = text;
        message.value = text;
        message.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const savedEstimate = readEstimate();

    function updateInquiry() {
        if (!message) return;

        if (savedEstimate) {
            const summary = document.getElementById('inquiryEstimate');
            summary.hidden = false;
            const addons = [];
            if (savedEstimate.render) addons.push(translate('Photorealistic 3D Renders (+$350)'));
            if (savedEstimate.express) addons.push(translate('Express Fast-Track (+$500)'));

            const addonText = addons.length ? addons.join(', ') : translate('None');
            const details = [
                translate('Service Package') + ': ' + translate(packageNames[savedEstimate.rate]),
                translate('Total Floor Area') + ': ' + formatArea(savedEstimate.area),
                translate('Optional Add-ons') + ': ' + addonText,
                translate('Estimated Investment') +
                    ': ' +
                    formatPrice(calculateTotal(savedEstimate)),
            ].join('\n');

            summary.querySelector('.estimate-details').textContent = details;
            summary.querySelector('a').href =
                createEstimateLink('services.html', savedEstimate) + '#priceEstimatorForm';
            fillDraft(translate('I would like to discuss this estimate.') + '\n' + details);
        } else if (projectName) {
            fillDraft(
                translate('I am interested in a project similar to {name}.', { name: projectName }),
            );
        }
    }

    // При возвращении из заявки восстанавливаем значения калькулятора.
    if (service && savedEstimate) {
        service.value = savedEstimate.rate;
        area.value = savedEstimate.area;
        document.getElementById('addon3D').checked = savedEstimate.render;
        document.getElementById('addonExpress').checked = savedEstimate.express;
    }
    if (message && (savedEstimate || projectName)) {
        let subject = 'Architecture';
        if (savedEstimate && savedEstimate.rate === 90) subject = 'BIM';
        if (!savedEstimate && query.get('subject') === 'Interior') subject = 'Interior';
        document.getElementById('userSubject').value = subject;
    }

    $('#servicePackage, #areaSlider, #addon3D, #addonExpress').on('input change', updateCalculator);
    document.addEventListener('languagechange', function () {
        updateCalculator();
        updateInquiry();
    });
    updateCalculator();
    updateInquiry();
}

setupEstimate();
