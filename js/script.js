// Mobile Menu Toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navMenu = document.getElementById('navMenu');

// Toggle menu on button click
navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// Prevent menu from closing when clicking inside it
navLinks.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Smooth scroll offset for fixed navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});
// Theme color (mobile browser UI)
(() => {
    const TRANSPARENT = new Set(['transparent', 'rgba(0, 0, 0, 0)']);

    function parseRgbOrRgba(input) {
        const match = input
            .replace(/\s+/g, '')
            .match(/^rgba?\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?\)$/i);
        if (!match) return null;

        const r = Math.max(0, Math.min(255, Number(match[1])));
        const g = Math.max(0, Math.min(255, Number(match[2])));
        const b = Math.max(0, Math.min(255, Number(match[3])));
        const a = match[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(match[4])));
        return { r, g, b, a };
    }

    function relativeLuminance({ r, g, b }) {
        // sRGB relative luminance
        const toLinear = (c) => {
            const v = c / 255;
            return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const R = toLinear(r);
        const G = toLinear(g);
        const B = toLinear(b);
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    function isTransparentColorString(value) {
        if (!value) return true;
        const normalized = value.trim().toLowerCase();
        if (TRANSPARENT.has(normalized)) return true;
        const parsed = parseRgbOrRgba(normalized);
        return parsed ? parsed.a === 0 : false;
    }

    function extractFirstColorFromBackgroundImage(backgroundImage) {
        if (!backgroundImage || backgroundImage === 'none') return null;

        // Typical computed form:
        // linear-gradient(135deg, rgb(0, 128, 221) 0%, rgb(0, 95, 163) 100%)
        const rgbMatch = backgroundImage.match(/rgba?\([^\)]+\)/i);
        if (rgbMatch) return rgbMatch[0];

        const hexMatch = backgroundImage.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
        if (hexMatch) return hexMatch[0];

        return null;
    }

    function ensureMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    function pickHeaderThemeColor(headerEl) {
        if (!headerEl) return null;

        const style = getComputedStyle(headerEl);
        const bgColor = style.backgroundColor;
        if (!isTransparentColorString(bgColor)) return bgColor;

        const fromImage = extractFirstColorFromBackgroundImage(style.backgroundImage);
        if (fromImage) return fromImage;

        return null;
    }

    function updateThemeColorFromHeader() {
        const header = document.querySelector('header.navbar, header, .navbar');
        const color = pickHeaderThemeColor(header);
        if (!color) return;

        ensureMeta('theme-color', color);

        // iOS: no permite color custom en status bar (solo estilos). En modo standalone,
        // "black-translucent" deja ver el color del header debajo.
        const parsed = parseRgbOrRgba(color);
        if (parsed) {
            const lum = relativeLuminance(parsed);
            const preferred = lum < 0.55 ? 'black-translucent' : 'default';
            ensureMeta('apple-mobile-web-app-status-bar-style', preferred);
        }
    }

    // Se ejecuta al cargar y al volver del bfcache
    updateThemeColorFromHeader();
    window.addEventListener('pageshow', updateThemeColorFromHeader);
})();
