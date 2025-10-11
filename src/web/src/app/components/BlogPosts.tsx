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
      
      // Get API URL from environment variable or use default
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://func-ja67jva7pfqfc.azurewebsites.net';
      
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Posts</p>
        <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
        <button
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No posts yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Recent Posts ({posts.length})
        </h2>
        <button
          onClick={fetchPosts}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100 line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {post.author}
                </span>
                <time className="text-xs">
                  {formatDate(post.created_at)}
                </time>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
