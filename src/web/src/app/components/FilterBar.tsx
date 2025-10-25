'use client';

import { useLanguage } from '../contexts/LanguageContext';

interface FilterBarProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags?: string[];
}

export default function FilterBar({ selectedTags, onTagToggle, availableTags = [] }: FilterBarProps) {
  const { t } = useLanguage();

  // Add "All" option at the beginning
  const allTags = ['All', ...availableTags];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {allTags.map((tag) => {
            const isSelected = tag === 'All' ? selectedTags.length === 0 : selectedTags.includes(tag);
            const isAllTag = tag === 'All';

            return (
              <button
                key={tag}
                onClick={() => {
                  if (isAllTag) {
                    // Clear all selections for "All"
                    selectedTags.forEach(selectedTag => onTagToggle(selectedTag));
                  } else {
                    onTagToggle(tag);
                  }
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                  isSelected
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isAllTag ? (t('filter.all') || 'All') : tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}