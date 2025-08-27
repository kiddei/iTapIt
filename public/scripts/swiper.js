const slides = document.querySelectorAll('.swiper-slide');
let currentSlide = Math.floor(slides.length / 2); // ✅ now slides exists

const wrapper = document.getElementById('swiperWrapper');
const dots = document.querySelectorAll('.pagination-dot');

function updateSlides() {
  // Get current viewport width for responsive calculations
  const viewportWidth = window.innerWidth;
  const containerWidth = wrapper.parentElement.offsetWidth;
  
  // Responsive slide dimensions - dynamically calculated
  const dimensions = getDynamicDimensions(viewportWidth);
  
  slides.forEach((slide, index) => {
    const card = slide.querySelector('.photo-card');
    
    // Remove all existing classes
    slide.classList.remove('active');
    card.classList.remove('distance-1', 'distance-2', 'distance-3', 'distance-far');
    
    // Calculate distance from current active slide
    const distanceFromCenter = Math.abs(index - currentSlide);
    
    // Apply dynamic styling based on distance
    const slideConfig = getSlideConfiguration(distanceFromCenter, dimensions);
    
    if (index === currentSlide) {
      slide.classList.add('active');
    }
    
    // Apply styles
    card.style.height = slideConfig.height;
    card.style.width = slideConfig.width;
    card.style.opacity = slideConfig.opacity;
    card.style.transform = slideConfig.transform;
    card.style.zIndex = slideConfig.zIndex;
    
    // Set hover scale CSS variable for adjacent slides
    if (distanceFromCenter === 1) {
      slide.style.setProperty('--hover-scale', '0.95');
      card.classList.add('distance-1');
    } else if (distanceFromCenter === 2) {
      slide.style.setProperty('--hover-scale', '0.85');
      card.classList.add('distance-2');
    } else if (distanceFromCenter === 3) {
      slide.style.setProperty('--hover-scale', '0.75');
      card.classList.add('distance-3');
    } else if (distanceFromCenter > 3) {
      slide.style.setProperty('--hover-scale', '0.65');
      card.classList.add('distance-far');
    }
  });
  
  // Dynamic centering calculation - works for any number of slides
  const translation = calculateOptimalTranslation(containerWidth, dimensions);
  wrapper.style.transform = `translateX(${translation}px)`;
  
  // Update navigation button states
  updateNavigationStates();
  
dots.forEach((dot, index) => {
  dot.classList.toggle('active', index === currentSlide % dots.length);
});

}

// Update navigation button states based on available slides
function updateNavigationStates() {
  const prevButton = document.querySelector('.swiper-prev');
  const nextButton = document.querySelector('.swiper-next');
  
  // Update previous button
  if (currentSlide > 0) {
    prevButton.classList.remove('disabled');
    prevButton.classList.add('has-prev');
  } else {
    prevButton.classList.add('disabled');
    prevButton.classList.remove('has-prev');
  }
  
  // Update next button
  if (currentSlide < slides.length - 1) {
    nextButton.classList.remove('disabled');
    nextButton.classList.add('has-next');
  } else {
    nextButton.classList.add('disabled');
    nextButton.classList.remove('has-next');
  }
}

// Dynamic dimensions based on screen size with improved safe zones
function getDynamicDimensions(viewportWidth) {
  if (viewportWidth <= 375) {
    return {
      active: { width: 240, height: 320, scale: 1.0 },
      distance1: { width: 170, height: 220, scale: 0.9 },
      distance2: { width: 140, height: 190, scale: 0.8 },
      distance3: { width: 120, height: 160, scale: 0.7 },
      gap: 12,
      safeZone: 50 
    };
  } else if (viewportWidth <= 576) {
    return {
      active: { width: 260, height: 350, scale: 1.02 },
      distance1: { width: 190, height: 250, scale: 0.9 },
      distance2: { width: 160, height: 210, scale: 0.8 },
      distance3: { width: 130, height: 180, scale: 0.7 },
      gap: 12,
      safeZone: 60 
    };
  } else if (viewportWidth <= 768) {
    return {
      active: { width: 300, height: 400, scale: 1.05 },
      distance1: { width: 220, height: 280, scale: 0.9 },
      distance2: { width: 180, height: 240, scale: 0.8 },
      distance3: { width: 150, height: 200, scale: 0.7 },
      gap: 15,
      safeZone: 70 
    };
  } else {
    return {
      active: { width: 380, height: 500, scale: 1.1 },
      distance1: { width: 280, height: 320, scale: 0.9 },
      distance2: { width: 240, height: 280, scale: 0.8 },
      distance3: { width: 200, height: 240, scale: 0.7 },
      gap: 20,
      safeZone: 90 
    };
  }
}

// Get slide configuration based on distance
function getSlideConfiguration(distance, dimensions) {
  const configs = [
    {
      height: `${dimensions.active.height}px`,
      width: `${dimensions.active.width}px`,
      opacity: '1',
      transform: `scale(${dimensions.active.scale})`,
      zIndex: '10'
    },
    {
      height: `${dimensions.distance1.height}px`,
      width: `${dimensions.distance1.width}px`,
      opacity: '0.75',
      transform: `scale(${dimensions.distance1.scale})`,
      zIndex: '5'
    },
    {
      height: `${dimensions.distance2.height}px`,
      width: `${dimensions.distance2.width}px`,
      opacity: '0.6',
      transform: `scale(${dimensions.distance2.scale})`,
      zIndex: '3'
    },
    {
      height: `${dimensions.distance3.height}px`,
      width: `${dimensions.distance3.width}px`,
      opacity: '0.4',
      transform: `scale(${dimensions.distance3.scale})`,
      zIndex: '2'
    }
  ];
  
  return configs[Math.min(distance, configs.length - 1)];
}

