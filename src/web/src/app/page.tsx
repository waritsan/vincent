import BlogPosts from './components/BlogPosts';
import AIChat from './components/AIChat';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* TED-style Navigation */}
      <nav className="bg-black text-white sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-[#0066CC]">THE GLOBE</span>
              </h1>
              <div className="hidden md:flex space-x-6 text-sm font-medium">
                <a href="#" className="hover:text-[#0066CC] transition-colors">Benefits</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">Services</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">Your Rights</a>
                <a href="#" className="hover:text-[#0066CC] transition-colors">Get Help</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-sm hover:text-[#0066CC] transition-colors">Search</button>
              <button className="bg-[#0066CC] hover:bg-[#0052A3] px-6 py-2 rounded-sm text-sm font-semibold transition-colors">
                My Account
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
              Your Rights, Your Benefits
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Discover what you&apos;re entitled to and how we can support you with essential services and information
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 max-w-7xl">
          <BlogPosts />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">About Us</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Who We Are</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How We Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Our Commitment</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Your Benefits</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Available Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Apply Online</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Check Eligibility</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Need Help?</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Submit Feedback</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Stay Connected</h3>
              <p className="text-sm text-gray-400">Your trusted source for rights and benefits information</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-gray-400 text-center">
            <p>&copy; 2025 The Globe. Here for you, supporting your rights and benefits.</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
}
