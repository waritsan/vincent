'use client';

import { useState } from 'react';

interface AddPostFromUrlProps {
  onSuccess?: () => void;
}

export default function AddPostFromUrl({ onSuccess }: AddPostFromUrlProps) {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [extractionNotes, setExtractionNotes] = useState<string[] | null>(null);
  const [previewData, setPreviewData] = useState<{
    title: string;
    content: string;
    author: string;
    thumbnail_url?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/api/posts/from-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          author: author || undefined,
          embed_type: 'preview',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = await response.json();
      setPreviewData(data.post);
      setExtractionNotes(data.extraction_notes);
      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setUrl('');
        setTags('');
        setAuthor('');
        setPreviewData(null);
        if (onSuccess) onSuccess();
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#0066CC] flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Post from URL</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Share content from any website with a preview card. Clicking opens the original article.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL *
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Tags Input */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="สวัสดิการ, ประกันสังคม, สุขภาพ"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Author Override */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Author Override (optional)
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Will use site name if not provided"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Post created successfully!</p>
              {previewData && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  &quot;{previewData.title}&quot; has been added to your posts.
                </p>
              )}
              {extractionNotes && extractionNotes.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">⚠️ Extraction Notes:</p>
                  <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-0.5">
                    {extractionNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                    You can manually add an image URL or edit the content after creation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-[#0066CC] hover:bg-[#0052A3] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating Post...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Post</span>
            </>
          )}
        </button>
      </form>

      {/* Preview */}
      {previewData && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview</h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {previewData.thumbnail_url && (
              <div className="aspect-video bg-gray-100 dark:bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewData.thumbnail_url} 
                  alt={previewData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{previewData.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{previewData.content}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-500">{previewData.author}</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                  Preview Card
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
