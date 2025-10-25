"use client";
import { useState } from 'react';
import BlogPosts from '../components/BlogPosts';
import FilterBar from '../components/FilterBar';
import { useSearch } from '../contexts/SearchContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePosts } from '../contexts/PostsContext';

export default function PostsListPage() {
  const { searchQuery } = useSearch();
  const { t } = useLanguage();
  const { posts } = usePosts();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get posts that will be shown (excluding benefits posts)
  const displayPosts = posts.filter(post => !post.tags || !post.tags.includes('สวัสดิการ'));

  // Compute available tags from posts that will be displayed
  const availableTags = Array.from(new Set(displayPosts.flatMap(post => post.tags || [])));

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
            excludeTag="สวัสดิการ"
            tagFilter={selectedTags.length > 0 ? selectedTags : undefined}
            sectionTitle={selectedTags.length > 0 ?
              `${t('nav.news')} > ${selectedTags[0]}` :
              t('nav.news')
            }
            displayMode="grid"
            onBreadcrumbClick={handleBreadcrumbClick}
          />
        </div>
      </div>
    </div>
  );
}
