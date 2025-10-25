'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface PostsResponse {
  posts: Post[];
  total: number;
}

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  refetchPosts: () => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}

interface PostsProviderProps {
  children: ReactNode;
}

export function PostsProvider({ children }: PostsProviderProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchPosts();
  }, []);

  const refetchPosts = async () => {
    await fetchPosts();
  };

  const value: PostsContextType = {
    posts,
    loading,
    error,
    refetchPosts,
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
}