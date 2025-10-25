'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { useSearch } from '../contexts/SearchContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { searchQuery, setSearchQuery } = useSearch();
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Normalize paths by removing trailing slashes for comparison
    const normalizedPathname = pathname.replace(/\/$/, '');
    const normalizedPath = path.replace(/\/$/, '');
    return normalizedPathname === normalizedPath;
  };

  return (
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
              <Link 
                href="/posts" 
                className={`transition-colors ${isActive('/posts') ? 'text-[#0066CC]' : 'hover:text-[#0066CC]'}`}
              >
                {t('nav.news')}
              </Link>
              <Link 
                href="/benefits" 
                className={`transition-colors ${isActive('/benefits') ? 'text-[#0066CC]' : 'hover:text-[#0066CC]'}`}
              >
                {t('nav.benefits')}
              </Link>
              <Link href="#" className="hover:text-[#0066CC] transition-colors">{t('nav.laws')}</Link>
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
                className="block w-full pl-10 pr-4 py-2 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                placeholder={t('nav.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
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
          <LanguageToggle />
          <button className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors whitespace-nowrap">
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
            <Link 
              href="/posts" 
              className={`text-sm font-medium py-1 transition-colors ${isActive('/posts') ? 'text-[#0066CC]' : 'hover:text-[#0066CC]'}`}
            >
              {t('nav.news')}
            </Link>
            <Link 
              href="/benefits" 
              className={`text-sm font-medium py-1 transition-colors ${isActive('/benefits') ? 'text-[#0066CC]' : 'hover:text-[#0066CC]'}`}
            >
              {t('nav.benefits')}
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-[#0066CC] transition-colors py-1">
              {t('nav.services')}
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-[#0066CC] transition-colors py-1">
              {t('nav.getHelp')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
