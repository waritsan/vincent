'use client';

import { useState } from 'react';
import BlogPosts from './components/BlogPosts';
import AIChat from './components/AIChat';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* TED-style Navigation */}
      <nav className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center flex-shrink-0">
                <Image
                  src="/theglobe-logo.jpg"
                  alt="The Globe"
                  width={48}
                  height={48}
                  className="rounded-sm"
                />
              </Link>
              <div className="hidden md:flex space-x-6 text-sm font-medium">
                <a href="#" className="hover:text-[#0066CC] transition-colors">สิทธิประโยชน์</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">บริการ</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">สิทธิของคุณ</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">ขอความช่วยเหลือ</a>
              </div>
            </div>
            
            {/* Search Bar in Navbar */}
            <div className="hidden lg:flex flex-1 max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาโพสต์..."
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

            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-sm hover:text-[#0066CC] transition-colors font-medium hidden sm:block">
                ผู้ดูแลระบบ
              </Link>
              <button className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-4 sm:px-6 py-2 rounded-sm text-sm font-semibold transition-colors">
                บัญชีของฉัน
              </button>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <div className="lg:hidden mt-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="ค้นหาโพสต์..."
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
              สิทธิของเรา สวัสดิการของเรา
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              ค้นพบสิทธิประโยชน์ที่คุณมีและบริการสำคัญที่เราพร้อมสนับสนุนคุณ
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 max-w-7xl">
          <BlogPosts searchQuery={searchQuery} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">เกี่ยวกับเรา</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">เราคือใคร</a></li>
                <li><a href="#" className="hover:text-white transition-colors">เราช่วยเหลืออย่างไร</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ความมุ่งมั่นของเรา</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">สิทธิประโยชน์ของคุณ</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">การสนับสนุนที่มีให้</a></li>
                <li><a href="#" className="hover:text-white transition-colors">สมัครออนไลน์</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ตรวจสอบคุณสมบัติ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">ต้องการความช่วยเหลือ?</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">ติดต่อเรา</a></li>
                <li><a href="#" className="hover:text-white transition-colors">คำถามที่พบบ่อย</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ส่งความคิดเห็น</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">ติดตามเรา</h3>
              <p className="text-sm text-gray-400">แหล่งข้อมูลที่เชื่อถือได้เกี่ยวกับสิทธิและสวัสดิการของคุณ</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-gray-400 text-center">
            <p>&copy; 2025 เดอะโกลบ. อยู่เคียงข้างคุณ สนับสนุนสิทธิและสวัสดิการของคุณ</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
}
