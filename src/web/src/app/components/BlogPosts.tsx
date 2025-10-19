'use client';

import { useState, useEffect } from 'react';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
}

export default function BlogPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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
        <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">We couldn&apos;t load the updates</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchPosts}
          className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-sm transition-colors font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 dark:text-gray-400 text-xl">No updates available right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            What&apos;s New For You
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {posts.length} {posts.length === 1 ? 'update' : 'updates'} about your benefits and rights
          </p>
        </div>
        <button
          onClick={fetchPosts}
          className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-sm transition-colors text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group cursor-pointer"
          >
            {/* Image Placeholder with TED red accent */}
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
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center pt-8">
        <button className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-[#0066CC] text-gray-700 dark:text-gray-300 hover:text-[#0066CC] font-semibold rounded-sm transition-colors">
          See more updates
        </button>
      </div>
    </div>
  );
}