// Calculate optimal translation with consistent safe zones
function calculateOptimalTranslation(containerWidth, dimensions) {
  // Use consistent safe zones from dimensions
  const safeZone = dimensions.safeZone;
  
  // Effective centering area (excluding consistent safe zones)
  const effectiveCenteringArea = containerWidth - (safeZone * 2);
  const adjustedCenter = safeZone + (effectiveCenteringArea / 2);
  
  // Calculate accumulated width from start to center of active slide
  let accumulatedWidth = 0;
  
  for (let i = 0; i < slides.length; i++) {
    let slideWidth;
    const distance = Math.abs(i - currentSlide);
    
    if (distance === 0) {
      slideWidth = dimensions.active.width;
    } else if (distance === 1) {
      slideWidth = dimensions.distance1.width;
    } else if (distance === 2) {
      slideWidth = dimensions.distance2.width;
    } else {
      slideWidth = dimensions.distance3.width;
    }
    
    if (i < currentSlide) {
      accumulatedWidth += slideWidth + dimensions.gap;
    } else if (i === currentSlide) {
      accumulatedWidth += slideWidth / 2;
      break;
    }
  }
  
  // Calculate ideal translation maintaining consistent safe zones
  let translation = adjustedCenter - accumulatedWidth;
  
  // Calculate total carousel width for boundary constraints
  const totalCarouselWidth = getTotalCarouselWidth(dimensions);
  
  // Consistent boundary constraints
  const maxTranslation = safeZone; 
  const minTranslation = containerWidth - totalCarouselWidth - safeZone; 
  
  // Apply consistent boundaries for all slides
  if (translation > maxTranslation) {
    translation = maxTranslation;
  } else if (translation < minTranslation) {
    translation = minTranslation;
  }
  
  return translation;
}

function getTotalCarouselWidth(dimensions) {
  let totalWidth = 0;
  
  for (let i = 0; i < slides.length; i++) {
    const distance = Math.abs(i - currentSlide);
    let slideWidth;
    
    if (distance === 0) {
      slideWidth = dimensions.active.width;
    } else if (distance === 1) {
      slideWidth = dimensions.distance1.width;
    } else if (distance === 2) {
      slideWidth = dimensions.distance2.width;
    } else {
      slideWidth = dimensions.distance3.width;
    }
    
    totalWidth += slideWidth;
    if (i < slides.length - 1) {
      totalWidth += dimensions.gap;
    }
  }
  
  return totalWidth;
}

document.querySelector('.swiper-prev').addEventListener('click', (e) => {
  e.preventDefault();
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateSlides();
});

document.querySelector('.swiper-next').addEventListener('click', (e) => {
  e.preventDefault();
  currentSlide = (currentSlide + 1) % slides.length;
  updateSlides();
});


dots.forEach((dot, index) => {
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    // Ensure we don't go beyond available slides
    if (index < slides.length) {
      currentSlide = index;
      updateSlides();
    }
  });
});

// Enhanced slide click navigation with preview capability
slides.forEach((slide, index) => {
  slide.addEventListener('click', (e) => {
    e.preventDefault();
    if (index !== currentSlide && index < slides.length) {
      currentSlide = index;
      updateSlides();
    }
  });
  
  // Add hover effects for better navigation preview
  slide.addEventListener('mouseenter', () => {
    if (index !== currentSlide) {
      const card = slide.querySelector('.photo-card');
      // Use the hover scale set in updateSlides
      const hoverScale = slide.style.getPropertyValue('--hover-scale') || '1.05';
      const currentTransform = card.style.transform;
      const newTransform = currentTransform.replace(/scale\([^)]*\)/, `scale(${hoverScale})`);
      card.style.transform = newTransform;
      card.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
    }
  });
  
  slide.addEventListener('mouseleave', () => {
    if (index !== currentSlide) {
      // Reset to original styling
      const distanceFromCenter = Math.abs(index - currentSlide);
      const viewportWidth = window.innerWidth;
      const dimensions = getDynamicDimensions(viewportWidth);
      const slideConfig = getSlideConfiguration(distanceFromCenter, dimensions);
      
      const card = slide.querySelector('.photo-card');
      card.style.transform = slideConfig.transform;
      card.style.boxShadow = ''; // Reset to CSS default
    }
  });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlides();
  } else if (e.key === 'ArrowRight') {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlides();
  }
});
// Auto-play with pause on hover (optional)
let autoPlayInterval;
const startAutoPlay = () => {
  autoPlayInterval = setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlides();
  }, 5000);
};

const stopAutoPlay = () => {
  clearInterval(autoPlayInterval);
};

// Uncomment these lines if you want auto-play
// startAutoPlay();
// wrapper.parentElement.addEventListener('mouseenter', stopAutoPlay);
// wrapper.parentElement.addEventListener('mouseleave', startAutoPlay);

// --- Swipe support for mobile ---
let touchStartX = 0;
let touchEndX = 0;

wrapper.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});

wrapper.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].clientX;
  handleSwipeGesture();
});


// swipe
function handleSwipeGesture() {
  const swipeThreshold = 50; 
  const swipeDistance = touchEndX - touchStartX;

  if (Math.abs(swipeDistance) > swipeThreshold) {
    if (swipeDistance > 0) {
      // swipe right → previous
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    } else {
      // swipe left → next
      currentSlide = (currentSlide + 1) % slides.length;
    }
    updateSlides();
  }
}

// Initialize with better starting position
updateSlides();

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateSlides, 150);
});

// Add smooth scrolling behavior
wrapper.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';