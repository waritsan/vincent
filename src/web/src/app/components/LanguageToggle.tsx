'use client';

import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle language"
      title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
    >
      <span className="text-2xl" role="img" aria-label={language === 'th' ? 'Thai flag' : 'US flag'}>
        {language === 'th' ? '🇹🇭' : '🇺🇸'}
      </span>
      <span className="text-sm font-medium">
        {language === 'th' ? 'ไทย' : 'EN'}
      </span>
    </button>
  );
}
