export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main id="main-content" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            StyleScope
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            AI Fashion Commentary by Alex Chen
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">AC</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Meet Alex Chen
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Your disabled neurodivergent fashion commentator, providing weekly trend analysis 
              using Amazon&apos;s native services. Authentic disability representation meets 
              cutting-edge AI technology.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  🔍 Real Data Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Amazon Product Advertising API integration for authentic fashion insights
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  🧠 AI-Powered Commentary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Amazon Bedrock generates thoughtful trend analysis with Alex&apos;s unique perspective
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  💭 Sentiment Insights
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Amazon Comprehend analyzes customer reviews for authentic feedback
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  ♿ Accessibility First
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Designed for neurodivergent users with WCAG 2.1 AA compliance
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🚧 Development in Progress
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              StyleScope is being built for the Code with Kiro Hackathon. 
              Check back soon for Alex&apos;s first fashion commentary episode!
            </p>
          </div>
        </div>
      </main>
      
      <nav id="navigation" className="sr-only">
        <ul>
          <li><a href="#main-content">Main Content</a></li>
          <li><a href="/api/health/services">Service Health</a></li>
        </ul>
      </nav>
    </div>
  );
}