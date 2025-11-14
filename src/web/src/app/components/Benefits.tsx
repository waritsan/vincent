'use client';

import { useState } from 'react';

interface Benefit {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  link?: string;
}

export default function Benefits() {
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  // Sample benefits data
  const benefits: Benefit[] = [
    {
      id: '1',
      title: 'สิทธิสุขภาพถ้วนหน้า',
      description: 'รับการรักษาพยาบาลฟรีที่โรงพยาบาลรัฐทุกแห่งทั่วประเทศ พร้อมบริการตรวจสุขภาพประจำปี',
      category: 'สุขภาพ',
      icon: '🏥',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '2',
      title: 'เงินอุดหนุนเด็กแรกเกิด',
      description: 'รับเงินสนับสนุนสำหรับเด็กแรกเกิดถึง 6 ปี เพื่อพัฒนาการที่ดีของลูกน้อย',
      category: 'ครอบครัว',
      icon: '👶',
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: '3',
      title: 'ทุนการศึกษา',
      description: 'ทุนการศึกษาตั้งแต่ระดับอนุบาลจนถึงมหาวิทยาลัย สนับสนุนค่าเล่าเรียนและค่าใช้จ่าย',
      category: 'การศึกษา',
      icon: '📚',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: '4',
      title: 'เบี้ยยังชีพผู้สูงอายุ',
      description: 'เงินสนับสนุนรายเดือนสำหรับผู้สูงอายุ 60 ปีขึ้นไป เพิ่มขึ้นตามอายุ',
      category: 'ผู้สูงอายุ',
      icon: '👴',
      color: 'from-orange-500 to-amber-500'
    },
    {
      id: '5',
      title: 'สินเชื่อที่อยู่อาศัย',
      description: 'สินเชื่อดอกเบี้ยต่ำสำหรับการซื้อบ้านหรือที่อยู่อาศัย พร้อมเงื่อนไขพิเศษ',
      category: 'ที่อยู่อาศัย',
      icon: '🏠',
      color: 'from-purple-500 to-violet-500'
    },
    {
      id: '6',
      title: 'ประกันสังคม',
      description: 'คุ้มครองการเจ็บป่วย ทุพพลภาพ และชราภาพ พร้อมสิทธิประโยชน์มากมาย',
      category: 'สวัสดิการ',
      icon: '🛡️',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      id: '7',
      title: 'เงินช่วยเหลือผู้พิการ',
      description: 'เบี้ยความพิการรายเดือน พร้อมสิทธิพิเศษด้านการเดินทางและบริการต่างๆ',
      category: 'ผู้พิการ',
      icon: '♿',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: '8',
      title: 'กองทุนหมู่บ้าน',
      description: 'สินเชื่อดอกเบี้ยต่ำสำหรับประกอบอาชีพ พัฒนาธุรกิจชุมชน',
      category: 'อาชีพ',
      icon: '💼',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  // Helper function to scroll carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    const carousel = document.getElementById('benefits-carousel');
    if (carousel) {
      const scrollAmount = carousel.offsetWidth * 0.8;
      const newScrollPos = direction === 'left'
        ? carousel.scrollLeft - scrollAmount
        : carousel.scrollLeft + scrollAmount;

      carousel.scrollTo({
        left: newScrollPos,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* Benefits Carousel */}
      <div className="relative group/row">
        {/* Carousel Title */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            สิทธิประโยชน์สำหรับคุณ
          </h2>
          <button className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base font-semibold">
            <span>ดูทั้งหมด</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-gradient-to-r from-white dark:from-gray-900 to-transparent opacity-0 group-hover/row:opacity-100 hover:from-white/95 dark:hover:from-gray-900/95 transition-opacity duration-300 flex items-center justify-start pl-2"
            aria-label="Scroll left"
          >
            <svg className="w-8 h-8 text-gray-900 dark:text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-gradient-to-l from-white dark:from-gray-900 to-transparent opacity-0 group-hover/row:opacity-100 hover:from-white/95 dark:hover:from-gray-900/95 transition-opacity duration-300 flex items-center justify-end pr-2"
            aria-label="Scroll right"
          >
            <svg className="w-8 h-8 text-gray-900 dark:text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scrollable Row */}
          <div
            id="benefits-carousel"
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {benefits.map((benefit) => (
              <article
                key={benefit.id}
                onClick={() => setSelectedBenefit(benefit)}
                className="flex-none w-[280px] sm:w-[320px] lg:w-[380px] cursor-pointer snap-start group/card"
              >
                {/* Card with gradient background */}
                <div className={`relative h-48 mb-3 overflow-hidden rounded-lg bg-gradient-to-br ${benefit.color} transition-transform duration-300 group-hover/card:scale-105 shadow-lg`}>
                  <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors"></div>

                  {/* Icon */}
                  <div className="absolute top-4 left-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                      {benefit.icon}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 text-gray-900 text-xs font-semibold rounded-full">
                      {benefit.category}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
                      {benefit.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {benefit.description}
                  </p>

                  <button className="text-[#0066CC] hover:text-[#0052A3] text-sm font-semibold flex items-center gap-1 transition-colors">
                    <span>เรียนรู้เพิ่มเติม</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Benefit Detail Modal */}
      {selectedBenefit && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-0 sm:p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedBenefit(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 sm:rounded-lg max-w-2xl w-full my-0 sm:my-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedBenefit(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center transition-colors z-20 shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header with gradient */}
            <div className={`relative h-48 sm:rounded-t-lg overflow-hidden bg-gradient-to-br ${selectedBenefit.color}`}>
              <div className="absolute inset-0 bg-black/20"></div>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl mb-4">
                  {selectedBenefit.icon}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-center">
                  {selectedBenefit.title}
                </h2>
                <span className="mt-2 px-4 py-1 bg-white/90 text-gray-900 text-sm font-semibold rounded-full">
                  {selectedBenefit.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  {selectedBenefit.description}
                </p>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    วิธีการสมัคร
                  </h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>📋 เตรียมเอกสารประกอบการสมัคร</li>
                    <li>🏢 ยื่นคำขอที่หน่วยงานที่เกี่ยวข้อง</li>
                    <li>✅ รอการตรวจสอบและอนุมัติ</li>
                    <li>💰 เริ่มรับสิทธิประโยชน์</li>
                  </ul>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 bg-[#0066CC] hover:bg-[#0052A3] text-white px-6 py-3 rounded-sm font-semibold transition-colors">
                    สมัครเลย
                  </button>
                  <button className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-[#0066CC] text-gray-700 dark:text-gray-300 hover:text-[#0066CC] px-6 py-3 rounded-sm font-semibold transition-colors">
                    ดูรายละเอียดเพิ่มเติม
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
