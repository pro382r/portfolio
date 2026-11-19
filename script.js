
(() => {
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
    const root = document.documentElement;
    const body = document.body;
    const state = {
        theme: localStorage.getItem('portfolioThemeMode') || 'light',
        hue: Number(localStorage.getItem('portfolioAccentHue') || 216)
    };
    // ------------------------------------------------------------------
    // Site-ready gate: reveal animations and the name typer wait until the
    // 3.5s loading screen is finished.
    // ------------------------------------------------------------------
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const readyQueue = [];
    let siteReady = false;
    const onSiteReady = cb => {
        if (siteReady)
            cb();
        else
            readyQueue.push(cb);
    };
    function markSiteReady() {
        if (siteReady)
            return;
        siteReady = true;
        body.classList.remove('is-loading');
        readyQueue.splice(0).forEach(cb => {
            try {
                cb();
            }
            catch (err) {
                console.error(err);
            }
        });
    }

    // Loading screen: avatar circle + "User: Reahoon" + 0 → 100% slider (3.5s).
    (function initPreloader() {
        const loader = $('#preloader');
        if (!loader) {
            markSiteReady();
            return;
        }
        const DURATION = reduceMotion ? 1200 : 3500;
        const fill = $('#preloaderFill');
        const pctEl = $('#preloaderPercent');
        const statusEl = $('#preloaderStatus');
        const bar = $('#preloaderBar');
        const steps = [
            [0, 'Starting up…'],
            [28, 'Loading assets…'],
            [60, 'Preparing portfolio…'],
            [90, 'Almost ready…'],
            [100, 'Welcome']
        ];
        const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const startTime = performance.now();
        let lastStep = -1;
        function finish() {
            loader.classList.add('is-leaving');
            markSiteReady();
            setTimeout(() => loader.remove(), 800);
        }
        function tick(now) {
            const t = Math.min(1, (now - startTime) / DURATION);
            // Linear + eased blend: feels like a real boot bar, but always ends exactly on time.
            const p = .35 * t + .65 * ease(t);
            const pct = Math.round(p * 100);
            fill.style.transform = `scaleX(${p})`;
            pctEl.textContent = `${pct}%`;
            bar.setAttribute('aria-valuenow', String(pct));
            let idx = 0;
            steps.forEach((step, i) => {
                if (pct >= step[0])
                    idx = i;
            });
            if (idx !== lastStep) {
                statusEl.textContent = steps[idx][1];
                lastStep = idx;
            }
            if (t < 1)
                requestAnimationFrame(tick);
            else
                finish();
        }
        requestAnimationFrame(tick);
    })();

    // Load the hero pattern from its root-level Base64 text file.
    fetch('./hero-pattern-base64.txt')
        .then(response => {
            if (!response.ok)
                throw new Error(`Unable to load hero-pattern-base64.txt (${response.status}).`);
            return response.text();
        })
        .then(base64 => {
            const cleanBase64 = base64.replace(/\s+/g, '');
            document.documentElement.style.setProperty(
                '--hero-pattern-image',
                `url("data:image/png;base64,${cleanBase64}")`
            );
        })
        .catch(error => console.error('Hero pattern could not be loaded:', error));

    const defaultHue = 216;
    function hueToHex(h) {
        const s = 0.72, l = 0.52;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60)
            [r, g, b] = [c, x, 0];
        else if (h < 120)
            [r, g, b] = [x, c, 0];
        else if (h < 180)
            [r, g, b] = [0, c, x];
        else if (h < 240)
            [r, g, b] = [0, x, c];
        else if (h < 300)
            [r, g, b] = [x, 0, c];
        else
            [r, g, b] = [c, 0, x];
        const f = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return `#${f(r)}${f(g)}${f(b)}`;
    }
    function applyTheme() {
        body.dataset.theme = state.theme;
        root.dataset.theme = state.theme;
        root.style.setProperty('--accent-h', state.hue);
        root.style.setProperty('--accent', `hsl(${state.hue} 72% 52%)`);
        root.style.setProperty('--accent-strong', `hsl(${state.hue} 78% 45%)`);
        root.style.setProperty('--accent-soft', `hsl(${state.hue} 75% 96%)`);
        root.style.setProperty('--accent-glow', `hsla(${state.hue}, 80%, 52%, .22)`);
        $('#themeToggle').setAttribute('aria-pressed', state.theme === 'blue' ? 'true' : 'false');
        $('#themeIcon').innerHTML = state.theme === 'blue' ? '<use href="#i-moon"/>' : '<use href="#i-sun"/>';
        $('#colorDot').style.background = `hsl(${state.hue} 72% 52%)`;
        positionHueMarker();
        localStorage.setItem('portfolioThemeMode', state.theme);
        localStorage.setItem('portfolioAccentHue', String(Math.round(state.hue)));
        const metaTheme = $('meta[name="theme-color"]');
        if (metaTheme)
            metaTheme.setAttribute('content', state.theme === 'blue' ? '#0F1948' : hueToHex(state.hue));
    }
    function setHue(hue) {
        state.hue = ((hue % 360) + 360) % 360;
        applyTheme();
    }
    $('#themeToggle').addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'blue' : 'light';
        applyTheme();
    });
    const colorControl = $('#colorControl');
    const colorPopover = $('#colorPopover');
    colorControl.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = colorPopover.classList.toggle('open');
        colorControl.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.color-control-wrap')) {
            colorPopover.classList.remove('open');
            colorControl.setAttribute('aria-expanded', 'false');
        }
    });
    const pickerReset = $('#pickerReset');
    function resetAccentColor(event) {
        event?.preventDefault();
        event?.stopPropagation();
        state.hue = defaultHue;
        localStorage.removeItem('portfolioAccentHue');
        applyTheme();
        pickerReset.classList.remove('resetting');
        void pickerReset.offsetWidth;
        pickerReset.classList.add('resetting');
        setTimeout(() => pickerReset.classList.remove('resetting'), 260);
    }
    pickerReset.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
    });
    pickerReset.addEventListener('click', resetAccentColor);
    const hueRing = $('#hueRing');
    let draggingHue = false;
    function updateHueFromPointer(clientX, clientY) {
        const rect = hueRing.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let angle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI + 90;
        angle = (angle + 360) % 360;
        setHue(angle);
    }
    hueRing.addEventListener('pointerdown', e => {
        if (e.target.closest('#pickerReset') || e.target.closest('.picker-center'))
            return;
        e.preventDefault();
        draggingHue = true;
        hueRing.setPointerCapture(e.pointerId);
        updateHueFromPointer(e.clientX, e.clientY);
    });
    hueRing.addEventListener('pointermove', e => {
        if (draggingHue)
            updateHueFromPointer(e.clientX, e.clientY);
    });
    hueRing.addEventListener('pointerup', e => {
        draggingHue = false;
        if (hueRing.hasPointerCapture?.(e.pointerId))
            hueRing.releasePointerCapture(e.pointerId);
    });
    hueRing.addEventListener('pointercancel', () => {
        draggingHue = false;
    });
    hueRing.addEventListener('lostpointercapture', () => {
        draggingHue = false;
    });
    $('#nativeAccentInput').addEventListener('input', e => {
        const hex = e.target.value.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0;
        if (max !== min) {
            const d = max - min;
            if (max === r)
                h = 60 * (((g - b) / d) % 6);
            else if (max === g)
                h = 60 * (((b - r) / d) + 2);
            else
                h = 60 * (((r - g) / d) + 4);
        }
        if (h < 0)
            h += 360;
        setHue(h);
    });
    function positionHueMarker() {
        const ring = $('#hueRing');
        if (!ring)
            return;
        const angle = (state.hue - 90) * Math.PI / 180;
        const radius = (ring.clientWidth / 2) - 11.5;
        const center = ring.clientWidth / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        $('#hueMarker').style.left = `${x}px`;
        $('#hueMarker').style.top = `${y}px`;
    }
    window.addEventListener('resize', positionHueMarker);
    applyTheme();
    const siteNav = $('#siteNav');
    function updateNavState() {
        siteNav.classList.toggle('scrolled', window.scrollY > 18);
    }
    updateNavState();
    window.addEventListener('scroll', updateNavState, { passive: true });
    // Keep the bottom progress bar synchronized with the page scroll position.
    const scrollProgress = $('#scrollProgress');
    const scrollProgressBar = $('#scrollProgressBar');
    let progressUpdatePending = false;
    function updateScrollProgress() {
        if (progressUpdatePending || !scrollProgress || !scrollProgressBar)
            return;
        progressUpdatePending = true;
        requestAnimationFrame(() => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0
                ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
                : 0;
            scrollProgressBar.style.transform = `scaleX(${progress})`;
            scrollProgress.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
            progressUpdatePending = false;
        });
    }
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);
    window.addEventListener('load', updateScrollProgress);
    updateScrollProgress();
    const discordContact = $('#discordContact');
    if (discordContact) {
        discordContact.addEventListener('click', async () => {
            const id = 'rihun38';
            try {
                await navigator.clipboard.writeText(id);
            }
            catch {
                const ta = document.createElement('textarea');
                ta.value = id;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            discordContact.classList.add('copied');
            setTimeout(() => discordContact.classList.remove('copied'), 900);
        });
    }
    const emailCopyBtn = $('#emailCopyBtn');
    if (emailCopyBtn) {
        emailCopyBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const email = 'rihoon223.00.2038@googlemail.com';
            try {
                await navigator.clipboard.writeText(email);
            }
            catch {
                const ta = document.createElement('textarea');
                ta.value = email;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            emailCopyBtn.classList.add('copied');
            setTimeout(() => emailCopyBtn.classList.remove('copied'), 900);
        });
    }
    // Web3Forms AJAX contact form: sends messages without opening the visitor's email app.
    const contactForm = $('#contactForm');
    if (contactForm) {
        const contactFormNote = $('#contactFormNote');
        const contactSubmitButton = contactForm.querySelector('button[type="submit"]');
        const originalSubmitMarkup = contactSubmitButton ? contactSubmitButton.innerHTML : '';
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!contactForm.reportValidity())
                return;
            const nameInput = contactForm.querySelector('[name="name"]');
            const subjectInput = contactForm.querySelector('[name="subject"]');
            const accessKeyInput = contactForm.querySelector('[name="access_key"]');
            const accessKey = String(accessKeyInput?.value || '').trim();
            // Do not send a request until the real Access Key has been added.
            if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
                if (contactFormNote) {
                    contactFormNote.className = 'form-note is-error';
                    contactFormNote.textContent = 'The contact form is not configured yet. Please add your Web3Forms Access Key.';
                }
                return;
            }
            // Give messages without a visitor-entered subject a useful email subject.
            if (subjectInput && !subjectInput.value.trim()) {
                const visitorName = String(nameInput?.value || '').trim();
                subjectInput.value = visitorName ? `New portfolio message from ${visitorName}` : 'New portfolio contact message';
            }
            const formData = new FormData(contactForm);
            if (contactSubmitButton) {
                contactSubmitButton.disabled = true;
                contactSubmitButton.setAttribute('aria-busy', 'true');
                contactSubmitButton.textContent = 'Sending...';
            }
            if (contactFormNote) {
                contactFormNote.className = 'form-note';
                contactFormNote.textContent = 'Sending your message...';
            }
            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData,
                    headers: { Accept: 'application/json' }
                });
                let result = null;
                try {
                    result = await response.json();
                }
                catch {
                    throw new Error('The server returned an unreadable response. Please try again.');
                }
                if (!response.ok || !result || result.success !== true) {
                    throw new Error(result?.message || 'Your message could not be sent. Please try again.');
                }
                contactForm.reset();
                if (contactFormNote) {
                    contactFormNote.className = 'form-note is-success';
                    contactFormNote.textContent = 'Thank you! Your message has been sent successfully. I will get back to you soon.';
                }
            }
            catch (error) {
                if (contactFormNote) {
                    contactFormNote.className = 'form-note is-error';
                    contactFormNote.textContent = error?.message || 'Something went wrong. Please try again later.';
                }
            }
            finally {
                if (contactSubmitButton) {
                    contactSubmitButton.disabled = false;
                    contactSubmitButton.removeAttribute('aria-busy');
                    contactSubmitButton.innerHTML = originalSubmitMarkup;
                }
            }
        });
    }
    const mobileMenu = $('#mobileMenu');
    const menuButton = $('#menuButton');
    function setMenu(open) {
        mobileMenu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
    }
    menuButton.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768)
            setMenu(false);
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('#mobileMenu') && !e.target.closest('#menuButton'))
            setMenu(false);
    });
    function goHome() {
        // Single-page site — Home should never trigger a full navigation.
        // This avoids dropping the GitHub Pages repository subpath.
        // Always update the hash and smooth-scroll in place.
        setMenu(false);
        if (location.hash !== '#home')
            history.replaceState(null, '', `${location.pathname}${location.search}#home`);
        $('#home').scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
    }
    $$('[data-nav="home"]').forEach(link => link.addEventListener('click', e => {
        e.preventDefault();
        goHome();
    }));
    $$('.nav-link:not([data-nav="home"]), #mobileMenu a:not([data-nav="home"])').forEach(link => link.addEventListener('click', e => {
        const target = link.getAttribute('href');
        if (!target || !target.startsWith('#'))
            return;
        e.preventDefault();
        setMenu(false);
        document.querySelector(target)?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
        });
        history.pushState(null, '', target);
    }));
    // Scroll-spy: highlight the nav item for the section currently in view.
    const navItems = $$('[data-nav]');
    const sectionToNav = {
        home: 'home',
        about: 'about',
        'education-skills': 'about',
        experience: 'about',
        leadership: 'about',
        projects: 'projects',
        achievements: 'projects',
        cv: 'cv',
        contact: 'contact'
    };
    const spyOrder = Object.keys(sectionToNav);
    // Dot navigation (right side): click = smooth-scroll straight to that section.
    const dotLinks = $$('#dotNav a[data-dot]');
    dotLinks.forEach(link => link.addEventListener('click', e => {
        const target = document.getElementById(link.dataset.dot);
        if (!target)
            return;
        e.preventDefault();
        target.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start'
        });
        history.pushState(null, '', `#${link.dataset.dot}`);
    }));
    let spyTick = false;
    function updateActiveNav() {
        if (spyTick)
            return;
        spyTick = true;
        requestAnimationFrame(() => {
            spyTick = false;
            let current = spyOrder[0];
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            if (atBottom) {
                current = spyOrder[spyOrder.length - 1];
            }
            else {
                spyOrder.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4)
                        current = id;
                });
            }
            const navId = sectionToNav[current] || 'home';
            navItems.forEach(item => item.classList.toggle('active', item.dataset.nav === navId));
            dotLinks.forEach(link => {
                const on = link.dataset.dot === current;
                link.classList.toggle('active', on);
                if (on)
                    link.setAttribute('aria-current', 'true');
                else
                    link.removeAttribute('aria-current');
            });
        });
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    window.addEventListener('resize', updateActiveNav);
    updateActiveNav();
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: .12 });
    $$('.reveal').forEach((element, index) => {
        element.style.transitionDelay = `${Math.min((index % 5) * 45, 180)}ms`;
    });
    onSiteReady(() => $$('.reveal').forEach(element => revealObserver.observe(element)));
    $('#aboutToggle').addEventListener('click', () => {
        const extra = $('#aboutExtra');
        const expanded = extra.classList.toggle('open');
        $('#aboutToggle').classList.toggle('expanded', expanded);
        $('#aboutToggle').setAttribute('aria-expanded', String(expanded));
        $('#aboutToggle').childNodes[0].textContent = expanded ? 'See Less ' : 'See More ';
    });
    $('#profileImage').addEventListener('error', e => {
        e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900"><rect width="800" height="900" fill="#dce7f6"/><rect x="120" y="100" width="560" height="700" fill="${hueToHex(state.hue)}" opacity=".92"/><text x="400" y="470" text-anchor="middle" font-family="Inter,Arial" font-size="110" font-weight="800" fill="white">RZ</text></svg>`);
        e.currentTarget.alt = 'Reahoon Zannah profile placeholder';
    });
    const cvBackdrop = $('#cvModalBackdrop');
    const closeCvModal = () => cvBackdrop.classList.remove('open');
    $('#closeCvModal').addEventListener('click', closeCvModal);
    cvBackdrop.addEventListener('click', e => {
        if (e.target === cvBackdrop)
            closeCvModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeCvModal();
            setMenu(false);
        }
    });
    // CV PDF is stored as Base64 in the sibling cv-pdf-base64.txt file.

    const CV_FILENAME = 'Md-Reahoon-Zannah-CV.pdf';
    let cvPdfUrl = null;
    let cvPdfBase64Promise = null;

    async function loadCvPdfBase64() {
        if (!cvPdfBase64Promise) {
            cvPdfBase64Promise = fetch('./cv-pdf-base64.txt')
                .then(response => {
                    if (!response.ok)
                        throw new Error(`Unable to load cv-pdf-base64.txt (${response.status}).`);
                    return response.text();
                })
                .then(base64 => base64.replace(/\s+/g, ''))
                .catch(error => {
                    cvPdfBase64Promise = null;
                    throw error;
                });
        }
        return cvPdfBase64Promise;
    }

    async function getCvPdfUrl() {
        if (cvPdfUrl)
            return cvPdfUrl;
        const byteChars = atob(await loadCvPdfBase64());
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++)
            byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        cvPdfUrl = URL.createObjectURL(new Blob([byteArray], { type: 'application/pdf' }));
        return cvPdfUrl;
    }
    $('#previewCv').addEventListener('click', async () => {
        const frame = $('#cvPdfFrame');
        try {
            if (frame && !frame.src)
                frame.src = await getCvPdfUrl();
            cvBackdrop.classList.add('open');
        } catch (error) {
            console.error('CV preview could not be loaded:', error);
            alert('Unable to load the CV. Please make sure the portfolio is running through a local web server and cv-pdf-base64.txt is present.');
        }
    });
    $('#downloadCv').addEventListener('click', async () => {
        try {
            const a = document.createElement('a');
            a.href = await getCvPdfUrl();
            a.download = CV_FILENAME;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('CV download could not be loaded:', error);
            alert('Unable to download the CV. Please make sure the portfolio is running through a local web server and cv-pdf-base64.txt is present.');
        }
    });
    $('#year').textContent = new Date().getFullYear();
    // Hero name typewriter: types the full name letter by letter, holds it
    // for 6s, then erases it quickly in reverse and loops.
    (function initNameTyper() {
        const el = $('.hero-title');
        if (!el)
            return;
        const segments = [
            {
                text: 'Md. ',
                accent: false
            },
            {
                text: 'Reahoon',
                accent: true
            },
            {
                text: ' Zannah',
                accent: false
            }
        ];
        const fullLength = segments.reduce((sum, s) => sum + s.text.length, 0);
        function render(count) {
            let remaining = count;
            let html = '';
            segments.forEach(seg => {
                if (remaining <= 0)
                    return;
                const take = Math.min(remaining, seg.text.length);
                const chunk = seg.text.slice(0, take);
                html += seg.accent ? `<span class="accent">${chunk}</span>` : chunk;
                remaining -= take;
            });
            html += '<span class="type-caret" aria-hidden="true"></span>';
            el.innerHTML = html;
        }
        // Reserve the final height up front so the layout never jumps while typing.
        render(fullLength);
        el.style.minHeight = el.offsetHeight + 'px';
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        const TYPE_MS = 95;
        const HOLD_MS = 6000;
        const ERASE_MS = 32;
        let count = 0;
        let phase = 'typing';
        function tick() {
            if (phase === 'typing') {
                count++;
                render(count);
                if (count >= fullLength) {
                    phase = 'holding';
                    setTimeout(tick, HOLD_MS);
                    return;
                }
                setTimeout(tick, TYPE_MS);
            }
            else if (phase === 'holding') {
                phase = 'erasing';
                setTimeout(tick, ERASE_MS);
            }
            else {
                count--;
                render(count);
                if (count <= 0) {
                    phase = 'typing';
                    setTimeout(tick, TYPE_MS);
                    return;
                }
                setTimeout(tick, ERASE_MS);
            }
        }
        render(0);
        onSiteReady(() => setTimeout(tick, TYPE_MS));
    })();
    // Hero ticker ("Assalamu Alaikum"): one copy visible at a time, travelling right → left.
    // The track holds two copies spaced (window width + gap) apart; script only measures
    // the window and keeps the speed constant on every screen size.
    (function initTicker() {
        const win = $('.ticker-window');
        const track = $('#tickerTrack');
        if (!win || !track)
            return;
        const GAP = 64;      // empty space (px) shown between one pass ending and the next starting
        const SPEED = 62;    // px per second
        function measure() {
            const w = win.clientWidth;
            const text = $('.ticker-item', track);
            if (!w || !text)
                return;
            const pitch = w + GAP + text.offsetWidth;
            track.style.setProperty('--tk-w', `${w}px`);
            track.style.setProperty('--tk-gap', `${GAP}px`);
            track.style.setProperty('--tk-dur', `${(pitch / SPEED).toFixed(2)}s`);
        }
        measure();
        if ('ResizeObserver' in window)
            new ResizeObserver(measure).observe(win);
        else
            window.addEventListener('resize', measure);
        if (document.fonts && document.fonts.ready)
            document.fonts.ready.then(measure);
    })();
    const supportsFinePointer = window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (supportsFinePointer) {
        body.classList.add('cursor-ready');
        const glow = $('#cursorGlow');
        const triangle = $('#cursorTriangle');
        const glowDot = $('.cursor-glow-dot', glow);
        const triangleSvg = $('svg', triangle);
        let x = window.innerWidth * .5;
        let y = window.innerHeight * .5;
        let raf = false;
        let lastX = null, lastY = null, dirX = 0, dirY = 0, flips = [], shakeTimer;
        function paint() {
            raf = false;
            glow.style.transform = `translate3d(${x - 20}px,${y - 20}px,0)`;
            triangle.style.transform = `translate3d(${x - 3}px,${y - 3}px,0)`;
        }
        function grow(on) {
            triangleSvg.style.setProperty('--cs', on ? '1.9' : '1');
            glowDot.style.setProperty('--cs', on ? '1.9' : '1');
        }
        window.addEventListener('pointermove', e => {
            x = e.clientX;
            y = e.clientY;
            glow.style.opacity = '.9';
            triangle.style.opacity = '1';
            if (!raf) {
                raf = true;
                requestAnimationFrame(paint);
            }
            // Shake detection: quick back-and-forth movement makes the cursor bigger.
            const now = performance.now();
            if (lastX !== null) {
                const dx = x - lastX, dy = y - lastY;
                if (Math.abs(dx) > 7) {
                    const sx = dx > 0 ? 1 : -1;
                    if (dirX && sx !== dirX)
                        flips.push(now);
                    dirX = sx;
                }
                if (Math.abs(dy) > 7) {
                    const sy = dy > 0 ? 1 : -1;
                    if (dirY && sy !== dirY)
                        flips.push(now);
                    dirY = sy;
                }
            }
            lastX = x;
            lastY = y;
            flips = flips.filter(t => now - t < 650);
            if (flips.length >= 4) {
                grow(true);
                clearTimeout(shakeTimer);
                shakeTimer = setTimeout(() => {
                    grow(false);
                    flips = [];
                }, 700);
            }
        }, { passive: true });
        window.addEventListener('pointerleave', () => {
            glow.style.opacity = '0';
            triangle.style.opacity = '0';
        });
        window.addEventListener('pointerenter', e => {
            x = e.clientX;
            y = e.clientY;
            if (!raf) {
                raf = true;
                requestAnimationFrame(paint);
            }
            glow.style.opacity = '.9';
            triangle.style.opacity = '1';
        });
        document.addEventListener('pointerover', e => {
            if (e.target.closest('a, button, .mini-btn, .contact-card')) {
                triangle.classList.add('cursor-link');
            }
        });
        document.addEventListener('pointerout', e => {
            if (e.target.closest('a, button, .mini-btn, .contact-card')) {
                triangle.classList.remove('cursor-link');
            }
        });
        paint();
    }
    // ======================================================================
    // HERO TEXTURE SPOTLIGHT
    // Only a small circle around the pointer becomes more transparent.
    // The rest of the hero texture NEVER changes (no global opacity change).
    // Tune: HOLE = opacity at the centre of the circle (0 = fully clear,
    //       1 = no effect). Circle size: --spot-r in style.css (.hero-pattern).
    // ======================================================================
    (function initHeroSpotlight() {
        const hero = $('#home');
        const pattern = $('.hero-pattern');
        if (!hero || !pattern)
            return;
        if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches)
            return;
        const HOLE = 0.08;
        let tx = 0, ty = 0, cx = 0, cy = 0;
        let tAlpha = 1, cAlpha = 1;
        let raf = 0, inside = false, lastX = 0, lastY = 0;
        function apply() {
            pattern.style.setProperty('--mx', `${cx.toFixed(1)}px`);
            pattern.style.setProperty('--my', `${cy.toFixed(1)}px`);
            pattern.style.setProperty('--spot-a', cAlpha.toFixed(3));
        }
        let lastPaint = 0;
        function paint(now) {
            raf = 0;
            // Time-based smoothing → same feel on 60Hz and 144Hz screens.
            const dt = Math.min(64, Math.max(1, now - (lastPaint || now - 16)));
            lastPaint = now;
            const kPos = 1 - Math.exp(-dt / 58);
            const kFade = 1 - Math.exp(-dt / 110);
            cx += (tx - cx) * kPos;
            cy += (ty - cy) * kPos;
            cAlpha += (tAlpha - cAlpha) * kFade;
            const settled = Math.abs(tx - cx) < .3 && Math.abs(ty - cy) < .3
                && Math.abs(tAlpha - cAlpha) < .004;
            if (settled && !inside)
                cAlpha = 1;
            apply();
            if (!settled)
                raf = requestAnimationFrame(paint);
            else
                lastPaint = 0;
        }
        const kick = () => {
            if (!raf)
                raf = requestAnimationFrame(paint);
        };
        function aim(x, y) {
            lastX = x;
            lastY = y;
            const rect = hero.getBoundingClientRect();
            tx = x - rect.left;
            ty = y - rect.top;
        }
        hero.addEventListener('pointerenter', e => {
            if (e.pointerType === 'touch')
                return;
            aim(e.clientX, e.clientY);
            if (!inside) {
                cx = tx;
                cy = ty;
            }
            inside = true;
            tAlpha = HOLE;
            kick();
        });
        hero.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch' || !inside)
                return;
            aim(e.clientX, e.clientY);
            kick();
        }, { passive: true });
        hero.addEventListener('pointerleave', () => {
            inside = false;
            tAlpha = 1;
            kick();
        });
        // Keep the spot under the pointer while the page scrolls.
        window.addEventListener('scroll', () => {
            if (!inside)
                return;
            aim(lastX, lastY);
            kick();
        }, { passive: true });
    })();

    // ======================================================================
    // SCROLL-SPEED METER (0 – 5)
    // Needle rests at 0, follows the real scroll speed with a little spring
    // bounce, and the whole meter glows harder at level 4+. Nav-link jumps
    // are fast smooth-scrolls, so they register on the meter automatically.
    // ======================================================================
    (function initSpeedometer() {
        const meter = $('#speedo');
        if (!meter)
            return;
        const needle = $('#speedoNeedle');
        const fill = $('#speedoFill');
        const readout = $('#speedoValue');
        const ticks = $('#speedoTicks');
        const NS = 'http://www.w3.org/2000/svg';
        const CX = 100, CY = 100, MAX = 5;
        const HOT_ON = 4, HOT_OFF = 3.6;
        const MAX_ON = 4.9, MAX_OFF = 4.5; // scrollbar pulses while the meter sits at 5
        const FULL_SCALE_SPEED = 3800; // px/s that reads as level 5 (lower = more sensitive)
        const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
        // Build the dial: 11 ticks (0, 0.5 … 5) with labels on whole numbers.
        for (let i = 0; i <= 10; i++) {
            const lvl = i / 2;
            const major = i % 2 === 0;
            const a = Math.PI * (1 - lvl / MAX);
            const r1 = major ? 63 : 68;
            const r2 = 74;
            const tick = document.createElementNS(NS, 'line');
            tick.setAttribute('x1', (CX + r1 * Math.cos(a)).toFixed(2));
            tick.setAttribute('y1', (CY - r1 * Math.sin(a)).toFixed(2));
            tick.setAttribute('x2', (CX + r2 * Math.cos(a)).toFixed(2));
            tick.setAttribute('y2', (CY - r2 * Math.sin(a)).toFixed(2));
            tick.setAttribute('class', `speedo__tick${major ? ' speedo__tick--major' : ''}`);
            ticks.appendChild(tick);
            if (major) {
                const label = document.createElementNS(NS, 'text');
                label.setAttribute('x', (CX + 49 * Math.cos(a)).toFixed(2));
                label.setAttribute('y', (CY - 49 * Math.sin(a) + 5).toFixed(2));
                label.setAttribute('class', 'speedo__label');
                label.textContent = String(lvl);
                ticks.appendChild(label);
            }
        }
        let prevY = window.scrollY;
        let speed = 0; // smoothed px/s
        let level = 0; // displayed needle value (spring)
        let vel = 0;
        let running = false;
        let hot = false;
        let atMax = false;
        let lastT = 0;
        let idleTimer = 0;
        const speedToLevel = s => MAX * Math.min(1, Math.pow(s / FULL_SCALE_SPEED, .7));
        function render() {
            needle.setAttribute('transform', `rotate(${(-90 + level * 36).toFixed(2)} ${CX} ${CY})`);
            const pct = clamp(level / MAX, 0, 1) * 100;
            fill.style.strokeDasharray = `${pct.toFixed(2)} 100`;
            readout.textContent = clamp(level, 0, MAX).toFixed(1);
            const nowHot = hot ? level >= HOT_OFF : level >= HOT_ON;
            if (nowHot !== hot) {
                hot = nowHot;
                meter.classList.toggle('is-hot', hot);
            }
            const nowMax = atMax ? level >= MAX_OFF : level >= MAX_ON;
            if (nowMax !== atMax) {
                atMax = nowMax;
                root.classList.toggle('scrollbar-pulse', atMax);
            }
        }
        function frame(now) {
            const dt = Math.min(.05, Math.max(.001, (now - lastT) / 1000));
            lastT = now;
            const y = window.scrollY;
            const inst = Math.abs(y - prevY) / dt;
            prevY = y;
            // Rises quickly, falls slowly — like a real analogue gauge.
            const tau = inst > speed ? .06 : .42;
            speed += (inst - speed) * (1 - Math.exp(-dt / tau));
            if (speed < 3 && inst === 0)
                speed = 0;
            const target = speedToLevel(speed);
            // Slightly under-damped spring → small overshoot, then settles.
            const accel = 160 * (target - level) - 15.5 * vel;
            vel += accel * dt;
            level = clamp(level + vel * dt, -.12, MAX + .12);
            render();
            if (speed === 0 && Math.abs(level) < .004 && Math.abs(vel) < .01) {
                level = 0;
                vel = 0;
                running = false;
                render();
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => meter.classList.remove('is-active'), 1400);
                return;
            }
            requestAnimationFrame(frame);
        }
        function start() {
            if (body.classList.contains('is-loading')) {
                prevY = window.scrollY;
                return;
            }
            clearTimeout(idleTimer);
            meter.classList.add('is-active');
            if (running)
                return;
            running = true;
            lastT = performance.now() - 16;
            requestAnimationFrame(frame);
        }
        window.addEventListener('scroll', start, { passive: true });
        onSiteReady(() => {
            prevY = window.scrollY;
        });
        render();
    })();

    // ======================================================================
    // EXPERIENCE / ACTIVITIES — auto status chips + hover mini-charts
    // Data comes from each card's data-start / data-end ("YYYY-MM").
    // Use data-end="present" for a role that is still running.
    // ======================================================================
    (function initTimelines() {
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const MONTH_MS = 30.4375 * 86400000;
        const now = new Date();
        const parse = ym => {
            const [y, m] = String(ym).split('-').map(Number);
            return { y, m: (m || 1) - 1 };
        };
        const startOf = ym => {
            const p = parse(ym);
            return new Date(p.y, p.m, 1);
        };
        const endOf = ym => {
            const p = parse(ym);
            return new Date(p.y, p.m + 1, 1); // end of that month
        };
        const cardStart = card => startOf(card.dataset.start);
        const cardEnd = card => {
            const raw = card.dataset.end;
            if (!raw || raw === 'present')
                return new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return endOf(raw);
        };
        const fmt = d => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        // 1) Status chip on every dated card.
        $$('.experience-card[data-start]').forEach(card => {
            const chip = $('.date-status', card);
            if (!chip)
                return;
            const s = cardStart(card), e = cardEnd(card);
            let status = 'completed', text = 'Completed';
            if (now < s) {
                status = 'upcoming';
                text = 'Upcoming';
            }
            else if (now < e) {
                status = 'ongoing';
                text = 'Ongoing';
            }
            chip.textContent = text;
            chip.className = `date-status is-${status}`;
        });

        // 2) Mini-chart beside each section title.
        $$('.title-chart').forEach(wrap => {
            const section = wrap.closest('section');
            const host = $('.chart-card', wrap);
            const titleText = $('.section-title', wrap)?.textContent.trim() || 'Timeline';
            if (!section || !host)
                return;
            const items = $$('.experience-card[data-start]', section).map(card => ({
                role: card.dataset.role || $('.experience-title', card)?.textContent.trim() || 'Role',
                range: $('.date-range', card)?.textContent.trim() || '',
                start: cardStart(card),
                end: cardEnd(card)
            })).sort((a, b) => a.start - b.start);
            if (!items.length) {
                wrap.classList.add('no-chart');
                return;
            }
            const maxEnd = new Date(Math.max(...items.map(i => +i.end), +now));
            const axisStart = new Date(items[0].start.getFullYear(), 0, 1);
            const axisEnd = new Date(maxEnd.getFullYear() + 1, 0, 1);
            const span = axisEnd - axisStart;
            const pos = d => clamp01((d - axisStart) / span) * 100;
            function clamp01(v) {
                return Math.min(1, Math.max(0, v));
            }
            const spanMonths = span / MONTH_MS;
            const monthMode = spanMonths <= 14;
            let axisHtml = '', gridHtml = '';
            if (monthMode) {
                for (let i = 0; i < 12; i++) {
                    const mid = new Date(axisStart.getFullYear(), i, 15);
                    axisHtml += `<span style="left:${pos(mid).toFixed(2)}%">${MONTHS[i][0]}</span>`;
                    if (i % 3 === 0 && i)
                        gridHtml += `<i style="left:${pos(new Date(axisStart.getFullYear(), i, 1)).toFixed(2)}%"></i>`;
                }
            }
            else {
                for (let y = axisStart.getFullYear(); y < axisEnd.getFullYear(); y++) {
                    const d = new Date(y, 0, 1);
                    axisHtml += `<span style="left:${pos(d).toFixed(2)}%">${y}</span>`;
                    if (y !== axisStart.getFullYear())
                        gridHtml += `<i style="left:${pos(d).toFixed(2)}%"></i>`;
                }
            }
            const totalMonths = items.reduce((sum, i) => sum + Math.max(0, (Math.min(+i.end, +now) - i.start) / MONTH_MS), 0);
            const anyOngoing = items.some(i => now >= i.start && now < i.end);
            const tracksHtml = items.map((item, idx) => {
                const bars = [];
                const doneEnd = new Date(Math.min(+item.end, +now));
                if (now > item.start) {
                    const l = pos(item.start), w = Math.max(1.4, pos(doneEnd) - l);
                    bars.push(`<i class="chart-bar chart-bar--done" style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></i>`);
                }
                if (item.end > now) {
                    const from = new Date(Math.max(+item.start, +now));
                    const l = pos(from), w = Math.max(1.4, pos(item.end) - l);
                    bars.push(`<i class="chart-bar chart-bar--future" style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></i>`);
                }
                return `<div class="chart-track" style="--i:${idx}">
                    <div class="chart-track-label"><b>${esc(item.role)}</b><span>${esc(item.range || `${fmt(item.start)} – ${fmt(new Date(item.end - 1))}`)}</span></div>
                    <div class="chart-lane">${bars.join('')}</div>
                </div>`;
            }).join('');
            const nowPos = pos(now);
            const nowHtml = now >= axisStart && now <= axisEnd
                ? `<div class="chart-now${nowPos > 86 ? ' is-right' : ''}" style="left:${nowPos.toFixed(2)}%"><span>Now</span></div>`
                : '';
            const monthsLabel = Math.round(totalMonths);
            host.innerHTML = `
                <div class="chart-head"><strong>${esc(titleText)} timeline</strong><span>Now · ${fmt(now)}</span></div>
                <div class="chart-stats">
                    <div class="chart-stat"><b>${items.length}</b><span>${items.length === 1 ? 'role' : 'roles'}</span></div>
                    <div class="chart-stat"><b>${monthsLabel}</b><span>${monthsLabel === 1 ? 'month' : 'months'}</span></div>
                    <div class="chart-stat"><b>${anyOngoing ? 'Ongoing' : 'Completed'}</b><span>status</span></div>
                </div>
                <div class="chart-axis${monthMode ? '' : ' is-years'}">${axisHtml}</div>
                <div class="chart-tracks"><div class="chart-grid">${gridHtml}</div>${tracksHtml}${nowHtml}</div>
                <div class="chart-legend"><span><i class="is-done"></i>Completed</span><span><i class="is-future"></i>Upcoming</span></div>`;
        });

        // 3) Touch devices have no hover: tap the title to open / close.
        const canHover = window.matchMedia('(hover: hover)').matches;
        $$('.title-chart').forEach(wrap => {
            const title = $('.section-title', wrap);
            title.addEventListener('click', event => {
                if (canHover)
                    return;
                event.stopPropagation();
                $$('.title-chart.is-open').forEach(other => {
                    if (other !== wrap)
                        other.classList.remove('is-open');
                });
                wrap.classList.toggle('is-open');
            });
        });
        document.addEventListener('click', event => {
            if (!event.target.closest('.title-chart'))
                $$('.title-chart.is-open').forEach(wrap => wrap.classList.remove('is-open'));
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape')
                $$('.title-chart.is-open').forEach(wrap => wrap.classList.remove('is-open'));
        });
    })();
})();
