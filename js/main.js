/* ========================================
   iSuara - Main JavaScript
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. Capability Cards - Intersection Observer
    // ========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-12');
                entry.target.classList.add('opacity-100', 'translate-y-0');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.capability-card').forEach((card) => {
        observer.observe(card);
    });

    // ========================================
    // 2. GSAP + ScrollTrigger Setup
    // ========================================
    gsap.registerPlugin(ScrollTrigger);

    // 3. Mobile Menu Toggle Logic
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    
    if (menuBtn) {
        const icon = menuBtn.querySelector('i');
        function toggleMenu() {
            mobileMenu.classList.toggle('translate-x-full');
            if (mobileMenu.classList.contains('translate-x-full')) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
                document.body.style.overflow = '';
            } else {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
                document.body.style.overflow = 'hidden'; 
            }
        }
        menuBtn.addEventListener('click', toggleMenu);
        mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));
    }

    // 4. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('glass', 'shadow-sm');
                navbar.classList.remove('border-white/20', 'border-transparent');
            } else {
                navbar.classList.remove('glass', 'shadow-sm');
                navbar.classList.add('border-white/20', 'border-transparent');
            }
        });
    }

    // 5. Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 6. GSAP matchMedia for Responsive Animations
    let mm = gsap.matchMedia();

    // DESKTOP ONLY: Sliding Deck Effect
    mm.add("(min-width: 768px)", () => {
        const sdgCards = gsap.utils.toArray(".sdg-card");
        if (sdgCards.length > 0) {
            gsap.set(sdgCards, { x: 300, opacity: 0 });
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#sdgs",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1
                }
            });

            sdgCards.forEach((card, i) => {
                tl.to(card, { 
                    x: 0, 
                    opacity: 1, 
                    rotation: i % 2 === 0 ? -3 : 3, 
                    duration: 1, 
                    ease: "power2.out" 
                }, i * 0.8);
            });
        }
    });

    // ALL DEVICES: Fade-ins and Number Counters
    mm.add("all", () => {
        // Fade sections in
        const sections = document.querySelectorAll('section > div');
        sections.forEach(sec => {
            gsap.fromTo(sec,
                { y: 30, opacity: 0 },
                {
                    scrollTrigger: { trigger: sec, start: "top 85%" },
                    y: 0, opacity: 1, duration: 0.8, ease: "power2.out"
                }
            );
        });

        // Hero Animations
        gsap.from(".gs-reveal", { y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out" });
        gsap.to(".radar-circle", { scale: 1.2, opacity: 0, duration: 4, stagger: 0.5, repeat: -1, ease: "none" });

        // Counter numbers
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            ScrollTrigger.create({
                trigger: counter,
                start: "top 80%",
                once: true,
                onEnter: () => {
                    gsap.to(counter, {
                        innerText: target, duration: 2, snap: { innerText: 1 }, ease: "power1.inOut"
                    });
                }
            });
        });

        const floatCounters = document.querySelectorAll('.counter-float');
        floatCounters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const proxy = { val: 0 };
            ScrollTrigger.create({
                trigger: counter,
                start: "top 80%",
                once: true,
                onEnter: () => {
                    gsap.to(proxy, {
                        val: target, duration: 2, ease: "power2.out",
                        onUpdate: () => {
                            counter.innerText = proxy.val.toFixed(1); 
                        }
                    });
                }
            });
        });
    });
});
