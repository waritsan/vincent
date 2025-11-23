'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsDashboard {
  dashboard_title: string;
  generated_at: string;
  period: string;
  summary_metrics: {
    total_articles_analyzed: number;
    companies_extracted: number;
    trending_topics_count: number;
    regulatory_signals: number;
    minister_mentions: number;
    policy_projects: number;
    media_sentiment_articles: number;
  };
  trending_topics: Array<{
    topic: string;
    frequency: number;
    growth_rate: number;
  }>;
  volume_trends: {
    total_articles: number;
    avg_per_week: number;
    peak_day: string;
    seasonal_pattern: string;
  };
  topic_distribution: Record<string, number>;
  recent_companies: Array<{
    company_name: string;
    location: string;
    asset_valuation: string;
    created_at: string;
  }>;
  key_insights: string[];
  recommendations: string[];
  minister_metrics: Array<{
    article_id: string;
    title: string;
    minister_mentions: {
      minister_name_count: number;
      ministry_name_count: number;
      position_titles: string[];
      other_ministers_mentioned: string[];
    };
    achievements_actions: {
      key_achievements: string[];
      actions_taken: string[];
      policies_endorsed: string[];
      budgets_announced: string[];
      important_quotes: string[];
    };
    responsibility_areas: string[];
    analyzed_at: string;
  }>;
  policy_metrics: Array<{
    article_id: string;
    title: string;
    policy_identification: {
      initiative_name: string;
      start_date: string;
      end_date: string;
      location: string;
      agency_involved: string;
    };
    public_impact: {
      target_group: string[];
      objective: string;
      expected_outcomes: string[];
    };
    financial_info: {
      budget_amount: string;
      funding_source: string;
      budget_breakdown: string[];
    };
    risks_issues: {
      problems_highlighted: string[];
      complaints_raised: string[];
      challenges_identified: string[];
    };
    analyzed_at: string;
  }>;
  media_sentiment_metrics: Array<{
    article_id: string;
    title: string;
    sentiment_analysis: {
      overall_sentiment: string;
      minister_sentiment: string;
      ministry_sentiment: string;
      policy_sentiment: string;
    };
    tone_framing: {
      tone: string;
      framing: string;
      tone_confidence: number;
    };
    media_metadata: {
      source: string;
      category: string;
      publication_date: string;
      region: string;
    };
    named_entities: {
      people: string[];
      organizations: string[];
      laws: string[];
      projects: string[];
      locations: string[];
    };
    analyzed_at: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Fetch directly from Azure Functions backend
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7071';
        const response = await fetch(`${backendUrl}/api/analytics/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch analytics dashboard');
        }
        const data = await response.json();
        setDashboard(data.dashboard);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load analytics dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-500">Loading analytics dashboard...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="text-center text-red-500">
          {error || 'No analytics data available'}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const topicDistributionData = Object.entries(dashboard.topic_distribution).map(([topic, count]) => ({
    topic: topic.replace('_', ' ').toUpperCase(),
    count
  }));

  const trendingTopicsChartData = dashboard.trending_topics.map(topic => ({
    topic: topic.topic.length > 15 ? topic.topic.substring(0, 15) + '...' : topic.topic,
    frequency: topic.frequency,
    growth: (topic.growth_rate * 100).toFixed(1) + '%'
  }));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'topics', label: 'Topics' },
    { id: 'companies', label: 'Companies' },
    { id: 'ministers', label: 'Ministers' },
    { id: 'policies', label: 'Policies' },
    { id: 'media', label: 'Media' },
    { id: 'insights', label: 'Insights' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {dashboard.dashboard_title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {dashboard.period} • Updated {new Date(dashboard.generated_at).toLocaleString()}
          </p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          Live Data
        </span>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Articles Analyzed</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {dashboard.summary_metrics.total_articles_analyzed.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Companies Extracted</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {dashboard.summary_metrics.companies_extracted.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Trending Topics</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {dashboard.summary_metrics.trending_topics_count}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Regulatory Signals</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {dashboard.summary_metrics.regulatory_signals}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Minister Mentions</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {dashboard.summary_metrics.minister_mentions}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Policy Projects</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {dashboard.summary_metrics.policy_projects}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Media Analysis</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {dashboard.summary_metrics.media_sentiment_articles}
          </div>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Volume Trends */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">News Volume Trends</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Total Articles</span>
                      <span className="font-semibold">{dashboard.volume_trends.total_articles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Average per Week</span>
                      <span className="font-semibold">{dashboard.volume_trends.avg_per_week}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Peak Day</span>
                      <span className="font-semibold">{dashboard.volume_trends.peak_day}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{dashboard.volume_trends.seasonal_pattern}</p>
                    </div>
                  </div>
                </div>

                {/* Topic Distribution */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Topic Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={topicDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ topic, count }) => `${topic}: ${count}`}
                      >
                        {topicDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Trending Topics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendingTopicsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'frequency' ? `${value} mentions` : `${value} growth`,
                        name === 'frequency' ? 'Frequency' : 'Growth Rate'
                      ]}
                    />
                    <Bar dataKey="frequency" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.trending_topics.map((topic, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{topic.topic}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        topic.growth_rate > 0.1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        +{(topic.growth_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{topic.frequency}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">mentions this week</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recently Extracted Companies</h3>
              <div className="space-y-4">
                {dashboard.recent_companies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{company.company_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{company.location}</p>
                      {company.asset_valuation && (
                        <p className="text-sm text-green-600 font-medium">{company.asset_valuation}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(company.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ministers' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Minister-Focused Analytics</h3>
                <div className="space-y-4">
                  {dashboard.minister_metrics.length > 0 ? dashboard.minister_metrics.map((metric, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{metric.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(metric.analyzed_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Minister Mentions */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Minister Mentions</h5>
                          <div className="text-xs space-y-1">
                            <div>Minister names: {metric.minister_mentions.minister_name_count}</div>
                            <div>Ministry names: {metric.minister_mentions.ministry_name_count}</div>
                            {metric.minister_mentions.position_titles.length > 0 && (
                              <div>Positions: {metric.minister_mentions.position_titles.slice(0, 2).join(', ')}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Achievements & Actions */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-green-600 dark:text-green-400">Achievements & Actions</h5>
                          <div className="text-xs space-y-1">
                            {metric.achievements_actions.key_achievements.length > 0 && (
                              <div>Achievements: {metric.achievements_actions.key_achievements.length}</div>
                            )}
                            {metric.achievements_actions.actions_taken.length > 0 && (
                              <div>Actions: {metric.achievements_actions.actions_taken.length}</div>
                            )}
                            {metric.achievements_actions.budgets_announced.length > 0 && (
                              <div>Budgets: {metric.achievements_actions.budgets_announced.slice(0, 1).join(', ')}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Responsibility Areas */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-purple-600 dark:text-purple-400">Responsibility Areas</h5>
                          <div className="text-xs">
                            {metric.responsibility_areas.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {metric.responsibility_areas.slice(0, 3).map((area, i) => (
                                  <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500">No specific areas identified</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No minister-focused analytics available yet. Articles with minister mentions will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Policy & Program Analytics</h3>
                <div className="space-y-4">
                  {dashboard.policy_metrics.length > 0 ? dashboard.policy_metrics.map((metric, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{metric.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(metric.analyzed_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Policy Identification */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-teal-600 dark:text-teal-400">Policy Identification</h5>
                          <div className="text-xs space-y-1">
                            {metric.policy_identification.initiative_name && (
                              <div><strong>Initiative:</strong> {metric.policy_identification.initiative_name}</div>
                            )}
                            {metric.policy_identification.agency_involved && (
                              <div><strong>Agency:</strong> {metric.policy_identification.agency_involved}</div>
                            )}
                            {metric.policy_identification.location && (
                              <div><strong>Location:</strong> {metric.policy_identification.location}</div>
                            )}
                            {(metric.policy_identification.start_date || metric.policy_identification.end_date) && (
                              <div><strong>Duration:</strong> {metric.policy_identification.start_date} - {metric.policy_identification.end_date}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Public Impact */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400">Public Impact</h5>
                          <div className="text-xs space-y-1">
                            {metric.public_impact.target_group.length > 0 && (
                              <div><strong>Target:</strong> {metric.public_impact.target_group.join(', ')}</div>
                            )}
                            {metric.public_impact.objective && (
                              <div><strong>Objective:</strong> {metric.public_impact.objective}</div>
                            )}
                            {metric.public_impact.expected_outcomes.length > 0 && (
                              <div><strong>Outcomes:</strong> {metric.public_impact.expected_outcomes.slice(0, 1).join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Financial Info & Risks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-green-600 dark:text-green-400">Financial Information</h5>
                          <div className="text-xs space-y-1">
                            {metric.financial_info.budget_amount && (
                              <div><strong>Budget:</strong> {metric.financial_info.budget_amount}</div>
                            )}
                            {metric.financial_info.funding_source && (
                              <div><strong>Source:</strong> {metric.financial_info.funding_source}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-red-600 dark:text-red-400">Risks & Issues</h5>
                          <div className="text-xs space-y-1">
                            {metric.risks_issues.problems_highlighted.length > 0 && (
                              <div><strong>Problems:</strong> {metric.risks_issues.problems_highlighted.slice(0, 2).join(', ')}</div>
                            )}
                            {metric.risks_issues.challenges_identified.length > 0 && (
                              <div><strong>Challenges:</strong> {metric.risks_issues.challenges_identified.slice(0, 2).join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No policy/program analytics available yet. Articles with policy information will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Media & Sentiment Analytics</h3>
                <div className="space-y-4">
                  {dashboard.media_sentiment_metrics.length > 0 ? dashboard.media_sentiment_metrics.map((metric, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{metric.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(metric.analyzed_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sentiment Analysis */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-orange-600 dark:text-orange-400">Sentiment Analysis</h5>
                          <div className="text-xs space-y-1">
                            <div><strong>Overall:</strong> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                metric.sentiment_analysis.overall_sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                metric.sentiment_analysis.overall_sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {metric.sentiment_analysis.overall_sentiment}
                              </span>
                            </div>
                            <div><strong>Minister:</strong> {metric.sentiment_analysis.minister_sentiment}</div>
                            <div><strong>Ministry:</strong> {metric.sentiment_analysis.ministry_sentiment}</div>
                            <div><strong>Policy:</strong> {metric.sentiment_analysis.policy_sentiment}</div>
                          </div>
                        </div>
                        
                        {/* Tone & Framing */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-purple-600 dark:text-purple-400">Tone & Framing</h5>
                          <div className="text-xs space-y-1">
                            <div><strong>Tone:</strong> {metric.tone_framing.tone} 
                              {metric.tone_framing.tone_confidence && (
                                <span className="text-gray-500"> ({(metric.tone_framing.tone_confidence * 100).toFixed(0)}%)</span>
                              )}
                            </div>
                            <div><strong>Framing:</strong> {metric.tone_framing.framing}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Media Metadata & Named Entities */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Media Metadata</h5>
                          <div className="text-xs space-y-1">
                            {metric.media_metadata.source && (
                              <div><strong>Source:</strong> {metric.media_metadata.source}</div>
                            )}
                            {metric.media_metadata.category && (
                              <div><strong>Category:</strong> {metric.media_metadata.category}</div>
                            )}
                            {metric.media_metadata.region && (
                              <div><strong>Region:</strong> {metric.media_metadata.region}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Named Entities</h5>
                          <div className="text-xs space-y-1">
                            {metric.named_entities.people.length > 0 && (
                              <div><strong>People:</strong> {metric.named_entities.people.slice(0, 2).join(', ')}</div>
                            )}
                            {metric.named_entities.organizations.length > 0 && (
                              <div><strong>Organizations:</strong> {metric.named_entities.organizations.slice(0, 2).join(', ')}</div>
                            )}
                            {metric.named_entities.projects.length > 0 && (
                              <div><strong>Projects:</strong> {metric.named_entities.projects.slice(0, 2).join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No media sentiment analytics available yet. Articles with media analysis will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Key Insights */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Key Insights</h3>
                <ul className="space-y-2">
                  {dashboard.key_insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recommendations</h3>
                <ul className="space-y-2">
                  {dashboard.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}