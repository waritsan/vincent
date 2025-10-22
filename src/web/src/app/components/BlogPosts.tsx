'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  author_avatar?: string;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
  tags?: string[];
}

interface PostsResponse {
  posts: Post[];
  total: number;
}

interface BlogPostsProps {
  searchQuery?: string;
}

export default function BlogPosts({ searchQuery = '' }: BlogPostsProps = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchPosts();
  }, []);

  // Helper function to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Handle youtu.be format
      const youtuBeMatch = url.match(/youtu\.be\/([^?&]+)/);
      if (youtuBeMatch) return youtuBeMatch[1];
      
      // Handle youtube.com/watch format
      const youtubeMatch = url.match(/[?&]v=([^&]+)/);
      if (youtubeMatch) return youtubeMatch[1];
      
      // Handle youtube.com/embed format
      const embedMatch = url.match(/\/embed\/([^?&]+)/);
      if (embedMatch) return embedMatch[1];
      
      // Handle youtube.com/v/ format
      const vMatch = url.match(/\/v\/([^?&]+)/);
      if (vMatch) return vMatch[1];
    } catch (e) {
      console.error('Error extracting YouTube video ID:', e);
    }
    
    return null;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get API URL from environment variable
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
      }
      
      const response = await fetch(`${apiUrl}/api/posts`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      
      const data: PostsResponse = await response.json();
      setPosts(data.posts);
      
      // Extract all unique tags from posts
      const tagsSet = new Set<string>();
      data.posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
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

  // Filter posts based on search query and selected tag
  const filteredPosts = posts.filter((post) => {
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
    
    // Filter by selected tag
    if (selectedTag) {
      if (!post.tags || !post.tags.includes(selectedTag)) {
        return false;
      }
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
          onClick={fetchPosts}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('blog.title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'โพสต์' : 'โพสต์'} 
            {searchQuery && ' ที่ตรงกับการค้นหา'}เกี่ยวกับสิทธิประโยชน์และสวัสดิการของคุณ
          </p>
        </div>
        <button
          onClick={fetchPosts}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-sm transition-colors text-sm font-semibold whitespace-nowrap self-start md:self-auto"
        >
          {t('blog.refresh')}
        </button>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('blog.filterByTag')}:
          </span>
          <button
            onClick={() => setSelectedTag('')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors ${
              selectedTag === ''
                ? 'bg-[#0066CC] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('blog.allTags')}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors ${
                selectedTag === tag
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

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

      {/* Posts Grid */}
      {filteredPosts.length > 0 && (
        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => {
            const videoId = post.video_url ? getYouTubeVideoId(post.video_url) : null;
          
          return (
          <article
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="group cursor-pointer"
          >
            {/* Video or Image Placeholder */}
            {videoId ? (
              <div 
                className="aspect-video mb-4 relative overflow-hidden rounded-sm bg-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPost(post);
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors z-10">
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
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
              <div className="aspect-video mb-4 relative overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#0066CC] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white text-xs font-semibold px-2 py-1 bg-[#0066CC] rounded-sm">
                    {Math.floor(Math.random() * 15) + 5} min
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-[#0066CC] transition-colors line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                {post.content}
              </p>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  {post.author_avatar ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={post.author_avatar}
                        alt={post.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {post.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {post.author}
                  </span>
                </div>
                <time className="text-xs text-gray-500 dark:text-gray-500">
                  {formatDate(post.created_at)}
                </time>
              </div>
            </div>
          </article>
          );
        })}
        </div>
      )}

      {/* Load More Button */}
      {filteredPosts.length > 0 && (
        <div className="text-center pt-6 sm:pt-8">
          <button className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-[#0066CC] text-gray-700 dark:text-gray-300 hover:text-[#0066CC] font-semibold rounded-sm transition-colors text-sm sm:text-base">
            See more updates
          </button>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 sm:rounded-lg max-w-4xl w-full my-0 sm:my-8 shadow-2xl relative min-h-screen sm:min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="sticky top-4 float-right mr-3 sm:mr-4 mt-3 sm:mt-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center transition-colors z-20 shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video or Image */}
            {selectedPost.video_url && getYouTubeVideoId(selectedPost.video_url) ? (
              <div className="w-full bg-black relative clear-both" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedPost.video_url)}`}
                  title={selectedPost.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                ></iframe>
              </div>
            ) : selectedPost.thumbnail_url ? (
              <div className="w-full bg-gray-100 dark:bg-gray-900 relative clear-both flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '70vh' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedPost.thumbnail_url}
                  alt={selectedPost.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center clear-both">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0066CC] flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Content */}
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
          </div>
        </div>
      )}
    </div>
  );
}
