'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Download, Filter, RefreshCw, Eye, X, ExternalLink } from 'lucide-react';

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
    primary_metrics_articles: number;
    operational_metrics_articles: number;
    ai_metadata_articles: number;
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
  primary_metrics: Array<{
    article_id: string;
    title: string;
    economic_growth_indicators: {
      gdp_growth: string | null;
      investment_projects: string[];
      export_promotion: string[];
      foreign_investment: string[];
    };
    productivity_innovation_indicators: {
      innovation_policies: string[];
      startup_support: string[];
      research_funding: string[];
      digital_transformation: string[];
    };
    social_welfare_inequality_indicators: {
      poverty_reduction: string[];
      income_distribution: string[];
      social_protection: string[];
      education_access: string[];
    };
    environmental_energy_indicators: {
      renewable_energy: string[];
      carbon_reduction: string[];
      conservation_projects: string[];
      climate_adaptation: string[];
    };
    healthcare_capacity: {
      hospital_construction: string[];
      medical_personnel: string[];
      health_insurance: string[];
      disease_prevention: string[];
    };
    governance_digital_government_indicators: {
      e_governance: string[];
      transparency_measures: string[];
      anti_corruption: string[];
      public_service_digitalization: string[];
    };
    analyzed_at: string;
  }>;
  operational_metrics: Array<{
    article_id: string;
    title: string;
    project_status: {
      announced_projects: string[];
      in_progress_projects: string[];
      completed_projects: string[];
      delayed_projects: string[];
    };
    budget_indicators: {
      allocated_budgets: string[];
      funding_sources: string[];
      budget_utilization: string[];
      cost_overruns: string[];
    };
    impact_assessment: {
      expected_benefits: string[];
      performance_metrics: string[];
      success_measures: string[];
      evaluation_methods: string[];
    };
    geographic_coverage: {
      provinces_covered: string[];
      regions_affected: string[];
      urban_rural_scope: string;
      cross_border_impacts: string[];
    };
    beneficiary_groups: {
      target_population: string[];
      vulnerable_groups: string[];
      business_sectors: string[];
      community_types: string[];
    };
    analyzed_at: string;
  }>;
  ai_metadata: Array<{
    article_id: string;
    title: string;
    enhanced_entities: {
      government_agencies: string[];
      provinces_municipalities: string[];
      people_groups: string[];
      international_entities: string[];
    };
    topic_classification: {
      primary_category: string;
      secondary_categories: string[];
      policy_domains: string[];
      sector_impacts: string[];
    };
    policy_sentiment: {
      policy_effectiveness: string;
      public_opinion: string;
      stakeholder_sentiment: string;
      implementation_challenges: string[];
    };
    timeline_markers: {
      immediate_actions: string[];
      medium_term_goals: string[];
      long_term_vision: string[];
      deadline_dates: string[];
    };
    risk_tags: {
      regulatory_risks: string[];
      financial_risks: string[];
      operational_risks: string[];
      political_risks: string[];
      external_risks: string[];
    };
    analyzed_at: string;
  }>;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

const METRIC_COLORS = {
  primary: '#3B82F6',
  operational: '#10B981',
  ai: '#F59E0B',
  minister: '#8B5CF6',
  policy: '#EF4444',
  media: '#06B6D4'
};

