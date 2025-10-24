'use client';

import { useState } from 'react';
import BlogPosts from './components/BlogPosts';
import AIChat from './components/AIChat';
import LanguageToggle from './components/LanguageToggle';
import { useLanguage } from './contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* TED-style Navigation */}
      <nav className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm">
  <div className="px-4 sm:px-6 py-3 sm:py-4 w-full">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between">
            {/* Left: Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <Image
                src="/theglobe-logo.jpg"
                alt="The Globe"
                width={40}
                height={40}
                className="rounded-sm"
              />
            </Link>

            {/* Right: Language Toggle & Account Button */}
            <div className="flex items-center space-x-2">
              <button className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors whitespace-nowrap">
                {t('nav.myAccount')}
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between gap-2 sm:gap-6">
            <div className="flex items-center space-x-4 sm:space-x-8 flex-1 min-w-0">
              <Link href="/" className="flex items-center flex-shrink-0">
                <Image
                  src="/theglobe-logo.jpg"
                  alt="The Globe"
                  width={48}
                  height={48}
                  className="rounded-sm"
                />
              </Link>
              <div className="flex space-x-6 text-sm font-medium">
                <a href="#" className="hover:text-[#0066CC] transition-colors">{t('nav.news')}</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">{t('nav.benefits')}</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">{t('nav.laws')}</a>
              </div>
            </div>

            {/* Search Bar in Navbar - Desktop Only */}
            <div className="flex flex-1 max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('nav.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC] dark:bg-gray-700 dark:text-white placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
              <button className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-6 py-2 rounded-sm text-sm font-semibold transition-colors whitespace-nowrap">
                {t('nav.myAccount')}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              {/* Search Bar Inside Mobile Menu */}
              <div className="mb-4">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t('nav.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC] dark:bg-gray-700 dark:text-white placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col space-y-3">
                <a href="#" className="text-sm font-medium hover:text-[#0066CC] transition-colors py-1">
                  {t('nav.benefits')}
                </a>
                <a href="#" className="text-sm font-medium hover:text-[#0066CC] transition-colors py-1">
                  {t('nav.services')}
                </a>
                <a href="#" className="text-sm font-medium hover:text-[#0066CC] transition-colors py-1">
                  {t('nav.getHelp')}
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

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

      {/* Footer */}
      <footer className="bg-black text-white py-8 sm:py-12">
  <div className="px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.aboutUs')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.ourMission')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.ourTeam')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.careers')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.yourBenefits')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.healthcare')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.education')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.housing')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.needHelp')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.contactUs')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.faq')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.support')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.aboutUs')}</h3>
              <p className="text-sm text-gray-400">{t('hero.description')}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-gray-400">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-center sm:text-left">{t('footer.copyright')}</p>
              <div className="flex items-center gap-4">
                <Link href="/admin" className="hover:text-white transition-colors">
                  {t('nav.admin')}
                </Link>
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
}
