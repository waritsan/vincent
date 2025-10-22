'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  video_url?: string;
  created_at: string;
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

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query)
    );
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
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('blog.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'โพสต์' : 'โพสต์'} 
            {searchQuery && ' ที่ตรงกับการค้นหา'}เกี่ยวกับสิทธิประโยชน์และสวัสดิการของคุณ
          </p>
        </div>
        <button
          onClick={fetchPosts}
          className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-sm transition-colors text-sm font-semibold whitespace-nowrap"
        >
          {t('blog.refresh')}
        </button>
      </div>

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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-[#0066CC] transition-colors line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {post.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <div className="text-center pt-8">
          <button className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-[#0066CC] text-gray-700 dark:text-gray-300 hover:text-[#0066CC] font-semibold rounded-sm transition-colors">
            See more updates
          </button>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full my-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="sticky top-4 float-right mr-4 mt-4 w-10 h-10 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center transition-colors z-20 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video or Image */}
            {selectedPost.video_url && getYouTubeVideoId(selectedPost.video_url) ? (
              <div className="aspect-video w-full bg-black relative clear-both">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedPost.video_url)}`}
                  title={selectedPost.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                ></iframe>
              </div>
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#0066CC] flex items-center justify-center">
                  <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedPost.title}
              </h2>
              
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    {selectedPost.author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPost.author}</p>
                  <time className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(selectedPost.created_at)}
                  </time>
                </div>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none">
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
