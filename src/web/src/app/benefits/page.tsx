"use client";
import { useState } from 'react';
import BlogPosts from '../components/BlogPosts';
import FilterBar from '../components/FilterBar';
import { useSearch } from '../contexts/SearchContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePosts } from '../contexts/PostsContext';

export default function BenefitsPage() {
  const { searchQuery } = useSearch();
  const { t } = useLanguage();
  const { posts } = usePosts();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get benefits posts (posts with สวัสดิการ tag)
  const benefitsPosts = posts.filter(post => post.tags && post.tags.includes('สวัสดิการ'));

  // Compute available tags from benefits posts only
  const availableTags = Array.from(new Set(benefitsPosts.flatMap(post => post.tags || [])))
    .filter(tag => tag !== 'สวัสดิการ'); // Exclude the main benefits tag

  // Handle breadcrumb click - clear filter
  const handleBreadcrumbClick = () => {
    setSelectedTags([]);
  };

  // Toggle tag selection - only one filter allowed at a time
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? [] : [tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <FilterBar
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        availableTags={availableTags}
      />
      <div className="py-8 sm:py-12 md:py-16">
        <div className="px-4 sm:px-6 w-full">
          <BlogPosts
            searchQuery={searchQuery}
            tagFilter={selectedTags.length > 0 ? ['สวัสดิการ', ...selectedTags] : 'สวัสดิการ'}
            sectionTitle={selectedTags.length > 0 ?
              `${t('nav.benefits')} > ${selectedTags[0]}` :
              t('nav.benefits')
            }
            displayMode="grid"
            onBreadcrumbClick={handleBreadcrumbClick}
          />
        </div>
      </div>
    </div>
  );
}