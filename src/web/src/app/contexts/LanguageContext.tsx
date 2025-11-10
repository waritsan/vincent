'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'th' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    th: {
        // Navigation
        'nav.benefits': 'สวัสดิการ',
        'nav.services': 'บริการ',
        'nav.yourRights': 'สิทธิของเรา',
        'nav.getHelp': 'ขอความช่วยเหลือ',
        'nav.admin': 'ผู้ดูแลระบบ',
        'nav.myAccount': 'บัญชีของฉัน',
        'nav.searchPlaceholder': 'ค้นหาโพสต์...',
        'nav.news': 'ข่าวสาร',
        'nav.laws': 'กฎหมาย',

        // Hero Section
        'hero.title': 'ช็อตฟีล STORY',
        'hero.subtitle': 'เรื่องราวที่คุณควรรู้',
        'hero.description': 'ค้นพบเรื่องราวที่น่าสนใจที่เราคัดสรรมาเพื่อคุณ',

        // Footer
        'footer.aboutUs': 'เกี่ยวกับเรา',
        'footer.ourMission': 'ภารกิจของเรา',
        'footer.ourTeam': 'ทีมของเรา',
        'footer.careers': 'ร่วมงานกับเรา',
        'footer.yourBenefits': 'สิทธิประโยชน์ของคุณ',
        'footer.healthcare': 'สุขภาพ',
        'footer.education': 'การศึกษา',
        'footer.housing': 'ที่อยู่อาศัย',
        'footer.needHelp': 'ต้องการความช่วยเหลือ?',
        'footer.contactUs': 'ติดต่อเรา',
        'footer.faq': 'คำถามที่พบบ่อย',
        'footer.support': 'สนับสนุน',
        'footer.copyright': '© 2025 The GLOBE. อยู่เคียงข้างคุณ สนับสนุนสิทธิและสวัสดิการของคุณ',

        // AI Chat
        'chat.title': 'ผู้ช่วยของคุณ',
        'chat.statusReady': 'เราพร้อมช่วยเหลือคุณ',
        'chat.statusAvailable': 'ถามเราได้ทุกเรื่อง ทุกเวลา',
        'chat.welcome': 'สวัสดีค่ะ! ฉันพร้อมช่วยคุณทำความเข้าใจสิทธิของคุณ สำรวจสวัสดิการ และหาการสนับสนุนที่คุณต้องการ มาเริ่มกันเลยค่ะ—ฉันยินดีช่วยเหลือตลอดเวลา! 🌟',
        'chat.inputPlaceholder': 'พิมพ์ข้อความของคุณ...',

        // Blog Posts
        'blog.error': 'ไม่สามารถโหลดข้อมูลได้',
        'blog.tryAgain': 'ลองอีกครั้ง',
        'blog.title': 'ข่าวสารใหม่สำหรับคุณ',
        'blog.refresh': 'รีเฟรช',
        'blog.noResults': 'ไม่พบโพสต์',
        'blog.noResultsDesc': 'เราไม่พบโพสต์ที่ตรงกับ',
        'blog.clearSearch': 'ล้างการค้นหาในแถบนำทางเพื่อดูโพสต์ทั้งหมด',
        'blog.emptyState': 'ยังไม่มีข้อมูลในขณะนี้ กรุณาตรวจสอบอีกครั้งในภายหลัง!',
        'blog.filterByTag': 'กรองตามแท็ก',
        'blog.allTags': 'ทั้งหมด',
        'blog.latestNews': 'ข่าวสารล่าสุด',
        'blog.allNews': 'ข่าวสารทั้งหมด',
        'filter.show': 'แสดง',
        'filter.allPosts': 'ข่าวสารทั้งหมด',
        'filter.government': 'หน่วยงานรัฐบาล',
        'filter.filterBy': 'กรองตาม',
        'filter.filteredBy': 'กรองตาม',
        'filter.clearAll': 'ล้างทั้งหมด',
        'filter.all': 'ทั้งหมด',
        'filter.allNews': 'ข่าวสารทั้งหมด',
        'benefits.title': 'สิทธิประโยชน์และสวัสดิการ',
        'benefits.subtitle': 'สิทธิประโยชน์ที่คุณควรรู้',

        // Dashboard
        'dashboard.loading': 'กำลังโหลดแดชบอร์ด...',
        'dashboard.error': 'ข้อผิดพลาด',
        'dashboard.sorryCouldNotGenerateChart': 'ขออภัย ฉันไม่สามารถสร้างกราฟได้ ข้อผิดพลาด',
        'dashboard.title': 'แดชบอร์ดบริษัท',
        'dashboard.subtitle': 'ข้อมูลเชิงลึกจากบริษัทที่ถูกดึงข้อมูล {count} แห่ง',
        'dashboard.totalCompanies': 'จำนวนบริษัททั้งหมด',
        'dashboard.locations': 'สถานที่ตั้ง',
        'dashboard.withValuation': 'มีมูลค่าทรัพย์สิน',
        'dashboard.companyLocationsDistribution': 'การกระจายสถานที่ตั้งบริษัท',
        'dashboard.topCompanyValuations': 'มูลค่าบริษัทสูงสุด ({count} บริษัท)',
        'dashboard.companyLocationsMap': 'แผนที่สถานที่ตั้งบริษัท',
        'dashboard.askForCustomCharts': 'ขอกราฟแบบกำหนดเอง',
        'dashboard.generateChart': 'สร้างกราฟ',
        'dashboard.chartPromptPlaceholder': 'ลอง: "บริษัทในกรุงเทพที่มีมูลค่าเกิน 100 ล้านบาท"',
        'dashboard.chartExamples': 'ตัวอย่าง: "บริษัทในกรุงเทพที่มีมูลค่าเกิน 100 ล้านบาท", "แสดงบริษัท 5 อันดับแรกจากเชียงใหม่", "บริษัทที่มีมูลค่าต่ำกว่า 50 ล้านที่สร้างในปีนี้", "แผนภูมิวงกลมของสถานที่ตั้ง"',
        'dashboard.aiAnalysis': 'การวิเคราะห์ AI:',
        'dashboard.location': 'สถานที่ตั้ง',
        'dashboard.valuation': 'มูลค่าทรัพย์สิน',
    },
    en: {
        // Navigation
        'nav.benefits': 'Benefits',
        'nav.services': 'Services',
        'nav.yourRights': 'Your Rights',
        'nav.getHelp': 'Get Help',
        'nav.admin': 'Admin',
        'nav.myAccount': 'My Account',
        'nav.searchPlaceholder': 'Search posts...',
        'nav.news': 'News',
        'nav.laws': 'Laws',

        // Hero Section
        'hero.title': 'SHOTFEEL STORY',
        'hero.subtitle': 'Stories You Should Know',
        'hero.description': 'Discover the stories curated just for you that will make you feel empowered.',

        // Footer
        'footer.aboutUs': 'About Us',
        'footer.ourMission': 'Our Mission',
        'footer.ourTeam': 'Our Team',
        'footer.careers': 'Careers',
        'footer.yourBenefits': 'Your Benefits',
        'footer.healthcare': 'Healthcare',
        'footer.education': 'Education',
        'footer.housing': 'Housing',
        'footer.needHelp': 'Need Help?',
        'footer.contactUs': 'Contact Us',
        'footer.faq': 'FAQ',
        'footer.support': 'Support',
        'footer.copyright': '© 2025 The GLOBE. Standing by you, supporting your rights and benefits.',

        // AI Chat
        'chat.title': 'Your Support Assistant',
        'chat.statusReady': 'We\'re here for you',
        'chat.statusAvailable': 'Ask us anything, anytime',
        'chat.welcome': 'Hi there! I\'m here to help you understand your rights, explore your benefits, and find the support you need. Let\'s get started—I\'m ready to assist you every step of the way! 🌟',
        'chat.inputPlaceholder': 'Type your message...',

        // Blog Posts
        'blog.error': 'We couldn\'t load the updates',
        'blog.tryAgain': 'Try Again',
        'blog.title': 'What\'s New For You',
        'blog.refresh': 'Refresh',
        'blog.noResults': 'No Posts Found',
        'blog.noResultsDesc': 'We couldn\'t find any posts matching',
        'blog.clearSearch': 'Clear your search in the navigation bar to see all posts.',
        'blog.emptyState': 'No updates available right now. Please check back later!',
        'blog.filterByTag': 'Filter by tag',
        'blog.allTags': 'All',
        'blog.latestNews': 'Latest News',
        'blog.allNews': 'All News',
        'filter.show': 'Show',
        'filter.allPosts': 'All Posts',
        'filter.government': 'Government Agencies',
        'filter.filterBy': 'Filter by',
        'filter.filteredBy': 'Filtered by',
        'filter.clearAll': 'Clear All',
        'filter.all': 'All',
        'filter.allNews': 'All News',
        'benefits.title': 'Benefits & Welfare',
        'benefits.subtitle': 'Benefits You Should Know',

        // Dashboard
        'dashboard.loading': 'Loading dashboard...',
        'dashboard.error': 'Error',
        'dashboard.sorryCouldNotGenerateChart': 'Sorry, I couldn\'t generate that chart. Error',
        'dashboard.title': 'Company Dashboard',
        'dashboard.subtitle': 'Insights from {count} extracted companies',
        'dashboard.totalCompanies': 'Total Companies',
        'dashboard.locations': 'Locations',
        'dashboard.withValuation': 'With Valuation',
        'dashboard.companyLocationsDistribution': 'Company Locations Distribution',
        'dashboard.topCompanyValuations': 'Top Company Valuations ({count} companies)',
        'dashboard.companyLocationsMap': 'Company Locations Map',
        'dashboard.askForCustomCharts': 'Ask for Custom Charts',
        'dashboard.generateChart': 'Generate Chart',
        'dashboard.chartPromptPlaceholder': 'Try: "companies in Bangkok with valuations over 100 million baht"',
        'dashboard.chartExamples': 'Examples: "companies in Bangkok with valuations over 100 million baht", "show top 5 companies from Chiang Mai", "companies under 50 million created this year", "pie chart of locations"',
        'dashboard.aiAnalysis': 'AI Analysis:',
        'dashboard.location': 'Location',
        'dashboard.valuation': 'Valuation',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('th');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load language from localStorage on mount, default to Thai
        const savedLang = localStorage.getItem('language') as Language | null;
        if (savedLang && (savedLang === 'th' || savedLang === 'en')) {
            setLanguageState(savedLang);
        } else {
            // Set Thai as default if no saved preference
            setLanguageState('th');
            localStorage.setItem('language', 'th');
        }
    }, []);

    useEffect(() => {
        if (mounted) {
            // Update document lang attribute
            document.documentElement.lang = language;
            // Save to localStorage
            localStorage.setItem('language', language);
        }
    }, [language, mounted]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
