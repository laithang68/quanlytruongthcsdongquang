'use client';

import { useState, useEffect, useRef } from 'react';

const slides = [
  {
    id: 1,
    src: '/images/slide-1.jpg',
    alt: 'Banner Trường THCS Đông Quang - Slide 1',
  },
  {
    id: 2,
    src: '/images/slide-2.jpg',
    alt: 'Banner Trường THCS Đông Quang - Slide 2',
  },
  {
    id: 3,
    src: '/images/slide-3.jpg',
    alt: 'Banner Trường THCS Đông Quang - Slide 3',
  },
];

export default function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5500);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    resetTimer();
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    resetTimer();
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    resetTimer();
  };

  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2 mt-0 mb-6 sm:mb-8">
      <section
        onMouseEnter={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onMouseLeave={() => {
          resetTimer();
        }}
        className="relative w-full overflow-hidden select-none bg-slate-950 shadow-2xl"
      >
        <div className="w-full aspect-[16/9] overflow-hidden">
          <div
            className="flex w-full h-full transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="relative w-full h-full flex-shrink-0"
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>


        {/* 2. PREVIOUS CONTROL BUTTON */}
        <button
          onClick={goToPrev}
          aria-label="Slide trước"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 transition-all duration-300 shadow-xl flex items-center justify-center font-bold text-lg sm:text-xl hover:scale-110 active:scale-95"
        >
          ❮
        </button>

        {/* 3. NEXT CONTROL BUTTON */}
        <button
          onClick={goToNext}
          aria-label="Slide tiếp theo"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 transition-all duration-300 shadow-xl flex items-center justify-center font-bold text-lg sm:text-xl hover:scale-110 active:scale-95"
        >
          ❯
        </button>

        {/* 4. INDICATOR DOTS */}
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-slate-950/60 backdrop-blur-md px-3.5 sm:px-5 py-1.5 rounded-full border border-white/15 shadow-xl">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              aria-label={`Chuyển đến Slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${currentIndex === index
                ? 'w-4 sm:w-8 h-2 sm:h-2.5 bg-orange-500 shadow-md ring-2 ring-orange-300/50'
                : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white'
                }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
