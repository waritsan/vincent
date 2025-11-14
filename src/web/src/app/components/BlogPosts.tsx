'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePosts } from '../contexts/PostsContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  author_avatar?: string;
  video_url?: string;
  thumbnail_url?: string;
  source_url?: string;
  embed_type?: 'preview' | 'iframe' | 'screenshot';
  iframe_allowed?: boolean;
  post_type?: 'original' | 'shared';
  reading_time_minutes?: number;
  created_at: string;
  tags?: string[];
}

interface BlogPostsProps {
  searchQuery?: string;
  tagFilter?: string | string[];
  excludeTag?: string;
  authorFilter?: string | string[];
  sectionTitle?: string;
  displayMode?: 'carousel' | 'grid';
  onBreadcrumbClick?: () => void;
}

export default function BlogPosts({ searchQuery = '', tagFilter = '', excludeTag = '', authorFilter, sectionTitle = '', displayMode = 'carousel', onBreadcrumbClick }: BlogPostsProps = {}) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { posts, loading, error, refetchPosts } = usePosts();
  const { t } = useLanguage();

  // Helper function to scroll carousel
  const scrollCarousel = (rowId: string, direction: 'left' | 'right') => {
    const carousel = document.getElementById(`carousel-${rowId}`);
    if (carousel) {
      const scrollAmount = carousel.offsetWidth * 0.8;
      const newScrollPos = direction === 'left'
        ? carousel.scrollLeft - scrollAmount
        : carousel.scrollLeft + scrollAmount;

      carousel.scrollTo({
        left: newScrollPos,
        behavior: 'smooth'
      });
    }
  };

  // Helper function to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    try {
      // Clean the URL
      const cleanUrl = url.trim();

      // Handle youtu.be format
      const youtuBeMatch = cleanUrl.match(/youtu\.be\/([^?&]+)/);
      if (youtuBeMatch) {
        const videoId = youtuBeMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }

      // Handle youtube.com/watch format
      const youtubeMatch = cleanUrl.match(/[?&]v=([^&]+)/);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }

      // Handle youtube.com/embed format
      const embedMatch = cleanUrl.match(/\/embed\/([^?&]+)/);
      if (embedMatch) {
        const videoId = embedMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }

      // Handle youtube.com/v/ format (legacy)
      const vMatch = cleanUrl.match(/\/v\/([^?&]+)/);
      if (vMatch) {
        const videoId = vMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }

      // Handle youtube.com/shorts format
      const shortsMatch = cleanUrl.match(/\/shorts\/([^?&]+)/);
      if (shortsMatch) {
        const videoId = shortsMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }

      // Handle youtube.com/live format
      const liveMatch = cleanUrl.match(/\/live\/([^?&]+)/);
      if (liveMatch) {
        const videoId = liveMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }

      return null;
    } catch (error) {
      console.warn('Error parsing YouTube URL:', error);
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter posts based on search query, tag filter, and exclude tag
  const filteredPosts = posts.filter((post) => {
    // Filter by tag (include only)
    if (tagFilter) {
      const tags = Array.isArray(tagFilter) ? tagFilter : [tagFilter];
      const hasMatchingTag = tags.some(tag => post.tags && post.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Exclude posts with specific tag
    if (excludeTag) {
      if (post.tags && post.tags.includes(excludeTag)) {
        return false;
      }
    }

    // Filter by author
    if (authorFilter) {
      const authors = Array.isArray(authorFilter) ? authorFilter : [authorFilter];
      const authorMatch = authors.some(author =>
        post.author.toLowerCase().includes(author.toLowerCase())
      );
      if (!authorMatch) return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-8 text-center max-w-2xl mx-auto">
        <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">{t('blog.error')}</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={refetchPosts}
          className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-sm transition-colors font-semibold"
        >
          {t('blog.tryAgain')}
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400 text-xl">{t('blog.emptyState')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* No Results Message */}
      {filteredPosts.length === 0 && searchQuery && (
        <div className="text-center py-20">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">{t('blog.noResults')}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('blog.noResultsDesc')} &quot;{searchQuery}&quot;
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('blog.clearSearch')}
          </p>
        </div>
      )}

      {/* Posts Display - Carousel or Grid */}
      {filteredPosts.length > 0 && (
        displayMode === 'carousel' ? (
          <div className="relative group/row">
            {/* Carousel Title */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {sectionTitle || t('blog.latestNews')}
              </h2>
              <button className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base font-semibold">
                <span>Explore All</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Carousel Container */}
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel(Array.isArray(tagFilter) ? tagFilter.join('-') : (tagFilter || excludeTag || 'posts'), 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-gradient-to-r from-white dark:from-gray-900 to-transparent opacity-0 group-hover/row:opacity-100 hover:from-white/95 dark:hover:from-gray-900/95 transition-opacity duration-300 flex items-center justify-start pl-2"
                aria-label="Scroll left"
              >
                <svg className="w-8 h-8 text-gray-900 dark:text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel(Array.isArray(tagFilter) ? tagFilter.join('-') : (tagFilter || excludeTag || 'posts'), 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-gradient-to-l from-white dark:from-gray-900 to-transparent opacity-0 group-hover/row:opacity-100 hover:from-white/95 dark:hover:from-gray-900/95 transition-opacity duration-300 flex items-center justify-end pr-2"
                aria-label="Scroll right"
              >
                <svg className="w-8 h-8 text-gray-900 dark:text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Scrollable Row */}
              <div
                id={`carousel-${Array.isArray(tagFilter) ? tagFilter.join('-') : (tagFilter || excludeTag || 'posts')}`}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {filteredPosts.map((post) => {
                  const videoId = post.video_url ? getYouTubeVideoId(post.video_url) : null;

                  return (
                    <article
                      key={post.id}
                      onClick={() => {
                        // If it's a shared post with a source URL, open in new tab
                        if (post.post_type === 'shared' && post.source_url) {
                          window.open(post.source_url, '_blank', 'noopener,noreferrer');
                        } else {
                          setSelectedPost(post);
                        }
                      }}
                      className="flex-none w-[280px] sm:w-[320px] lg:w-[380px] cursor-pointer snap-start group/card"
                    >
                      {/* Video or Image */}
                      {videoId ? (
                        <div className="aspect-video mb-3 relative overflow-hidden rounded-md bg-gray-900 transition-transform duration-300 group-hover/card:scale-105">
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover/card:bg-black/30 transition-colors z-10">
                            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300 shadow-lg">
                              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : post.thumbnail_url ? (
                        <div className="aspect-video mb-3 relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800 transition-transform duration-300 group-hover/card:scale-105">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 mb-3 relative overflow-hidden rounded-md transition-transform duration-300 group-hover/card:scale-105">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-[#0066CC] flex items-center justify-center">
                              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight group-hover/card:text-[#0066CC] transition-colors line-clamp-2 flex items-start gap-2">
                          <span className="flex-1">{post.title}</span>
                          {post.post_type === 'shared' && (
                            <svg
                              className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-label="External Article"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          )}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                          {post.content}
                        </p>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            {post.author_avatar ? (
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={post.author_avatar}
                                  alt={post.author}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                  {post.author.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {post.author}
                            </span>
                            {post.reading_time_minutes && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {post.reading_time_minutes} min read
                                </span>
                              </>
                            )}
                          </div>
                          <time className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                            {formatDate(post.created_at)}
                          </time>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="space-y-8">
            {/* Netflix-style Breadcrumb Title */}
            {sectionTitle && (
              <div className="mb-6">
                <nav className="flex items-center space-x-2 text-sm">
                  {sectionTitle.includes('>') ? (
                    <>
                      <button
                        onClick={onBreadcrumbClick}
                        className="text-gray-600 dark:text-gray-400 hover:text-[#0066CC] transition-colors font-medium"
                      >
                        {sectionTitle.split(' > ')[0]}
                      </button>
                      <span className="text-gray-400 dark:text-gray-500">›</span>
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {sectionTitle.split(' > ')[1]}
                      </span>
                    </>
                  ) : (
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {sectionTitle}
                    </h2>
                  )}
                </nav>
              </div>
            )}

            {/* Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPosts.map((post) => {
                const videoId = post.video_url ? getYouTubeVideoId(post.video_url) : null;

                return (
                  <article
                    key={post.id}
                    onClick={() => {
                      // If it's a shared post with a source URL, open in new tab
                      if (post.post_type === 'shared' && post.source_url) {
                        window.open(post.source_url, '_blank', 'noopener,noreferrer');
                      } else {
                        setSelectedPost(post);
                      }
                    }}
                    className="cursor-pointer group/card bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                  >
                    {/* Video or Image */}
                    {videoId ? (
                      <div className="aspect-video relative overflow-hidden bg-gray-900">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover/card:bg-black/30 transition-colors z-10">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300 shadow-lg">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : post.thumbnail_url ? (
                      <div className="aspect-video relative overflow-hidden bg-gray-200 dark:bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-[#0066CC] flex items-center justify-center">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight group-hover/card:text-[#0066CC] transition-colors line-clamp-2 flex items-start gap-2">
                        <span className="flex-1">{post.title}</span>
                        {post.post_type === 'shared' && (
                          <svg
                            className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-label="External Article"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                        {post.content}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {post.author_avatar ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={post.author_avatar}
                                alt={post.author}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {post.author.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {post.author}
                          </span>
                          {post.reading_time_minutes && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {post.reading_time_minutes} min read
                              </span>
                            </>
                          )}
                        </div>
                        <time className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                          {formatDate(post.created_at)}
                        </time>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-0 sm:p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 sm:rounded-lg max-w-4xl w-full my-0 sm:my-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center transition-colors z-20 shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video, Image, or iFrame Embed */}
            {/* For shared posts, prioritize iframe if source_url exists, regardless of embed_type */}
            {(selectedPost.embed_type === 'iframe' || selectedPost.post_type === 'shared') && selectedPost.source_url ? (
              <div className="w-full bg-gray-100 dark:bg-gray-900 relative overflow-hidden sm:rounded-t-lg" style={{ height: '75vh', minHeight: '600px', maxHeight: '900px' }}>
                {/* Loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
                  </div>
                </div>
                {/* Iframe */}
                <iframe
                  src={selectedPost.source_url}
                  title={selectedPost.title}
                  className="w-full h-full border-0 relative z-10 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={(e) => {
                    // Hide loading indicator when iframe loads
                    const loader = e.currentTarget.previousElementSibling;
                    if (loader) loader.remove();
                  }}
                ></iframe>
              </div>
            ) : selectedPost.video_url && getYouTubeVideoId(selectedPost.video_url) ? (
              <div className="w-full bg-black relative" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedPost.video_url)}?rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                  title={selectedPost.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                ></iframe>
              </div>
            ) : selectedPost.thumbnail_url ? (
              <div className="w-full bg-gray-100 dark:bg-gray-900 relative sm:rounded-t-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPost.thumbnail_url}
                  alt={selectedPost.title}
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0066CC] flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Content - Only show for non-shared posts or shared posts without iframe */}
            {!((selectedPost.embed_type === 'iframe' || selectedPost.post_type === 'shared') && selectedPost.source_url) && (
              <div className="p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  {selectedPost.title}
                </h2>

                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
                  {selectedPost.author_avatar ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedPost.author_avatar}
                        alt={selectedPost.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-300">
                        {selectedPost.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{selectedPost.author}</p>
                    <time className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(selectedPost.created_at)}
                    </time>
                  </div>
                </div>

                <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </div>
              </div>
            )}

            {/* Source Link for Shared Posts - Show below iframe */}
            {selectedPost.post_type === 'shared' && selectedPost.source_url && (
              <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Article loaded above. If it doesn&apos;t display properly, the website may block embedding.
                    </p>
                    <a
                      href={selectedPost.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#0066CC] hover:text-[#0052A3] transition-colors font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
