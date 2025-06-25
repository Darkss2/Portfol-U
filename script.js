document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const body = document.body;
    const themeSwitcher = document.querySelector('.theme-switcher');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.main-nav a');
    const copyMessage = document.getElementById('copyMessage');
    const statNumbers = document.querySelectorAll('.stat-number');
    const skillTicker = document.querySelector('.skill-ticker');
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const mainNav = document.querySelector('.main-nav');

    // --- Mobile Navigation ---
    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener('click', () => {
            body.classList.toggle('nav-open');
            mainNav.classList.toggle('is-open');
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (body.classList.contains('nav-open')) {
                    body.classList.remove('nav-open');
                    mainNav.classList.remove('is-open');
                }
            });
        });
    }

    // --- Theme Switcher ---
    themeSwitcher.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-theme');
        if (isDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

    // --- Load saved theme ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    } else {
        body.classList.add('dark-theme'); // Default to dark
    }

    // --- Debounce function for performance ---
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // --- Smooth scrolling and navbar update ---
    const updateNavAndSections = debounce(() => {
        let current = '';
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, 10);

    window.addEventListener('scroll', updateNavAndSections);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                 window.scrollTo({
                    top: targetId === '#home' ? 0 : targetSection.offsetTop - 80, // Offset for fixed header
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Video Slider Functionality (for ALL sliders on the page) ---
    document.querySelectorAll('.video-section').forEach(section => {
        const slider = section.querySelector('.video-slider');
        const leftArrow = section.querySelector('.left-arrow');
        const rightArrow = section.querySelector('.right-arrow');

        if (!slider || !leftArrow || !rightArrow) return;
        
        const firstVideo = slider.querySelector('.video-wrapper');
        const scrollAmount = firstVideo ? firstVideo.offsetWidth * 1.5 : slider.clientWidth * 0.8;

        leftArrow.addEventListener('click', () => {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', () => {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        const updateArrowState = () => {
            const isAtEnd = (slider.scrollLeft + slider.clientWidth) >= (slider.scrollWidth - 5);
            
            leftArrow.style.opacity = slider.scrollLeft > 1 ? '1' : '0.3';
            rightArrow.style.opacity = isAtEnd ? '0.3' : '1';
        };

        slider.addEventListener('scroll', debounce(updateArrowState, 50), { passive: true });
        setTimeout(updateArrowState, 100);
        window.addEventListener('resize', debounce(updateArrowState, 200));
    });

    // --- Copy contact info to clipboard ---
    document.querySelectorAll('.contact-item[data-copy]').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.tagName.toLowerCase() === 'a' && (item.href.startsWith('mailto:') || item.href.startsWith('tel:'))) {
                 console.log("Link clicked, but also copying to clipboard.");
            } else {
                 e.preventDefault();
            }

            const text = item.getAttribute('data-copy');
            if (text) {
                navigator.clipboard.writeText(text).then(() => {
                    copyMessage.style.opacity = '1';
                    copyMessage.style.transform = 'translateX(-50%) translateY(0)';
                    setTimeout(() => {
                        copyMessage.style.opacity = '0';
                        copyMessage.style.transform = 'translateX(-50%) translateY(10px)';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    });

    // --- Stat Counter Animation ---
    const startStatCounters = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stat = entry.target;
                    const target = parseInt(stat.dataset.target);
                    let current = 0;
                    const duration = 2000;
                    const stepTime = 10;
                    const totalSteps = duration / stepTime;
                    const increment = target / totalSteps;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            clearInterval(timer);
                            stat.innerText = target;
                        } else {
                            stat.innerText = Math.ceil(current);
                        }
                    }, stepTime);

                    observer.unobserve(stat);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => {
            observer.observe(stat);
        });
    };

    // --- Thumbnail Click to Play Video (Desktop) or Open Link (Mobile) ---
    const initializeVideoPlayback = () => {
        document.querySelectorAll('.video-thumbnail').forEach(thumbnail => {
            if (thumbnail.dataset.listenerAttached) return;
            thumbnail.dataset.listenerAttached = 'true';

            const videoUrl = thumbnail.getAttribute('data-video-url');
            
            const handleClick = (event) => {
                event.preventDefault();

                // --- Mobile Logic: Open link in new tab (screen width <= 768px) ---
                if (window.innerWidth <= 768) {
                    window.open(videoUrl, '_blank');

                // --- Desktop Logic: Play Inline ---
                } else {
                    const videoContainer = thumbnail.closest('.video-container');
                    if (!videoContainer) return;
                    const iframe = videoContainer.querySelector('.video-iframe');
                    if (!iframe) return;

                    // Stop any other playing video in the same slider
                    const parentSlider = thumbnail.closest('.video-slider');
                    if (parentSlider) {
                        parentSlider.querySelectorAll('.video-container.playing').forEach(playingContainer => {
                            if (playingContainer !== videoContainer) {
                                playingContainer.querySelector('.video-iframe').src = '';
                                playingContainer.classList.remove('playing');
                            }
                        });
                    }

                    iframe.src = videoUrl + "?autoplay=1";
                    videoContainer.classList.add('playing');
                }
            };

            const handleKeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e);
                }
            };

            thumbnail.addEventListener('click', handleClick);
            thumbnail.addEventListener('keydown', handleKeydown);
        });
    };

    // --- Skill Ticker Pause on Hover ---
    if (skillTicker && window.matchMedia('(hover: hover)').matches) {
        skillTicker.addEventListener('mouseover', () => {
            skillTicker.style.animationPlayState = 'paused';
        });
        skillTicker.addEventListener('mouseout', () => {
            skillTicker.style.animationPlayState = 'running';
        });
    }

    // --- Initial function calls ---
    startStatCounters();
    initializeVideoPlayback();
    updateNavAndSections();
});
