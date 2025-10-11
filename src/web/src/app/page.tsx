import BlogPosts from './components/BlogPosts';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vincent's Blog
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Powered by Azure Functions & AI Foundry
          </p>
        </header>

        {/* Blog Posts */}
        <BlogPosts />
      </div>
    </div>
  );
}
