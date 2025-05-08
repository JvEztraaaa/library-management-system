// === Banner Carousel ===
const bannerSlides = document.querySelector('.banner-slides');
const bannerSlideElements = document.querySelectorAll('.banner-slide');
const bannerSlideCount = bannerSlideElements.length;
let bannerCurrentSlide = 0;

// Show banner slide based on index
function showBannerSlide(index) {
    if (index >= bannerSlideCount) bannerCurrentSlide = 0;
    else if (index < 0) bannerCurrentSlide = bannerSlideCount - 1;
    else bannerCurrentSlide = index;

    bannerSlides.style.transform = `translateX(-${bannerCurrentSlide * 100}%)`;
}

// Button navigation
document.querySelector('.banner-prev').addEventListener('click', () => {
    showBannerSlide(bannerCurrentSlide - 1);
});
document.querySelector('.banner-next').addEventListener('click', () => {
    showBannerSlide(bannerCurrentSlide + 1);
});

// Auto-slide every 5 seconds
setInterval(() => {
    showBannerSlide(bannerCurrentSlide + 1);
}, 5000);

// Swipe support
let bannerTouchStartX = 0;
bannerSlides.addEventListener('touchstart', (e) => {
    bannerTouchStartX = e.changedTouches[0].screenX;
});
bannerSlides.addEventListener('touchend', (e) => {
    const bannerTouchEndX = e.changedTouches[0].screenX;
    if (bannerTouchStartX - bannerTouchEndX > 50) {
        showBannerSlide(bannerCurrentSlide + 1); 
    } else if (bannerTouchEndX - bannerTouchStartX > 50) {
        showBannerSlide(bannerCurrentSlide - 1); 
    }
});

// === Books Carousels (Multiple) ===
document.querySelectorAll('.books-carousel').forEach(carousel => {
    const slides = carousel.querySelector('.books-slides');
    const items = carousel.querySelectorAll('.book');
    const prevBtn = carousel.querySelector('.books-prev');
    const nextBtn = carousel.querySelector('.books-next');

    const visibleCount = 5;
    const slideCount = items.length;
    let currentIndex = 0;

    function showSlide(index) {
        if (index >= slideCount - visibleCount + 1) currentIndex = 0;
        else if (index < 0) currentIndex = Math.max(0, slideCount - visibleCount);
        else currentIndex = index;

        slides.style.transform = `translateX(-${currentIndex * (100 / visibleCount)}%)`;
    }

    prevBtn.addEventListener('click', () => {
        showSlide(currentIndex - 1);
    });
    nextBtn.addEventListener('click', () => {
        showSlide(currentIndex + 1);
    });

    // Swipe support for each carousel
    let touchStartX = 0;
    slides.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    slides.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            showSlide(currentIndex + 1);
        } else if (touchEndX - touchStartX > 50) {
            showSlide(currentIndex - 1);
        }
    });
});


// Swipe support
let booksTouchStartX = 0;
booksSlides.addEventListener('touchstart', (e) => {
    booksTouchStartX = e.changedTouches[0].screenX;
});
booksSlides.addEventListener('touchend', (e) => {
    const booksTouchEndX = e.changedTouches[0].screenX;
    if (booksTouchStartX - booksTouchEndX > 50) {
        showBooksSlide(booksCurrentSlide + 1); 
    } else if (booksTouchEndX - booksTouchStartX > 50) {
        showBooksSlide(booksCurrentSlide - 1); 
    }
});