export default function BIDashboard() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [filters, setFilters] = useState({
    category: 'all',
    sentiment: 'all',
    region: 'all'
  });
  const [selectedArticle, setSelectedArticle] = useState<AnalyticsDashboard['primary_metrics'][0] | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
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
        setError('Failed to load BI dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Computed metrics and KPIs
  const kpis = useMemo(() => {
    if (!dashboard) return [];

    const totalArticles = dashboard.summary_metrics.total_articles_analyzed;
    const primaryArticles = dashboard.summary_metrics.primary_metrics_articles;
    const operationalArticles = dashboard.summary_metrics.operational_metrics_articles;
    const aiArticles = dashboard.summary_metrics.ai_metadata_articles;

    return [
      {
        title: 'Total Articles Analyzed',
        value: totalArticles.toLocaleString(),
        change: '+12%',
        trend: 'up',
        icon: '📊',
        color: 'blue'
      },
      {
        title: 'Primary Metrics Coverage',
        value: `${primaryArticles}`,
        change: `${((primaryArticles / Math.max(totalArticles, 1)) * 100).toFixed(1)}%`,
        trend: primaryArticles > 0 ? 'up' : 'neutral',
        icon: '🎯',
        color: 'green'
      },
      {
        title: 'Operational Metrics',
        value: `${operationalArticles}`,
        change: `${((operationalArticles / Math.max(totalArticles, 1)) * 100).toFixed(1)}%`,
        trend: operationalArticles > 0 ? 'up' : 'neutral',
        icon: '⚙️',
        color: 'purple'
      },
      {
        title: 'AI Metadata Insights',
        value: `${aiArticles}`,
        change: `${((aiArticles / Math.max(totalArticles, 1)) * 100).toFixed(1)}%`,
        trend: aiArticles > 0 ? 'up' : 'neutral',
        icon: '🤖',
        color: 'orange'
      },
      {
        title: 'Policy Projects',
        value: dashboard.summary_metrics.policy_projects.toString(),
        change: '+8%',
        trend: 'up',
        icon: '📋',
        color: 'red'
      },
      {
        title: 'Minister Mentions',
        value: dashboard.summary_metrics.minister_mentions.toString(),
        change: '+15%',
        trend: 'up',
        icon: '👔',
        color: 'indigo'
      }
    ];
  }, [dashboard]);

  // Metrics distribution data
  const metricsDistribution = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        name: 'Primary Metrics',
        value: dashboard.summary_metrics.primary_metrics_articles,
        color: METRIC_COLORS.primary
      },
      {
        name: 'Operational Metrics',
        value: dashboard.summary_metrics.operational_metrics_articles,
        color: METRIC_COLORS.operational
      },
      {
        name: 'AI Metadata',
        value: dashboard.summary_metrics.ai_metadata_articles,
        color: METRIC_COLORS.ai
      },
      {
        name: 'Minister Analysis',
        value: dashboard.summary_metrics.minister_mentions,
        color: METRIC_COLORS.minister
      },
      {
        name: 'Policy Analysis',
        value: dashboard.summary_metrics.policy_projects,
        color: METRIC_COLORS.policy
      },
      {
        name: 'Media Analysis',
        value: dashboard.summary_metrics.media_sentiment_articles,
        color: METRIC_COLORS.media
      }
    ];
  }, [dashboard]);

  // Primary metrics breakdown
  const primaryMetricsBreakdown = useMemo(() => {
    if (!dashboard || !dashboard.primary_metrics.length) return [];

    const categories = {
      'Economic Growth': 0,
      'Productivity & Innovation': 0,
      'Social Welfare': 0,
      'Environmental & Energy': 0,
      'Healthcare Capacity': 0,
      'Governance & Digital': 0
    };

    dashboard.primary_metrics.forEach(metric => {
      if (metric.economic_growth_indicators.investment_projects.length ||
          metric.economic_growth_indicators.export_promotion.length ||
          metric.economic_growth_indicators.foreign_investment.length) {
        categories['Economic Growth']++;
      }
      if (metric.productivity_innovation_indicators.innovation_policies.length ||
          metric.productivity_innovation_indicators.startup_support.length ||
          metric.productivity_innovation_indicators.digital_transformation.length) {
        categories['Productivity & Innovation']++;
      }
      if (metric.social_welfare_inequality_indicators.poverty_reduction.length ||
          metric.social_welfare_inequality_indicators.social_protection.length ||
          metric.social_welfare_inequality_indicators.education_access.length) {
        categories['Social Welfare']++;
      }
      if (metric.environmental_energy_indicators.renewable_energy.length ||
          metric.environmental_energy_indicators.carbon_reduction.length ||
          metric.environmental_energy_indicators.conservation_projects.length) {
        categories['Environmental & Energy']++;
      }
      if (metric.healthcare_capacity.hospital_construction.length ||
          metric.healthcare_capacity.medical_personnel.length ||
          metric.healthcare_capacity.health_insurance.length) {
        categories['Healthcare Capacity']++;
      }
      if (metric.governance_digital_government_indicators.e_governance.length ||
          metric.governance_digital_government_indicators.transparency_measures.length ||
          metric.governance_digital_government_indicators.anti_corruption.length) {
        categories['Governance & Digital']++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [dashboard]);

  // Operational metrics breakdown
  const operationalMetricsBreakdown = useMemo(() => {
    if (!dashboard || !dashboard.operational_metrics.length) return [];

    const categories = {
      'Project Status': 0,
      'Budget Indicators': 0,
      'Impact Assessment': 0,
      'Geographic Coverage': 0,
      'Beneficiary Groups': 0
    };

    dashboard.operational_metrics.forEach(metric => {
      if (metric.project_status.announced_projects.length ||
          metric.project_status.in_progress_projects.length ||
          metric.project_status.completed_projects.length) {
        categories['Project Status']++;
      }
      if (metric.budget_indicators.allocated_budgets.length ||
          metric.budget_indicators.funding_sources.length) {
        categories['Budget Indicators']++;
      }
      if (metric.impact_assessment.expected_benefits.length ||
          metric.impact_assessment.performance_metrics.length) {
        categories['Impact Assessment']++;
      }
      if (metric.geographic_coverage.provinces_covered.length ||
          metric.geographic_coverage.regions_affected.length) {
        categories['Geographic Coverage']++;
      }
      if (metric.beneficiary_groups.target_population.length ||
          metric.beneficiary_groups.business_sectors.length) {
        categories['Beneficiary Groups']++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [dashboard]);

  // AI metadata breakdown
  const aiMetadataBreakdown = useMemo(() => {
    if (!dashboard || !dashboard.ai_metadata.length) return [];

    const categories = {
      'Enhanced Entities': 0,
      'Topic Classification': 0,
      'Policy Sentiment': 0,
      'Timeline Markers': 0,
      'Risk Tags': 0
    };

    dashboard.ai_metadata.forEach(metric => {
      if (metric.enhanced_entities.government_agencies.length ||
          metric.enhanced_entities.provinces_municipalities.length) {
        categories['Enhanced Entities']++;
      }
      if (metric.topic_classification.primary_category !== 'other') {
        categories['Topic Classification']++;
      }
      if (metric.policy_sentiment.policy_effectiveness !== 'unclear') {
        categories['Policy Sentiment']++;
      }
      if (metric.timeline_markers.immediate_actions.length ||
          metric.timeline_markers.medium_term_goals.length) {
        categories['Timeline Markers']++;
      }
      if (metric.risk_tags.regulatory_risks.length ||
          metric.risk_tags.financial_risks.length ||
          metric.risk_tags.operational_risks.length) {
        categories['Risk Tags']++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [dashboard]);

  // Sentiment analysis data
  const sentimentData = useMemo(() => {
    if (!dashboard || !dashboard.media_sentiment_metrics.length) return [];

    const sentiments = { positive: 0, negative: 0, neutral: 0 };
    dashboard.media_sentiment_metrics.forEach(metric => {
      const sentiment = metric.sentiment_analysis.overall_sentiment;
      if (sentiments.hasOwnProperty(sentiment)) {
        sentiments[sentiment as keyof typeof sentiments]++;
      }
    });

    return Object.entries(sentiments).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [dashboard]);

  // Risk analysis data
  const riskAnalysisData = useMemo(() => {
    if (!dashboard || !dashboard.ai_metadata.length) return [];

    const risks = {
      regulatory: 0,
      financial: 0,
      operational: 0,
      political: 0,
      external: 0
    };

    dashboard.ai_metadata.forEach(metric => {
      risks.regulatory += metric.risk_tags.regulatory_risks.length;
      risks.financial += metric.risk_tags.financial_risks.length;
      risks.operational += metric.risk_tags.operational_risks.length;
      risks.political += metric.risk_tags.political_risks.length;
      risks.external += metric.risk_tags.external_risks.length;
    });

    return Object.entries(risks).map(([name, value]) => ({
      risk: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [dashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-center text-red-500">
              {error || 'No BI dashboard data available'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Business Intelligence Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Advanced analytics and metrics visualization for government news data mining
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Last updated: {new Date(dashboard.generated_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{kpi.icon}</span>
                <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                  kpi.trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  kpi.trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {kpi.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {kpi.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  {kpi.trend === 'neutral' && <Minus className="w-3 h-3" />}
                  {kpi.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="all">All Categories</option>
              <option value="primary">Primary Metrics</option>
              <option value="operational">Operational Metrics</option>
              <option value="ai">AI Metadata</option>
              <option value="policy">Policy Analysis</option>
              <option value="media">Media Analysis</option>
            </select>

            <select
              value={filters.sentiment}
              onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Main BI Views */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">BI Views</h3>
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'metrics-distribution', label: 'Metrics Distribution', icon: '📈' },
                  { id: 'primary-metrics', label: 'Primary Metrics', icon: '🎯' },
                  { id: 'operational-metrics', label: 'Operational Metrics', icon: '⚙️' },
                  { id: 'ai-metadata', label: 'AI Metadata', icon: '🤖' },
                  { id: 'sentiment-analysis', label: 'Sentiment Analysis', icon: '😊' },
                  { id: 'risk-analysis', label: 'Risk Analysis', icon: '⚠️' },
                  { id: 'comparative', label: 'Comparative Analysis', icon: '⚖️' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeView === view.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="mr-2">{view.icon}</span>
                    {view.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3">
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Metrics Distribution Overview */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Metrics Coverage Overview
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={metricsDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Key Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Topic Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(dashboard.topic_distribution).map(([topic, count]) => ({
                            name: topic.replace('_', ' ').toUpperCase(),
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {Object.entries(dashboard.topic_distribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Trending Topics Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboard.trending_topics.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'frequency' ? `${value} mentions` : `${value}% growth`,
                            name === 'frequency' ? 'Frequency' : 'Growth Rate'
                          ]}
                        />
                        <Bar dataKey="frequency" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'metrics-distribution' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Comprehensive Metrics Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={metricsDistribution}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis />
                      <Radar
                        name="Coverage"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {metricsDistribution.map((metric, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {metric.name}
                        </h4>
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: metric.color }}
                        ></div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {metric.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Articles analyzed
                      </div>
                      <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(metric.value / Math.max(...metricsDistribution.map(m => m.value))) * 100}%`,
                            backgroundColor: metric.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'primary-metrics' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Primary Metrics Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={primaryMetricsBreakdown} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {primaryMetricsBreakdown.map((category, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {category.name}
                      </h4>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {category.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Articles with data
                      </div>
                    </div>
                  ))}
                </div>

                {/* Individual Articles with Primary Metrics */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Articles with Primary Metrics ({dashboard.primary_metrics.length})
                  </h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {dashboard.primary_metrics.map((article) => (
                      <div key={article.article_id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {article.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Analyzed: {new Date(article.analyzed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedArticle(article);
                              setShowArticleModal(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Article
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Economic Growth */}
                          {(article.economic_growth_indicators.investment_projects.length > 0 ||
                            article.economic_growth_indicators.export_promotion.length > 0 ||
                            article.economic_growth_indicators.foreign_investment.length > 0) && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Economic Growth</h5>
                              <div className="space-y-1 text-sm">
                                {article.economic_growth_indicators.investment_projects.length > 0 && (
                                  <p className="text-green-700 dark:text-green-300">
                                    💰 {article.economic_growth_indicators.investment_projects.length} investment projects
                                  </p>
                                )}
                                {article.economic_growth_indicators.export_promotion.length > 0 && (
                                  <p className="text-green-700 dark:text-green-300">
                                    📈 {article.economic_growth_indicators.export_promotion.length} export promotions
                                  </p>
                                )}
                                {article.economic_growth_indicators.foreign_investment.length > 0 && (
                                  <p className="text-green-700 dark:text-green-300">
                                    🌍 {article.economic_growth_indicators.foreign_investment.length} foreign investments
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Productivity & Innovation */}
                          {(article.productivity_innovation_indicators.innovation_policies.length > 0 ||
                            article.productivity_innovation_indicators.startup_support.length > 0 ||
                            article.productivity_innovation_indicators.digital_transformation.length > 0) && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Productivity & Innovation</h5>
                              <div className="space-y-1 text-sm">
                                {article.productivity_innovation_indicators.innovation_policies.length > 0 && (
                                  <p className="text-purple-700 dark:text-purple-300">
                                    💡 {article.productivity_innovation_indicators.innovation_policies.length} innovation policies
                                  </p>
                                )}
                                {article.productivity_innovation_indicators.startup_support.length > 0 && (
                                  <p className="text-purple-700 dark:text-purple-300">
                                    🚀 {article.productivity_innovation_indicators.startup_support.length} startup supports
                                  </p>
                                )}
                                {article.productivity_innovation_indicators.digital_transformation.length > 0 && (
                                  <p className="text-purple-700 dark:text-purple-300">
                                    💻 {article.productivity_innovation_indicators.digital_transformation.length} digital transformations
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Social Welfare */}
                          {(article.social_welfare_inequality_indicators.poverty_reduction.length > 0 ||
                            article.social_welfare_inequality_indicators.social_protection.length > 0 ||
                            article.social_welfare_inequality_indicators.education_access.length > 0) && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Social Welfare</h5>
                              <div className="space-y-1 text-sm">
                                {article.social_welfare_inequality_indicators.poverty_reduction.length > 0 && (
                                  <p className="text-blue-700 dark:text-blue-300">
                                    🤝 {article.social_welfare_inequality_indicators.poverty_reduction.length} poverty reductions
                                  </p>
                                )}
                                {article.social_welfare_inequality_indicators.social_protection.length > 0 && (
                                  <p className="text-blue-700 dark:text-blue-300">
                                    🛡️ {article.social_welfare_inequality_indicators.social_protection.length} social protections
                                  </p>
                                )}
                                {article.social_welfare_inequality_indicators.education_access.length > 0 && (
                                  <p className="text-blue-700 dark:text-blue-300">
                                    📚 {article.social_welfare_inequality_indicators.education_access.length} education accesses
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Environmental & Energy */}
                          {(article.environmental_energy_indicators.renewable_energy.length > 0 ||
                            article.environmental_energy_indicators.carbon_reduction.length > 0 ||
                            article.environmental_energy_indicators.conservation_projects.length > 0) && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                              <h5 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Environmental & Energy</h5>
                              <div className="space-y-1 text-sm">
                                {article.environmental_energy_indicators.renewable_energy.length > 0 && (
                                  <p className="text-emerald-700 dark:text-emerald-300">
                                    🌱 {article.environmental_energy_indicators.renewable_energy.length} renewable energy initiatives
                                  </p>
                                )}
                                {article.environmental_energy_indicators.carbon_reduction.length > 0 && (
                                  <p className="text-emerald-700 dark:text-emerald-300">
                                    🌍 {article.environmental_energy_indicators.carbon_reduction.length} carbon reductions
                                  </p>
                                )}
                                {article.environmental_energy_indicators.conservation_projects.length > 0 && (
                                  <p className="text-emerald-700 dark:text-emerald-300">
                                    🏞️ {article.environmental_energy_indicators.conservation_projects.length} conservation projects
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Healthcare Capacity */}
                          {(article.healthcare_capacity.hospital_construction.length > 0 ||
                            article.healthcare_capacity.medical_personnel.length > 0 ||
                            article.healthcare_capacity.health_insurance.length > 0) && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                              <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Healthcare Capacity</h5>
                              <div className="space-y-1 text-sm">
                                {article.healthcare_capacity.hospital_construction.length > 0 && (
                                  <p className="text-red-700 dark:text-red-300">
                                    🏥 {article.healthcare_capacity.hospital_construction.length} hospital constructions
                                  </p>
                                )}
                                {article.healthcare_capacity.medical_personnel.length > 0 && (
                                  <p className="text-red-700 dark:text-red-300">
                                    👨‍⚕️ {article.healthcare_capacity.medical_personnel.length} medical personnel initiatives
                                  </p>
                                )}
                                {article.healthcare_capacity.health_insurance.length > 0 && (
                                  <p className="text-red-700 dark:text-red-300">
                                    🩺 {article.healthcare_capacity.health_insurance.length} health insurance programs
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Governance & Digital */}
                          {(article.governance_digital_government_indicators.e_governance.length > 0 ||
                            article.governance_digital_government_indicators.transparency_measures.length > 0 ||
                            article.governance_digital_government_indicators.anti_corruption.length > 0) && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                              <h5 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Governance & Digital</h5>
                              <div className="space-y-1 text-sm">
                                {article.governance_digital_government_indicators.e_governance.length > 0 && (
                                  <p className="text-indigo-700 dark:text-indigo-300">
                                    💻 {article.governance_digital_government_indicators.e_governance.length} e-governance initiatives
                                  </p>
                                )}
                                {article.governance_digital_government_indicators.transparency_measures.length > 0 && (
                                  <p className="text-indigo-700 dark:text-indigo-300">
                                    👁️ {article.governance_digital_government_indicators.transparency_measures.length} transparency measures
                                  </p>
                                )}
                                {article.governance_digital_government_indicators.anti_corruption.length > 0 && (
                                  <p className="text-indigo-700 dark:text-indigo-300">
                                    ⚖️ {article.governance_digital_government_indicators.anti_corruption.length} anti-corruption measures
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'operational-metrics' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Operational Metrics Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={operationalMetricsBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {operationalMetricsBreakdown.map((category, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {category.name}
                      </h4>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {category.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Articles with data
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'ai-metadata' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    AI Metadata Insights Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={aiMetadataBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#F59E0B" />
                      <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiMetadataBreakdown.map((category, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {category.name}
                      </h4>
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {category.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Articles with insights
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'sentiment-analysis' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Media Sentiment Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name === 'Positive' ? '#10B981' :
                            entry.name === 'Negative' ? '#EF4444' :
                            '#6B7280'
                          } />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sentimentData.map((sentiment, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {sentiment.name} Sentiment
                      </h4>
                      <div className={`text-2xl font-bold mb-1 ${
                        sentiment.name === 'Positive' ? 'text-green-600' :
                        sentiment.name === 'Negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {sentiment.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Articles
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'risk-analysis' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Risk Analysis Dashboard
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={riskAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="risk" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Risk Categories Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {riskAnalysisData.map((risk, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {risk.risk} Risks
                        </h4>
                        <div className="text-xl font-bold text-red-600 mb-1">
                          {risk.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Identified risks
                        </div>
                        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{
                              width: `${(risk.value / Math.max(...riskAnalysisData.map(r => r.value))) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'comparative' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Comparative Metrics Analysis
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                        Metrics Coverage Comparison
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={metricsDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                        Primary vs Operational Metrics
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <ScatterChart data={[
                          { x: dashboard.summary_metrics.primary_metrics_articles, y: dashboard.summary_metrics.operational_metrics_articles, name: 'Current State' }
                        ]}>
                          <CartesianGrid />
                          <XAxis type="number" dataKey="x" name="Primary Metrics" />
                          <YAxis type="number" dataKey="y" name="Operational Metrics" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="Metrics" dataKey="y" fill="#8884d8" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Performance Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {((dashboard.summary_metrics.primary_metrics_articles / Math.max(dashboard.summary_metrics.total_articles_analyzed, 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Primary Metrics Coverage
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {((dashboard.summary_metrics.operational_metrics_articles / Math.max(dashboard.summary_metrics.total_articles_analyzed, 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Operational Metrics Coverage
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {((dashboard.summary_metrics.ai_metadata_articles / Math.max(dashboard.summary_metrics.total_articles_analyzed, 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        AI Metadata Coverage
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {dashboard.summary_metrics.policy_projects}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Policy Projects Identified
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Article Modal */}
        {showArticleModal && selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Article Details
                </h2>
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedArticle.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Article ID: {selectedArticle.article_id} | Analyzed: {new Date(selectedArticle.analyzed_at).toLocaleString()}
                  </p>
                </div>

                {/* Primary Metrics Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Primary Metrics Extracted
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Economic Growth */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-800 dark:text-green-200 mb-3">Economic Growth Indicators</h5>
                      <div className="space-y-2">
                        {selectedArticle.economic_growth_indicators.gdp_growth && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <strong>GDP Growth:</strong> {selectedArticle.economic_growth_indicators.gdp_growth}
                          </p>
                        )}
                        {selectedArticle.economic_growth_indicators.investment_projects.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Investment Projects:</p>
                            <ul className="text-sm text-green-600 dark:text-green-400 list-disc list-inside space-y-1">
                              {selectedArticle.economic_growth_indicators.investment_projects.map((project: string, idx: number) => (
                                <li key={idx}>{project}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.economic_growth_indicators.export_promotion.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Export Promotion:</p>
                            <ul className="text-sm text-green-600 dark:text-green-400 list-disc list-inside space-y-1">
                              {selectedArticle.economic_growth_indicators.export_promotion.map((promotion: string, idx: number) => (
                                <li key={idx}>{promotion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.economic_growth_indicators.foreign_investment.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Foreign Investment:</p>
                            <ul className="text-sm text-green-600 dark:text-green-400 list-disc list-inside space-y-1">
                              {selectedArticle.economic_growth_indicators.foreign_investment.map((investment: string, idx: number) => (
                                <li key={idx}>{investment}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Productivity & Innovation */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">Productivity & Innovation</h5>
                      <div className="space-y-2">
                        {selectedArticle.productivity_innovation_indicators.innovation_policies.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Innovation Policies:</p>
                            <ul className="text-sm text-purple-600 dark:text-purple-400 list-disc list-inside space-y-1">
                              {selectedArticle.productivity_innovation_indicators.innovation_policies.map((policy: string, idx: number) => (
                                <li key={idx}>{policy}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.productivity_innovation_indicators.startup_support.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Startup Support:</p>
                            <ul className="text-sm text-purple-600 dark:text-purple-400 list-disc list-inside space-y-1">
                              {selectedArticle.productivity_innovation_indicators.startup_support.map((support: string, idx: number) => (
                                <li key={idx}>{support}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.productivity_innovation_indicators.research_funding.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Research Funding:</p>
                            <ul className="text-sm text-purple-600 dark:text-purple-400 list-disc list-inside space-y-1">
                              {selectedArticle.productivity_innovation_indicators.research_funding.map((funding: string, idx: number) => (
                                <li key={idx}>{funding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.productivity_innovation_indicators.digital_transformation.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Digital Transformation:</p>
                            <ul className="text-sm text-purple-600 dark:text-purple-400 list-disc list-inside space-y-1">
                              {selectedArticle.productivity_innovation_indicators.digital_transformation.map((transformation: string, idx: number) => (
                                <li key={idx}>{transformation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Social Welfare */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Social Welfare & Inequality</h5>
                      <div className="space-y-2">
                        {selectedArticle.social_welfare_inequality_indicators.poverty_reduction.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Poverty Reduction:</p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                              {selectedArticle.social_welfare_inequality_indicators.poverty_reduction.map((reduction: string, idx: number) => (
                                <li key={idx}>{reduction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.social_welfare_inequality_indicators.income_distribution.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Income Distribution:</p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                              {selectedArticle.social_welfare_inequality_indicators.income_distribution.map((distribution: string, idx: number) => (
                                <li key={idx}>{distribution}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.social_welfare_inequality_indicators.social_protection.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Social Protection:</p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                              {selectedArticle.social_welfare_inequality_indicators.social_protection.map((protection: string, idx: number) => (
                                <li key={idx}>{protection}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.social_welfare_inequality_indicators.education_access.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Education Access:</p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                              {selectedArticle.social_welfare_inequality_indicators.education_access.map((access: string, idx: number) => (
                                <li key={idx}>{access}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Environmental & Energy */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">Environmental & Energy</h5>
                      <div className="space-y-2">
                        {selectedArticle.environmental_energy_indicators.renewable_energy.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Renewable Energy:</p>
                            <ul className="text-sm text-emerald-600 dark:text-emerald-400 list-disc list-inside space-y-1">
                              {selectedArticle.environmental_energy_indicators.renewable_energy.map((energy: string, idx: number) => (
                                <li key={idx}>{energy}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.environmental_energy_indicators.carbon_reduction.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Carbon Reduction:</p>
                            <ul className="text-sm text-emerald-600 dark:text-emerald-400 list-disc list-inside space-y-1">
                              {selectedArticle.environmental_energy_indicators.carbon_reduction.map((reduction: string, idx: number) => (
                                <li key={idx}>{reduction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.environmental_energy_indicators.conservation_projects.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Conservation Projects:</p>
                            <ul className="text-sm text-emerald-600 dark:text-emerald-400 list-disc list-inside space-y-1">
                              {selectedArticle.environmental_energy_indicators.conservation_projects.map((project: string, idx: number) => (
                                <li key={idx}>{project}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.environmental_energy_indicators.climate_adaptation.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Climate Adaptation:</p>
                            <ul className="text-sm text-emerald-600 dark:text-emerald-400 list-disc list-inside space-y-1">
                              {selectedArticle.environmental_energy_indicators.climate_adaptation.map((adaptation: string, idx: number) => (
                                <li key={idx}>{adaptation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Healthcare Capacity */}
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-red-800 dark:text-red-200 mb-3">Healthcare Capacity</h5>
                      <div className="space-y-2">
                        {selectedArticle.healthcare_capacity.hospital_construction.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Hospital Construction:</p>
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                              {selectedArticle.healthcare_capacity.hospital_construction.map((construction: string, idx: number) => (
                                <li key={idx}>{construction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.healthcare_capacity.medical_personnel.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Medical Personnel:</p>
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                              {selectedArticle.healthcare_capacity.medical_personnel.map((personnel: string, idx: number) => (
                                <li key={idx}>{personnel}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.healthcare_capacity.health_insurance.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Health Insurance:</p>
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                              {selectedArticle.healthcare_capacity.health_insurance.map((insurance: string, idx: number) => (
                                <li key={idx}>{insurance}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.healthcare_capacity.disease_prevention.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Disease Prevention:</p>
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                              {selectedArticle.healthcare_capacity.disease_prevention.map((prevention: string, idx: number) => (
                                <li key={idx}>{prevention}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Governance & Digital */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3">Governance & Digital Government</h5>
                      <div className="space-y-2">
                        {selectedArticle.governance_digital_government_indicators.e_governance.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">E-Governance:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.governance_digital_government_indicators.e_governance.map((governance: string, idx: number) => (
                                <li key={idx}>{governance}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.governance_digital_government_indicators.transparency_measures.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">Transparency Measures:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.governance_digital_government_indicators.transparency_measures.map((measure: string, idx: number) => (
                                <li key={idx}>{measure}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.governance_digital_government_indicators.anti_corruption.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">Anti-Corruption:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.governance_digital_government_indicators.anti_corruption.map((corruption: string, idx: number) => (
                                <li key={idx}>{corruption}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.governance_digital_government_indicators.public_service_digitalization.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">Public Service Digitalization:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.governance_digital_government_indicators.public_service_digitalization.map((digitalization: string, idx: number) => (
                                <li key={idx}>{digitalization}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Original Article Content Placeholder */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Original Article Content
                    </h4>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      View Full Article
                    </button>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 italic">
                    Note: The original article content would be displayed here. In a full implementation,
                    this would fetch and display the complete article text from the source or database.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}