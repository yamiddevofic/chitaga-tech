const toggle = document.getElementById('menu-toggle');
const overlay = document.getElementById('mobile-overlay');
const body = document.body;

toggle?.addEventListener('click', () => {
    const isOpen = toggle.classList.contains('is-active');
    toggle.classList.toggle('is-active');
    overlay?.classList.toggle('is-open');
    body.style.overflow = isOpen ? '' : 'hidden';
    toggle.setAttribute('aria-expanded', String(!isOpen));
});

overlay?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        toggle?.classList.remove('is-active');
        overlay?.classList.remove('is-open');
        body.style.overflow = '';
        toggle?.setAttribute('aria-expanded', 'false');
    });
});

const header = document.getElementById('site-header');
let lastScrollY = window.scrollY;
if (window.scrollY > 50) header?.classList.add('scrolled');
window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    header?.classList.toggle('scrolled', currentY > 50);
    if (currentY > 100 && currentY > lastScrollY) {
        header?.classList.add('header-hidden');
    } else {
        header?.classList.remove('header-hidden');
    }
    lastScrollY = currentY;
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinksEls = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinksEls.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}, { rootMargin: '-40% 0px -60% 0px' });

sections.forEach(section => observer.observe(section));
