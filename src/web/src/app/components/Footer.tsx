'use client';

import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-white py-8 sm:py-12 mt-12">
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
