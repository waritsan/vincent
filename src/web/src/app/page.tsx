'use client';

import BlogPosts from './components/BlogPosts';
import AIChat from './components/AIChat';
import { useLanguage } from './contexts/LanguageContext';
import { useSearch } from './contexts/SearchContext';

export default function Home() {
  const { t } = useLanguage();
  const { searchQuery } = useSearch();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Promoted Content - Featured Video */}
      <section className="bg-gradient-to-b from-gray-900 to-black text-white py-8 sm:py-12 md:py-16">
        <div className="px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
                เนื้อหาแนะนำ
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {t('hero.title')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src="https://www.youtube.com/embed/N_Rdn8PdqMg?autoplay=0&rel=0"
                  title="Promoted Content"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </div>

            {/* Content Description */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                  {t('hero.subtitle')}
                </h3>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                  {t('hero.description')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-6 py-3 rounded-sm font-semibold transition-colors text-center">
                  เรียนรู้เพิ่มเติม
                </button>
                <button className="border-2 border-white hover:bg-white hover:text-gray-900 text-white px-6 py-3 rounded-sm font-semibold transition-colors text-center">
                  ดูวิดีโอทั้งหมด
                </button>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>แนะนำสำหรับคุณ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>อัพเดทล่าสุด</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 md:py-16 bg-white dark:bg-gray-900">
        <div className="px-4 sm:px-6 w-full">
          <BlogPosts searchQuery={searchQuery} excludeTag="สวัสดิการ" sectionTitle={t('blog.latestNews')} />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50 dark:bg-gray-800">
        <div className="px-4 sm:px-6 w-full">
          <BlogPosts searchQuery={searchQuery} tagFilter="สวัสดิการ" sectionTitle={t('benefits.title')} />
        </div>
      </section>

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
}
