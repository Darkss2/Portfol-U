document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const themeSwitcher = document.querySelector('.theme-switcher');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    const copyMessage = document.getElementById('copyMessage');
    const body = document.body;
    const statNumbers = document.querySelectorAll('.stat-number');
    const skillTicker = document.querySelector('.skill-ticker');

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
        
        // Use the first video wrapper to determine a good scroll amount
        const firstVideo = slider.querySelector('.video-wrapper');
        const scrollAmount = firstVideo ? firstVideo.offsetWidth * 1.5 : slider.clientWidth * 0.8;

        leftArrow.addEventListener('click', () => {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', () => {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        const updateArrowState = () => {
            // A small tolerance to account for subpixel rendering
            const isAtEnd = (slider.scrollLeft + slider.clientWidth) >= (slider.scrollWidth - 5);
            
            leftArrow.style.opacity = slider.scrollLeft > 1 ? '1' : '0.3';
            rightArrow.style.opacity = isAtEnd ? '0.3' : '1';
        };

        slider.addEventListener('scroll', debounce(updateArrowState, 50), { passive: true });
        // Use a slight delay on load to ensure scrollWidth is calculated correctly
        setTimeout(updateArrowState, 100);
        window.addEventListener('resize', debounce(updateArrowState, 200));
    });

    // --- Copy contact info to clipboard (IMPROVED) ---
    document.querySelectorAll('.contact-item[data-copy]').forEach(item => {
        item.addEventListener('click', (e) => {
            // Check if the item is a link. If it is, let the link do its job.
            // We only prevent default for clipboard copy on non-links.
            if (item.tagName.toLowerCase() === 'a' && (item.href.startsWith('mailto:') || item.href.startsWith('tel:'))) {
                 // The link will work, but we can still copy
                 console.log("Link clicked, but also copying to clipboard.");
            } else {
                 e.preventDefault(); // Prevent default only if it's not a primary link
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
                    const duration = 2000; // 2 seconds total
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

                    observer.unobserve(stat); // Animate only once
                }
            });
        }, { threshold: 0.5 }); // Start when 50% of the element is visible

        statNumbers.forEach(stat => {
            observer.observe(stat);
        });
    };

    // --- Thumbnail Click to Play Video (Applied to all thumbnails on page) ---
    const initializeVideoPlayback = () => {
        document.querySelectorAll('.video-thumbnail').forEach(thumbnail => {
             // Use a unique identifier to avoid re-attaching listeners
            if (thumbnail.dataset.listenerAttached) return;
            thumbnail.dataset.listenerAttached = 'true';

            const playVideo = (event) => {
                const videoUrl = thumbnail.getAttribute('data-video-url');
                const videoContainer = thumbnail.closest('.video-container');
                if (!videoContainer) return;
                const iframe = videoContainer.querySelector('.video-iframe');
                if (!iframe) return;

                // Stop any other videos that might be playing in the same slider
                const parentSlider = thumbnail.closest('.video-slider');
                if (parentSlider) {
                    parentSlider.querySelectorAll('.video-container.playing').forEach(playingContainer => {
                        if (playingContainer !== videoContainer) {
                            playingContainer.querySelector('.video-iframe').src = '';
                            playingContainer.classList.remove('playing');
                        }
                    });
                }

                iframe.src = videoUrl + "?autoplay=1"; // Add autoplay parameter
                videoContainer.classList.add('playing');
            };

            const handleClick = (e) => {
                e.preventDefault();
                playVideo(e);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playVideo(e);
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
    updateNavAndSections(); // Call on load to set initial state
});