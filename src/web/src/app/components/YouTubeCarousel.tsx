'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface YouTubeVideo {
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  url: string;
  embed_url: string;
  channel_title: string;
  view_count: string;
  like_count: string;
  duration: string;
  fetched_at: string;
}

interface YouTubeData {
  videos: YouTubeVideo[];
  last_updated: string;
  channel: string;
  count: number;
}

export default function YouTubeCarousel() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/youtube/videos');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data: YouTubeData = await response.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.warn('API not available, falling back to local JSON:', err);
        // Fallback: try to load from local JSON file
        try {
          const response = await fetch('/youtube_videos.json');
          if (response.ok) {
            const data: YouTubeData = await response.json();
            setVideos(data.videos || []);
            console.log('Loaded videos from local JSON file');
          } else {
            throw new Error('Local JSON not found');
          }
        } catch (fallbackErr) {
          console.error('Failed to load videos from any source:', fallbackErr);
          setError('Failed to load videos');
          // Use hardcoded sample data as last resort
          setVideos([
            {
              video_id: 'dQw4w9WgXcQ',
              title: 'Sample Video - Configure API for Real Content',
              description: 'This is a sample video. The YouTube API needs to be configured to show real videos from The Globe Online.',
              thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
              published_at: '2024-11-10T10:00:00Z',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              channel_title: 'The Globe Online',
              view_count: '1000000',
              like_count: '50000',
              duration: 'PT4M13S',
              fetched_at: '2024-11-14T12:00:00Z'
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const formatDuration = (duration: string) => {
    // Parse ISO 8601 duration (PT10M30S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-500">Loading videos...</div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">{error}</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">No videos available</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={videos.length > 1}
        className="youtube-carousel"
      >
        {videos.map((video) => (
          <SwiperSlide key={video.video_id}>
            <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl group cursor-pointer" onClick={() => window.open(video.url, '_blank')}>
              {/* Show thumbnail first, then iframe on hover/load */}
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors duration-300">
                  <div className="bg-red-600 text-white rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>

                {/* Video info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>{formatViewCount(video.view_count)}</span>
                    <span>{formatPublishedDate(video.published_at)}</span>
                    {video.duration && (
                      <span className="bg-black/50 px-2 py-1 rounded text-xs">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom styles for swiper navigation */}
      <style jsx global>{`
        .youtube-carousel .swiper-button-next,
        .youtube-carousel .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.5);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-top: -20px;
        }

        .youtube-carousel .swiper-button-next:after,
        .youtube-carousel .swiper-button-prev:after {
          font-size: 16px;
        }

        .youtube-carousel .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
        }

        .youtube-carousel .swiper-pagination-bullet-active {
          opacity: 1;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}