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
  Radar,
  LineChart
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Download, Filter, RefreshCw, Eye, X, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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
    source_url?: string;
    full_content?: string;
    primary_socioeconomic_category: string;
    category_confidence: number;
    category_reasoning: string;
    economic_growth_competitiveness: {
      gdp_growth_rate: string | null;
      productivity_indicators: {
        tfp_total_factor_productivity: string | null;
        labor_productivity: string | null;
      };
      investment_volume: {
        fdi_foreign_direct_investment: string | null;
        domestic_investment: string | null;
      };
      innovation_economy: {
        innovation_index: string | null;
        patent_filings: string | null;
      };
      digital_economy_share: string | null;
      export_value: {
        overall_export_value: string | null;
        key_sector_exports: string[];
      };
      sme_performance: {
        sme_contribution_gdp: string | null;
        sme_growth_rate: string | null;
        sme_employment_share: string | null;
      };
      digital_technology_adoption: {
        ai_adoption_rate: string | null;
        cloud_computing_usage: string | null;
        automation_implementation: string | null;
      };
      news_signals_economic: string[];
    };
    human_resource_development: {
      education_quality: {
        pisa_scores: string | null;
        literacy_rate: string | null;
        education_index: string | null;
      };
      stem_graduates: {
        stem_graduate_numbers: string | null;
        stem_graduate_growth: string | null;
      };
      skill_upgrading: {
        reskilling_programs: string[];
        upskilling_initiatives: string[];
        skill_gap_reduction: string | null;
      };
      digital_economy_workforce_readiness: {
        digital_skills_training: string[];
        ict_competency_levels: string | null;
        digital_workforce_readiness_index: string | null;
      };
      employment_indicators: {
        unemployment_rate: string | null;
        employment_rate: string | null;
        youth_unemployment: string | null;
      };
      labor_market_wages: {
        average_wage_growth: string | null;
        minimum_wage_adjustments: string | null;
        wage_inequality_metrics: string | null;
      };
      news_signals_hr: string[];
    };
    social_welfare_inequality_reduction: {
      income_inequality: {
        gini_coefficient: string | null;
        income_inequality_trend: string | null;
      };
      household_debt: {
        household_debt_gdp_ratio: string | null;
        debt_reduction_programs: string[];
      };
      poverty_indicators: {
        poverty_rate: string | null;
        poverty_reduction_target: string | null;
        extreme_poverty_rate: string | null;
      };
      cost_of_living: {
        inflation_rate: string | null;
        cost_of_living_index: string | null;
        basic_needs_cost: string | null;
      };
      social_welfare_coverage: {
        social_security_coverage: string | null;
        welfare_recipients: string | null;
        welfare_benefits_expansion: string[];
      };
      healthcare_access: {
        universal_healthcare_coverage: string | null;
        healthcare_access_improvements: string[];
      };
      government_benefits_access: {
        benefits_digital_access: string | null;
        benefits_application_simplification: string[];
      };
      news_signals_social: string[];
    };
    health_security_public_health: {
      hospital_capacity_upgrades: {
        hospitals_upgraded: string | null;
        new_hospital_construction: string | null;
        bed_capacity_expansion: string | null;
      };
      healthcare_coverage_metrics: {
        healthcare_coverage_rate: string | null;
        insurance_coverage_expansion: string | null;
      };
      public_health_capacity: {
        beds_per_population: string | null;
        healthcare_workers_per_population: string | null;
        medical_equipment_availability: string | null;
      };
      digital_health_adoption: {
        telemedicine_implementation: string | null;
        digital_health_records: string | null;
        health_apps_utilization: string | null;
      };
      communicable_disease_trends: {
        disease_surveillance_systems: string[];
        vaccination_coverage: string | null;
        pandemic_preparedness: string[];
      };
      news_signals_health: string[];
    };
    food_energy_environmental_security: {
      renewable_energy_share: {
        renewable_energy_percentage: string | null;
        renewable_energy_targets: string | null;
        solar_wind_capacity: string | null;
      };
      carbon_emission_reduction: {
        carbon_reduction_targets: string | null;
        emission_reduction_achievements: string | null;
        climate_commitments: string[];
      };
      air_quality_indicators: {
        pm25_levels: string | null;
        air_quality_improvements: string | null;
        pollution_reduction_measures: string[];
      };
      water_resource_management: {
        water_resource_index: string | null;
        water_security_measures: string[];
        drought_flood_management: string[];
      };
      waste_management_performance: {
        waste_recycling_rate: string | null;
        waste_management_infrastructure: string[];
        circular_economy_initiatives: string[];
      };
      food_security_indicators: {
        food_security_index: string | null;
        agricultural_productivity: string | null;
        food_supply_chain_resilience: string[];
      };
      news_signals_environment: string[];
    };
    public_administration_governance: {
      e_government_adoption: {
        e_gov_services_coverage: string | null;
        digital_service_utilization: string | null;
        online_transaction_volume: string | null;
      };
      g_cloud_usage: {
        government_cloud_migration: string | null;
        cloud_service_adoption: string | null;
      };
      open_data_metrics: {
        open_data_portals: string | null;
        data_availability_index: string | null;
        public_data_utilization: string | null;
      };
      public_sector_modernization: {
        digital_transformation_initiatives: string[];
        process_automation: string[];
        service_delivery_improvements: string[];
      };
      anti_corruption_performance: {
        corruption_perception_index: string | null;
        anti_corruption_measures: string[];
        transparency_improvements: string[];
      };
      news_signals_governance: string[];
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

// Dynamic chart generation interface
interface DynamicChart {
  type: 'bar' | 'area' | 'pie' | 'line' | 'scatter';
  title: string;
  data: (Record<string, string | number>)[];
  dataKey: string;
  xAxisKey?: string;
  yAxisKey?: string;
}

export default function BIDashboard() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('primary-metrics');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [filters, setFilters] = useState({
    category: 'all',
    sentiment: 'all',
    region: 'all'
  });
  const [selectedArticle, setSelectedArticle] = useState<AnalyticsDashboard['primary_metrics'][0] | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState<string | null>(null);

  // Dynamic chart generation
  const [prompt, setPrompt] = useState('');
  const [dynamicChart, setDynamicChart] = useState<DynamicChart | null>(null);
  const [showDynamicChart, setShowDynamicChart] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');

  // Language hook
  const { t } = useLanguage();

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
        title: t('bi.totalArticlesAnalyzed'),
        value: totalArticles.toLocaleString(),
        change: '+12%',
        trend: 'up',
        icon: '📊',
        color: 'blue'
      },
      {
        title: t('bi.primaryMetricsCoverage'),
        value: `${primaryArticles}`,
        change: `${((primaryArticles / Math.max(totalArticles, 1)) * 100).toFixed(1)}%`,
        trend: primaryArticles > 0 ? 'up' : 'neutral',
        icon: '🎯',
        color: 'green'
      },
      {
        title: t('bi.operationalMetrics'),
        value: `${operationalArticles}`,
        change: `${((operationalArticles / Math.max(totalArticles, 1)) * 100).toFixed(1)}%`,
        trend: operationalArticles > 0 ? 'up' : 'neutral',
        icon: '⚙️',
        color: 'purple'
      },
      {
        title: t('bi.aiMetadataInsights'),
        value: `${aiArticles}`,
        change: `${((aiArticles / Math.max(totalArticles, 1)) * 100).toFixed(1)}%`,
        trend: aiArticles > 0 ? 'up' : 'neutral',
        icon: '🤖',
        color: 'orange'
      },
      {
        title: t('bi.policyProjects'),
        value: dashboard.summary_metrics.policy_projects.toString(),
        change: '+8%',
        trend: 'up',
        icon: '📋',
        color: 'red'
      },
      {
        title: t('bi.ministerMentions'),
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
        name: t('bi.primaryMetrics'),
        value: dashboard.summary_metrics.primary_metrics_articles,
        color: METRIC_COLORS.primary
      },
      {
        name: t('bi.operationalMetrics'),
        value: dashboard.summary_metrics.operational_metrics_articles,
        color: METRIC_COLORS.operational
      },
      {
        name: t('bi.aiMetadata'),
        value: dashboard.summary_metrics.ai_metadata_articles,
        color: METRIC_COLORS.ai
      },
      {
        name: t('bi.ministerAnalysis'),
        value: dashboard.summary_metrics.minister_mentions,
        color: METRIC_COLORS.minister
      },
      {
        name: t('bi.policyAnalysis'),
        value: dashboard.summary_metrics.policy_projects,
        color: METRIC_COLORS.policy
      },
      {
        name: t('bi.mediaAnalysis'),
        value: dashboard.summary_metrics.media_sentiment_articles,
        color: METRIC_COLORS.media
      }
    ];
  }, [dashboard, t]);

  // Primary metrics breakdown
  const primaryMetricsBreakdown = useMemo(() => {
    if (!dashboard || !dashboard.primary_metrics.length) return [];

    const categories = {
      [t('bi.category.economicGrowth')]: 0,
      [t('bi.category.humanResource')]: 0,
      [t('bi.category.socialWelfare')]: 0,
      [t('bi.category.healthSecurity')]: 0,
      [t('bi.category.environmentalSecurity')]: 0,
      [t('bi.category.governance')]: 0
    };

    // Map the API category names to display names
    const categoryMapping = {
      'ECONOMIC_GROWTH_COMPETITIVENESS': t('bi.category.economicGrowth'),
      'HUMAN_RESOURCE_DEVELOPMENT': t('bi.category.humanResource'),
      'SOCIAL_WELFARE_INEQUALITY_REDUCTION': t('bi.category.socialWelfare'),
      'HEALTH_SECURITY_PUBLIC_HEALTH': t('bi.category.healthSecurity'),
      'FOOD_ENERGY_ENVIRONMENTAL_SECURITY': t('bi.category.environmentalSecurity'),
      'PUBLIC_ADMINISTRATION_GOVERNANCE': t('bi.category.governance')
    };

    dashboard.primary_metrics.forEach(metric => {
      const category = metric.primary_socioeconomic_category;
      if (category && categoryMapping[category as keyof typeof categoryMapping]) {
        const displayName = categoryMapping[category as keyof typeof categoryMapping];
        categories[displayName as keyof typeof categories]++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [dashboard, t]);

  // Operational metrics breakdown
  const operationalMetricsBreakdown = useMemo(() => {
    if (!dashboard || !dashboard.operational_metrics.length) return [];

    const categories = {
      [t('bi.projectStatus')]: 0,
      [t('bi.budgetIndicators')]: 0,
      [t('bi.impactAssessment')]: 0,
      [t('bi.geographicCoverage')]: 0,
      [t('bi.beneficiaryGroups')]: 0
    };

    dashboard.operational_metrics.forEach(metric => {
      if (metric.project_status.announced_projects.length ||
          metric.project_status.in_progress_projects.length ||
          metric.project_status.completed_projects.length) {
        categories[t('bi.projectStatus')]++;
      }
      if (metric.budget_indicators.allocated_budgets.length ||
          metric.budget_indicators.funding_sources.length) {
        categories[t('bi.budgetIndicators')]++;
      }
      if (metric.impact_assessment.expected_benefits.length ||
          metric.impact_assessment.performance_metrics.length) {
        categories[t('bi.impactAssessment')]++;
      }
      if (metric.geographic_coverage.provinces_covered.length ||
          metric.geographic_coverage.regions_affected.length) {
        categories[t('bi.geographicCoverage')]++;
      }
      if (metric.beneficiary_groups.target_population.length ||
          metric.beneficiary_groups.business_sectors.length) {
        categories[t('bi.beneficiaryGroups')]++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [dashboard, t]);

  // AI metadata breakdown
  const aiMetadataBreakdown = useMemo(() => {
    if (!dashboard || !dashboard.ai_metadata.length) return [];

    const categories = {
      [t('bi.enhancedEntities')]: 0,
      [t('bi.topicClassification')]: 0,
      [t('bi.policySentiment')]: 0,
      [t('bi.timelineMarkers')]: 0,
      [t('bi.riskTags')]: 0
    };

    dashboard.ai_metadata.forEach(metric => {
      if (metric.enhanced_entities.government_agencies.length ||
          metric.enhanced_entities.provinces_municipalities.length) {
        categories[t('bi.enhancedEntities')]++;
      }
      if (metric.topic_classification.primary_category !== 'other') {
        categories[t('bi.topicClassification')]++;
      }
      if (metric.policy_sentiment.policy_effectiveness !== 'unclear') {
        categories[t('bi.policySentiment')]++;
      }
      if (metric.timeline_markers.immediate_actions.length ||
          metric.timeline_markers.medium_term_goals.length) {
        categories[t('bi.timelineMarkers')]++;
      }
      if (metric.risk_tags.regulatory_risks.length ||
          metric.risk_tags.financial_risks.length ||
          metric.risk_tags.operational_risks.length) {
        categories[t('bi.riskTags')]++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [dashboard, t]);

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

  // Filtered articles based on selected category
  const filteredPrimaryMetrics = useMemo(() => {
    if (!dashboard || !dashboard.primary_metrics.length) return [];

    if (!selectedPrimaryCategory) return dashboard.primary_metrics;

    // Map display names back to API category names
    const categoryMappingReverse = {
      [t('bi.category.economicGrowth')]: 'ECONOMIC_GROWTH_COMPETITIVENESS',
      [t('bi.category.humanResource')]: 'HUMAN_RESOURCE_DEVELOPMENT',
      [t('bi.category.socialWelfare')]: 'SOCIAL_WELFARE_INEQUALITY_REDUCTION',
      [t('bi.category.healthSecurity')]: 'HEALTH_SECURITY_PUBLIC_HEALTH',
      [t('bi.category.environmentalSecurity')]: 'FOOD_ENERGY_ENVIRONMENTAL_SECURITY',
      [t('bi.category.governance')]: 'PUBLIC_ADMINISTRATION_GOVERNANCE'
    };

    const apiCategory = categoryMappingReverse[selectedPrimaryCategory as keyof typeof categoryMappingReverse];
    return dashboard.primary_metrics.filter(article => article.primary_socioeconomic_category === apiCategory);
  }, [dashboard, selectedPrimaryCategory]);

  // Dynamic chart generation functions
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with prompt:', prompt);

    try {
      setLoading(true);

      // Call the AI-powered chart generation endpoint
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7071';
      const response = await fetch(`${backendUrl}/api/charts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate chart');
      }

      const result = await response.json();

      if (result.success && result.chart) {
        // Convert the AI response to our DynamicChart format
        const aiChart = result.chart;
        const dynamicChart: DynamicChart = {
          type: aiChart.type as DynamicChart['type'],
          title: aiChart.title,
          data: aiChart.data,
          dataKey: aiChart.dataKey,
          xAxisKey: aiChart.xAxisKey,
          yAxisKey: aiChart.yAxisKey,
        };

        setDynamicChart(dynamicChart);
        setAiResponse(result.ai_response || '');
        setShowDynamicChart(true);
        setPrompt(''); // Clear the prompt after successful generation
      } else {
        throw new Error(result.error || 'Failed to generate chart');
      }
    } catch (error) {
      console.error('Chart generation error:', error);
      alert(`${t('bi.sorryCouldNotGenerateChart')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const closeDynamicChart = () => {
    setShowDynamicChart(false);
    setDynamicChart(null);
    setAiResponse('');
    setPrompt('');
  };

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
      risk: t(`bi.${name}`),
      value
    }));
  }, [dashboard, t]);

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
              {error || t('bi.noDataAvailable')}
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
              {t('bi.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('bi.subtitle')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {t('bi.lastUpdated')}: {new Date(dashboard.generated_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              {t('bi.refresh')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              {t('bi.export')}
            </button>
          </div>
        </div>

        {/* Dynamic Chart Prompt */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t('bi.askForCustomCharts')}
          </h3>
          <form onSubmit={handlePromptSubmit} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('bi.chartPromptPlaceholder')}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              {t('bi.generateChart')}
            </button>
          </form>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('bi.chartExamples')}
          </p>
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

        {/* Dynamic Chart - Show at top when generated */}
        {showDynamicChart && dynamicChart && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {dynamicChart.title}
              </h3>
              <button
                onClick={closeDynamicChart}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* AI Response Text */}
            {aiResponse && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">{t('bi.aiAnalysis')}</p>
                    <p className="whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}

            <ResponsiveContainer width="100%" height={400}>
              {dynamicChart.type === 'bar' && (
                <BarChart data={dynamicChart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={dynamicChart.xAxisKey}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={dynamicChart.dataKey}>
                    {dynamicChart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
              {dynamicChart.type === 'area' && (
                <AreaChart data={dynamicChart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={dynamicChart.xAxisKey} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey={dynamicChart.dataKey} stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.6} />
                </AreaChart>
              )}
              {dynamicChart.type === 'line' && (
                <LineChart data={dynamicChart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={dynamicChart.xAxisKey} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={dynamicChart.dataKey} stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              )}
              {dynamicChart.type === 'pie' && (
                <PieChart>
                  <Pie
                    data={dynamicChart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={dynamicChart.dataKey}
                  >
                    {dynamicChart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
              {dynamicChart.type === 'scatter' && (
                <ScatterChart data={dynamicChart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={dynamicChart.xAxisKey} fontSize={12} />
                  <YAxis dataKey={dynamicChart.yAxisKey} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data Points" dataKey={dynamicChart.dataKey} fill="#8884d8" />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bi.filters')}:</span>
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="all">{t('bi.allCategories')}</option>
              <option value="primary">{t('bi.primaryMetrics')}</option>
              <option value="operational">{t('bi.operationalMetrics')}</option>
              <option value="ai">{t('bi.aiMetadata')}</option>
              <option value="policy">{t('bi.policyProjects')}</option>
              <option value="media">{t('bi.sentimentAnalysis')}</option>
            </select>

            <select
              value={filters.sentiment}
              onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="all">{t('bi.allSentiments')}</option>
              <option value="positive">{t('bi.positive')}</option>
              <option value="negative">{t('bi.negative')}</option>
              <option value="neutral">{t('bi.neutral')}</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
            >
              <option value="7d">{t('bi.last7Days')}</option>
              <option value="30d">{t('bi.last30Days')}</option>
              <option value="90d">{t('bi.last90Days')}</option>
              <option value="1y">{t('bi.lastYear')}</option>
            </select>
          </div>
        </div>

        {/* Main BI Views */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('bi.views')}</h3>
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: t('bi.overview'), icon: '📊' },
                  { id: 'metrics-distribution', label: t('bi.metricsDistribution'), icon: '📈' },
                  { id: 'primary-metrics', label: t('bi.primaryMetrics'), icon: '🎯' },
                  { id: 'operational-metrics', label: t('bi.operationalMetrics'), icon: '⚙️' },
                  { id: 'ai-metadata', label: t('bi.aiMetadata'), icon: '🤖' },
                  { id: 'sentiment-analysis', label: t('bi.sentimentAnalysis'), icon: '😊' },
                  { id: 'risk-analysis', label: t('bi.riskAnalysis'), icon: '⚠️' },
                  { id: 'comparative', label: t('bi.comparativeAnalysis'), icon: '⚖️' }
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
                    {t('bi.metricsCoverageOverview')}
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
                      {t('bi.topicDistribution')}
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
                      {t('bi.trendingTopicsPerformance')}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dashboard.trending_topics.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            name === 'frequency' ? `${value} ${t('bi.mentions')}` : `${value}% ${t('bi.growth')}`,
                            name === 'frequency' ? t('bi.frequency') : t('bi.growthRate')
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
                    {t('bi.comprehensiveMetricsDistribution')}
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={metricsDistribution}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis />
                      <Radar
                        name={t('bi.coverage')}
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
                        {t('bi.metric.articlesAnalyzed')}
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('bi.primaryMetricsBreakdown')}
                    </h3>
                    {selectedPrimaryCategory && (
                      <button
                        onClick={() => setSelectedPrimaryCategory(null)}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        {t('bi.clearFilter')}
                      </button>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={primaryMetricsBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        domain={[0, 'dataMax']} 
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#3B82F6"
                        cursor="pointer"
                        onClick={(data) => {
                          if (data && data.name) {
                            setSelectedPrimaryCategory(data.name);
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {t('bi.clickToFilter')}
                  </p>
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
                        {t('bi.metric.articlesWithData')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Individual Articles with Primary Metrics */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('bi.articlesWithPrimaryMetrics')} {selectedPrimaryCategory ? `(${selectedPrimaryCategory})` : ''} ({filteredPrimaryMetrics.length})
                    </h3>
                    {selectedPrimaryCategory && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-lg">
                        <span className="text-sm font-medium">{t('bi.filteredBy')}: {selectedPrimaryCategory}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredPrimaryMetrics.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>{t('bi.noArticlesFound')}</p>
                        <p className="text-sm mt-2">{t('bi.tryDifferentCategory')}</p>
                      </div>
                    ) : (
                      filteredPrimaryMetrics.map((article) => (
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
                              {t('bi.viewArticle')}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Show Primary Socioeconomic Category */}
                            <div className={`p-3 rounded-lg ${
                              article.primary_socioeconomic_category === 'ECONOMIC_GROWTH_COMPETITIVENESS' ? 'bg-green-50 dark:bg-green-900/20' :
                              article.primary_socioeconomic_category === 'HUMAN_RESOURCE_DEVELOPMENT' ? 'bg-purple-50 dark:bg-purple-900/20' :
                              article.primary_socioeconomic_category === 'SOCIAL_WELFARE_INEQUALITY_REDUCTION' ? 'bg-blue-50 dark:bg-blue-900/20' :
                              article.primary_socioeconomic_category === 'HEALTH_SECURITY_PUBLIC_HEALTH' ? 'bg-red-50 dark:bg-red-900/20' :
                              article.primary_socioeconomic_category === 'FOOD_ENERGY_ENVIRONMENTAL_SECURITY' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                              'bg-indigo-50 dark:bg-indigo-900/20'
                            }`}>
                              <h5 className={`font-medium mb-2 ${
                                article.primary_socioeconomic_category === 'ECONOMIC_GROWTH_COMPETITIVENESS' ? 'text-green-800 dark:text-green-200' :
                                article.primary_socioeconomic_category === 'HUMAN_RESOURCE_DEVELOPMENT' ? 'text-purple-800 dark:text-purple-200' :
                                article.primary_socioeconomic_category === 'SOCIAL_WELFARE_INEQUALITY_REDUCTION' ? 'text-blue-800 dark:text-blue-200' :
                                article.primary_socioeconomic_category === 'HEALTH_SECURITY_PUBLIC_HEALTH' ? 'text-red-800 dark:text-red-200' :
                                article.primary_socioeconomic_category === 'FOOD_ENERGY_ENVIRONMENTAL_SECURITY' ? 'text-emerald-800 dark:text-emerald-200' :
                                'text-indigo-800 dark:text-indigo-200'
                              }`}>
                                {t('bi.primaryCategory')}: {
                                  article.primary_socioeconomic_category === 'ECONOMIC_GROWTH_COMPETITIVENESS' ? t('bi.category.economicGrowth') :
                                  article.primary_socioeconomic_category === 'HUMAN_RESOURCE_DEVELOPMENT' ? t('bi.category.humanResource') :
                                  article.primary_socioeconomic_category === 'SOCIAL_WELFARE_INEQUALITY_REDUCTION' ? t('bi.category.socialWelfare') :
                                  article.primary_socioeconomic_category === 'HEALTH_SECURITY_PUBLIC_HEALTH' ? t('bi.category.healthSecurity') :
                                  article.primary_socioeconomic_category === 'FOOD_ENERGY_ENVIRONMENTAL_SECURITY' ? t('bi.category.environmentalSecurity') :
                                  t('bi.category.governance')
                                }
                              </h5>
                              <div className="space-y-1 text-sm">
                                <p className={`${
                                  article.primary_socioeconomic_category === 'ECONOMIC_GROWTH_COMPETITIVENESS' ? 'text-green-700 dark:text-green-300' :
                                  article.primary_socioeconomic_category === 'HUMAN_RESOURCE_DEVELOPMENT' ? 'text-purple-700 dark:text-purple-300' :
                                  article.primary_socioeconomic_category === 'SOCIAL_WELFARE_INEQUALITY_REDUCTION' ? 'text-blue-700 dark:text-blue-300' :
                                  article.primary_socioeconomic_category === 'HEALTH_SECURITY_PUBLIC_HEALTH' ? 'text-red-700 dark:text-red-300' :
                                  article.primary_socioeconomic_category === 'FOOD_ENERGY_ENVIRONMENTAL_SECURITY' ? 'text-emerald-700 dark:text-emerald-300' :
                                  'text-indigo-700 dark:text-indigo-300'
                                }`}>
                                  <strong>{t('bi.confidence')}:</strong> {(article.category_confidence * 100).toFixed(1)}%
                                </p>
                                {article.category_reasoning && (
                                  <p className={`${
                                    article.primary_socioeconomic_category === 'ECONOMIC_GROWTH_COMPETITIVENESS' ? 'text-green-600 dark:text-green-400' :
                                    article.primary_socioeconomic_category === 'HUMAN_RESOURCE_DEVELOPMENT' ? 'text-purple-600 dark:text-purple-400' :
                                    article.primary_socioeconomic_category === 'SOCIAL_WELFARE_INEQUALITY_REDUCTION' ? 'text-blue-600 dark:text-blue-400' :
                                    article.primary_socioeconomic_category === 'HEALTH_SECURITY_PUBLIC_HEALTH' ? 'text-red-600 dark:text-red-400' :
                                    article.primary_socioeconomic_category === 'FOOD_ENERGY_ENVIRONMENTAL_SECURITY' ? 'text-emerald-600 dark:text-emerald-400' :
                                    'text-indigo-600 dark:text-indigo-400'
                                  }`}>
                                    {article.category_reasoning}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Economic Growth & Competitiveness */}
                            {(article.economic_growth_competitiveness &&
                              (article.economic_growth_competitiveness.gdp_growth_rate ||
                               article.economic_growth_competitiveness.investment_volume?.fdi_foreign_direct_investment ||
                               article.economic_growth_competitiveness.investment_volume?.domestic_investment ||
                               article.economic_growth_competitiveness.export_value?.overall_export_value ||
                               article.economic_growth_competitiveness.export_value?.key_sector_exports?.length > 0 ||
                               article.economic_growth_competitiveness.news_signals_economic?.length > 0)) && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">{t('bi.category.economicGrowth')}</h5>
                                <div className="space-y-1 text-sm">
                                  {article.economic_growth_competitiveness.gdp_growth_rate && (
                                    <p className="text-green-700 dark:text-green-300">
                                      📈 {t('bi.metric.gdpGrowth')}: {article.economic_growth_competitiveness.gdp_growth_rate}
                                    </p>
                                  )}
                                  {article.economic_growth_competitiveness.investment_volume?.fdi_foreign_direct_investment && (
                                    <p className="text-green-700 dark:text-green-300">
                                      💰 {t('bi.metric.fdi')}: {article.economic_growth_competitiveness.investment_volume.fdi_foreign_direct_investment}
                                    </p>
                                  )}
                                  {article.economic_growth_competitiveness.export_value?.key_sector_exports?.length > 0 && (
                                    <p className="text-green-700 dark:text-green-300">
                                      🌍 {article.economic_growth_competitiveness.export_value.key_sector_exports.length} {t('bi.metric.keyExports')}
                                    </p>
                                  )}
                                  {article.economic_growth_competitiveness.news_signals_economic?.length > 0 && (
                                    <p className="text-green-700 dark:text-green-300">
                                      📰 {article.economic_growth_competitiveness.news_signals_economic.length} {t('bi.metric.newsSignals')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Human Resource Development */}
                            {(article.human_resource_development &&
                              (article.human_resource_development.education_quality?.pisa_scores ||
                               article.human_resource_development.stem_graduates?.stem_graduate_numbers ||
                               article.human_resource_development.skill_upgrading?.reskilling_programs?.length > 0 ||
                               article.human_resource_development.employment_indicators?.unemployment_rate ||
                               article.human_resource_development.news_signals_hr?.length > 0)) && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">{t('bi.category.humanResource')}</h5>
                                <div className="space-y-1 text-sm">
                                  {article.human_resource_development.education_quality?.pisa_scores && (
                                    <p className="text-purple-700 dark:text-purple-300">
                                      📚 {t('bi.metric.pisaScores')}: {article.human_resource_development.education_quality.pisa_scores}
                                    </p>
                                  )}
                                  {article.human_resource_development.stem_graduates?.stem_graduate_numbers && (
                                    <p className="text-purple-700 dark:text-purple-300">
                                      🔬 {t('bi.metric.stemGraduates')}: {article.human_resource_development.stem_graduates.stem_graduate_numbers}
                                    </p>
                                  )}
                                  {article.human_resource_development.skill_upgrading?.reskilling_programs?.length > 0 && (
                                    <p className="text-purple-700 dark:text-purple-300">
                                      🚀 {article.human_resource_development.skill_upgrading.reskilling_programs.length} {t('bi.metric.reskillingPrograms')}
                                    </p>
                                  )}
                                  {article.human_resource_development.employment_indicators?.unemployment_rate && (
                                    <p className="text-purple-700 dark:text-purple-300">
                                      💼 {t('bi.metric.unemployment')}: {article.human_resource_development.employment_indicators.unemployment_rate}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Social Welfare & Inequality Reduction */}
                            {(article.social_welfare_inequality_reduction &&
                              (article.social_welfare_inequality_reduction.income_inequality?.gini_coefficient ||
                               article.social_welfare_inequality_reduction.household_debt?.household_debt_gdp_ratio ||
                               article.social_welfare_inequality_reduction.poverty_indicators?.poverty_rate ||
                               article.social_welfare_inequality_reduction.cost_of_living?.inflation_rate ||
                               article.social_welfare_inequality_reduction.news_signals_social?.length > 0)) && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('bi.category.socialWelfare')}</h5>
                                <div className="space-y-1 text-sm">
                                  {article.social_welfare_inequality_reduction.income_inequality?.gini_coefficient && (
                                    <p className="text-blue-700 dark:text-blue-300">
                                      📊 {t('bi.metric.giniCoefficient')}: {article.social_welfare_inequality_reduction.income_inequality.gini_coefficient}
                                    </p>
                                  )}
                                  {article.social_welfare_inequality_reduction.household_debt?.household_debt_gdp_ratio && (
                                    <p className="text-blue-700 dark:text-blue-300">
                                      🏠 {t('bi.metric.householdDebt')}: {article.social_welfare_inequality_reduction.household_debt.household_debt_gdp_ratio}
                                    </p>
                                  )}
                                  {article.social_welfare_inequality_reduction.poverty_indicators?.poverty_rate && (
                                    <p className="text-blue-700 dark:text-blue-300">
                                      🤝 {t('bi.metric.povertyRate')}: {article.social_welfare_inequality_reduction.poverty_indicators.poverty_rate}
                                    </p>
                                  )}
                                  {article.social_welfare_inequality_reduction.cost_of_living?.inflation_rate && (
                                    <p className="text-blue-700 dark:text-blue-300">
                                      💰 {t('bi.metric.inflationRate')}: {article.social_welfare_inequality_reduction.cost_of_living.inflation_rate}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Health Security & Public Health */}
                            {(article.health_security_public_health &&
                              (article.health_security_public_health.hospital_capacity_upgrades?.hospitals_upgraded ||
                               article.health_security_public_health.healthcare_coverage_metrics?.healthcare_coverage_rate ||
                               article.health_security_public_health.public_health_capacity?.beds_per_population ||
                               article.health_security_public_health.communicable_disease_trends?.vaccination_coverage ||
                               article.health_security_public_health.news_signals_health?.length > 0)) && (
                              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">{t('bi.category.healthSecurity')}</h5>
                                <div className="space-y-1 text-sm">
                                  {article.health_security_public_health.hospital_capacity_upgrades?.hospitals_upgraded && (
                                    <p className="text-red-700 dark:text-red-300">
                                      🏥 {t('bi.metric.hospitalsUpgraded')}: {article.health_security_public_health.hospital_capacity_upgrades.hospitals_upgraded}
                                    </p>
                                  )}
                                  {article.health_security_public_health.healthcare_coverage_metrics?.healthcare_coverage_rate && (
                                    <p className="text-red-700 dark:text-red-300">
                                      🩺 {t('bi.metric.healthcareCoverage')}: {article.health_security_public_health.healthcare_coverage_metrics.healthcare_coverage_rate}
                                    </p>
                                  )}
                                  {article.health_security_public_health.public_health_capacity?.beds_per_population && (
                                    <p className="text-red-700 dark:text-red-300">
                                      🛏️ {t('bi.metric.bedsPopulation')}: {article.health_security_public_health.public_health_capacity.beds_per_population}
                                    </p>
                                  )}
                                  {article.health_security_public_health.communicable_disease_trends?.vaccination_coverage && (
                                    <p className="text-red-700 dark:text-red-300">
                                      💉 {t('bi.metric.vaccinationCoverage')}: {article.health_security_public_health.communicable_disease_trends.vaccination_coverage}
                                    </p>
                                  )}
                                  {article.health_security_public_health.news_signals_health?.length > 0 && (
                                    <p className="text-red-700 dark:text-red-300">
                                      📰 {article.health_security_public_health.news_signals_health.length} {t('bi.metric.healthSignals')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Food, Energy & Environmental Security */}
                            {(article.food_energy_environmental_security &&
                              (article.food_energy_environmental_security.renewable_energy_share?.renewable_energy_percentage ||
                               article.food_energy_environmental_security.carbon_emission_reduction?.carbon_reduction_targets ||
                               article.food_energy_environmental_security.air_quality_indicators?.pm25_levels ||
                               article.food_energy_environmental_security.waste_management_performance?.waste_recycling_rate ||
                               article.food_energy_environmental_security.news_signals_environment?.length > 0)) && (
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                                <h5 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">{t('bi.category.environmentalSecurity')}</h5>
                                <div className="space-y-1 text-sm">
                                  {article.food_energy_environmental_security.renewable_energy_share?.renewable_energy_percentage && (
                                    <p className="text-emerald-700 dark:text-emerald-300">
                                      🌱 {t('bi.metric.renewableEnergy')}: {article.food_energy_environmental_security.renewable_energy_share.renewable_energy_percentage}
                                    </p>
                                  )}
                                  {article.food_energy_environmental_security.carbon_emission_reduction?.carbon_reduction_targets && (
                                    <p className="text-emerald-700 dark:text-emerald-300">
                                      🌍 {t('bi.metric.carbonReduction')}: {article.food_energy_environmental_security.carbon_emission_reduction.carbon_reduction_targets}
                                    </p>
                                  )}
                                  {article.food_energy_environmental_security.air_quality_indicators?.pm25_levels && (
                                    <p className="text-emerald-700 dark:text-emerald-300">
                                      💨 {t('bi.metric.pm25Levels')}: {article.food_energy_environmental_security.air_quality_indicators.pm25_levels}
                                    </p>
                                  )}
                                  {article.food_energy_environmental_security.waste_management_performance?.waste_recycling_rate && (
                                    <p className="text-emerald-700 dark:text-emerald-300">
                                      ♻️ {t('bi.metric.recyclingRate')}: {article.food_energy_environmental_security.waste_management_performance.waste_recycling_rate}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Public Administration & Governance */}
                            {(article.public_administration_governance &&
                              (article.public_administration_governance.e_government_adoption?.e_gov_services_coverage ||
                               article.public_administration_governance.open_data_metrics?.open_data_portals ||
                               article.public_administration_governance.anti_corruption_performance?.corruption_perception_index ||
                               article.public_administration_governance.news_signals_governance?.length > 0)) && (
                              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                                <h5 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">{t('bi.category.governance')}</h5>
                                <div className="space-y-1 text-sm">
                                  {article.public_administration_governance.e_government_adoption?.e_gov_services_coverage && (
                                    <p className="text-indigo-700 dark:text-indigo-300">
                                      💻 {t('bi.metric.eGovCoverage')}: {article.public_administration_governance.e_government_adoption.e_gov_services_coverage}
                                    </p>
                                  )}
                                  {article.public_administration_governance.open_data_metrics?.open_data_portals && (
                                    <p className="text-indigo-700 dark:text-indigo-300">
                                      📊 {t('bi.metric.openDataPortals')}: {article.public_administration_governance.open_data_metrics.open_data_portals}
                                    </p>
                                  )}
                                  {article.public_administration_governance.anti_corruption_performance?.corruption_perception_index && (
                                    <p className="text-indigo-700 dark:text-indigo-300">
                                      ⚖️ {t('bi.metric.corruptionIndex')}: {article.public_administration_governance.anti_corruption_performance.corruption_perception_index}
                                    </p>
                                  )}
                                  {article.public_administration_governance.news_signals_governance?.length > 0 && (
                                    <p className="text-indigo-700 dark:text-indigo-300">
                                      📰 {article.public_administration_governance.news_signals_governance.length} {t('bi.metric.governanceSignals')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'operational-metrics' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {t('bi.operationalMetricsBreakdown')}
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
                        {t('bi.metric.articlesWithData')}
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
                    {t('bi.aiMetadataInsightsBreakdown')}
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
                        {t('bi.metric.articlesWithInsights')}
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
                    {t('bi.mediaSentimentDistribution')}
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, value }) => `${name === 'Positive' ? t('bi.positive') : name === 'Negative' ? t('bi.negative') : t('bi.neutral')}: ${value}`}
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
                        {sentiment.name === 'Positive' ? t('bi.positive') : sentiment.name === 'Negative' ? t('bi.negative') : t('bi.neutral')} {t('bi.sentiment')}
                      </h4>
                      <div className={`text-2xl font-bold mb-1 ${
                        sentiment.name === 'Positive' ? 'text-green-600' :
                        sentiment.name === 'Negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {sentiment.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('bi.metric.articles')}
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
                    {t('bi.riskAnalysisDashboard')}
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
                          {t('bi.metric.identifiedRisks')}
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
                    {t('bi.comparativeMetricsAnalysis')}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                        {t('bi.metricsCoverageComparison')}
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
                        {t('bi.primaryVsOperationalMetrics')}
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <ScatterChart data={[
                          { x: dashboard.summary_metrics.primary_metrics_articles, y: dashboard.summary_metrics.operational_metrics_articles, name: 'Current State' }
                        ]}>
                          <CartesianGrid />
                          <XAxis type="number" dataKey="x" name={t('bi.primaryMetrics')} />
                          <YAxis type="number" dataKey="y" name={t('bi.operationalMetrics')} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name={t('bi.metrics')} dataKey="y" fill="#8884d8" />
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
                        {t('bi.primaryMetricsCoverage')}
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {((dashboard.summary_metrics.operational_metrics_articles / Math.max(dashboard.summary_metrics.total_articles_analyzed, 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('bi.operationalMetricsCoverage')}
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {((dashboard.summary_metrics.ai_metadata_articles / Math.max(dashboard.summary_metrics.total_articles_analyzed, 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('bi.aiMetadataCoverage')}
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {dashboard.summary_metrics.policy_projects}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('bi.policyProjectsIdentified')}
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
                  {t('bi.articleDetails')}
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
                    {t('bi.articleId')}: {selectedArticle.article_id} | {t('bi.analyzedAt')}: {new Date(selectedArticle.analyzed_at).toLocaleString('th-TH')}
                  </p>
                </div>

                {/* Primary Metrics Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('bi.extractedData')}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Economic Growth & Competitiveness */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-800 dark:text-green-200 mb-3">{t('bi.category.economicGrowth')}</h5>
                      <div className="space-y-2">
                        {selectedArticle.economic_growth_competitiveness?.gdp_growth_rate && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <strong>GDP Growth Rate:</strong> {selectedArticle.economic_growth_competitiveness.gdp_growth_rate}
                          </p>
                        )}
                        {selectedArticle.economic_growth_competitiveness?.productivity_indicators?.labor_productivity && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <strong>Labor Productivity:</strong> {selectedArticle.economic_growth_competitiveness.productivity_indicators.labor_productivity}
                          </p>
                        )}
                        {selectedArticle.economic_growth_competitiveness?.investment_volume?.fdi_foreign_direct_investment && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <strong>FDI:</strong> {selectedArticle.economic_growth_competitiveness.investment_volume.fdi_foreign_direct_investment}
                          </p>
                        )}
                        {selectedArticle.economic_growth_competitiveness?.export_value?.overall_export_value && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <strong>Export Value:</strong> {selectedArticle.economic_growth_competitiveness.export_value.overall_export_value}
                          </p>
                        )}
                        {selectedArticle.economic_growth_competitiveness?.export_value?.key_sector_exports?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Key Sector Exports:</p>
                            <ul className="text-sm text-green-600 dark:text-green-400 list-disc list-inside space-y-1">
                              {selectedArticle.economic_growth_competitiveness.export_value.key_sector_exports.map((export_item: string, idx: number) => (
                                <li key={idx}>{export_item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.economic_growth_competitiveness?.news_signals_economic?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">News Signals:</p>
                            <ul className="text-sm text-green-600 dark:text-green-400 list-disc list-inside space-y-1">
                              {selectedArticle.economic_growth_competitiveness.news_signals_economic.map((signal: string, idx: number) => (
                                <li key={idx}>{signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Human Resource Development */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">{t('bi.category.humanResource')}</h5>
                      <div className="space-y-2">
                        {selectedArticle.human_resource_development?.education_quality?.pisa_scores && (
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>PISA Scores:</strong> {selectedArticle.human_resource_development.education_quality.pisa_scores}
                          </p>
                        )}
                        {selectedArticle.human_resource_development?.education_quality?.literacy_rate && (
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>Literacy Rate:</strong> {selectedArticle.human_resource_development.education_quality.literacy_rate}
                          </p>
                        )}
                        {selectedArticle.human_resource_development?.stem_graduates?.stem_graduate_numbers && (
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>STEM Graduates:</strong> {selectedArticle.human_resource_development.stem_graduates.stem_graduate_numbers}
                          </p>
                        )}
                        {selectedArticle.human_resource_development?.skill_upgrading?.reskilling_programs?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Reskilling Programs:</p>
                            <ul className="text-sm text-purple-600 dark:text-purple-400 list-disc list-inside space-y-1">
                              {selectedArticle.human_resource_development.skill_upgrading.reskilling_programs.map((program: string, idx: number) => (
                                <li key={idx}>{program}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.human_resource_development?.employment_indicators?.unemployment_rate && (
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>Unemployment Rate:</strong> {selectedArticle.human_resource_development.employment_indicators.unemployment_rate}
                          </p>
                        )}
                        {selectedArticle.human_resource_development?.labor_market_wages?.average_wage_growth && (
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            <strong>Average Wage Growth:</strong> {selectedArticle.human_resource_development.labor_market_wages.average_wage_growth}
                          </p>
                        )}
                        {selectedArticle.human_resource_development?.news_signals_hr?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">News Signals:</p>
                            <ul className="text-sm text-purple-600 dark:text-purple-400 list-disc list-inside space-y-1">
                              {selectedArticle.human_resource_development.news_signals_hr.map((signal: string, idx: number) => (
                                <li key={idx}>{signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Social Welfare & Inequality Reduction */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">{t('bi.category.socialWelfare')}</h5>
                      <div className="space-y-2">
                        {selectedArticle.social_welfare_inequality_reduction?.income_inequality?.gini_coefficient && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Gini Coefficient:</strong> {selectedArticle.social_welfare_inequality_reduction.income_inequality.gini_coefficient}
                          </p>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.household_debt?.household_debt_gdp_ratio && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Household Debt/GDP:</strong> {selectedArticle.social_welfare_inequality_reduction.household_debt.household_debt_gdp_ratio}
                          </p>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.household_debt?.debt_reduction_programs?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Debt Reduction Programs:</p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                              {selectedArticle.social_welfare_inequality_reduction.household_debt.debt_reduction_programs.map((program: string, idx: number) => (
                                <li key={idx}>{program}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.poverty_indicators?.poverty_rate && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Poverty Rate:</strong> {selectedArticle.social_welfare_inequality_reduction.poverty_indicators.poverty_rate}
                          </p>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.cost_of_living?.inflation_rate && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Inflation Rate:</strong> {selectedArticle.social_welfare_inequality_reduction.cost_of_living.inflation_rate}
                          </p>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.social_welfare_coverage?.social_security_coverage && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Social Security Coverage:</strong> {selectedArticle.social_welfare_inequality_reduction.social_welfare_coverage.social_security_coverage}
                          </p>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.healthcare_access?.universal_healthcare_coverage && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Universal Healthcare:</strong> {selectedArticle.social_welfare_inequality_reduction.healthcare_access.universal_healthcare_coverage}
                          </p>
                        )}
                        {selectedArticle.social_welfare_inequality_reduction?.news_signals_social?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">News Signals:</p>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                              {selectedArticle.social_welfare_inequality_reduction.news_signals_social.map((signal: string, idx: number) => (
                                <li key={idx}>{signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Health Security & Public Health */}
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-red-800 dark:text-red-200 mb-3">{t('bi.category.healthSecurity')}</h5>
                      <div className="space-y-2">
                        {selectedArticle.health_security_public_health?.hospital_capacity_upgrades?.hospitals_upgraded && (
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Hospitals Upgraded:</strong> {selectedArticle.health_security_public_health.hospital_capacity_upgrades.hospitals_upgraded}
                          </p>
                        )}
                        {selectedArticle.health_security_public_health?.hospital_capacity_upgrades?.new_hospital_construction && (
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>New Hospital Construction:</strong> {selectedArticle.health_security_public_health.hospital_capacity_upgrades.new_hospital_construction}
                          </p>
                        )}
                        {selectedArticle.health_security_public_health?.healthcare_coverage_metrics?.healthcare_coverage_rate && (
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Healthcare Coverage Rate:</strong> {selectedArticle.health_security_public_health.healthcare_coverage_metrics.healthcare_coverage_rate}
                          </p>
                        )}
                        {selectedArticle.health_security_public_health?.public_health_capacity?.beds_per_population && (
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Beds per Population:</strong> {selectedArticle.health_security_public_health.public_health_capacity.beds_per_population}
                          </p>
                        )}
                        {selectedArticle.health_security_public_health?.digital_health_adoption?.telemedicine_implementation && (
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Telemedicine Implementation:</strong> {selectedArticle.health_security_public_health.digital_health_adoption.telemedicine_implementation}
                          </p>
                        )}
                        {selectedArticle.health_security_public_health?.communicable_disease_trends?.vaccination_coverage && (
                          <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Vaccination Coverage:</strong> {selectedArticle.health_security_public_health.communicable_disease_trends.vaccination_coverage}
                          </p>
                        )}
                        {selectedArticle.health_security_public_health?.news_signals_health?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">News Signals:</p>
                            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                              {selectedArticle.health_security_public_health.news_signals_health.map((signal: string, idx: number) => (
                                <li key={idx}>{signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Food, Energy & Environmental Security */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">{t('bi.category.environmentalSecurity')}</h5>
                      <div className="space-y-2">
                        {selectedArticle.food_energy_environmental_security?.renewable_energy_share?.renewable_energy_percentage && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Renewable Energy %:</strong> {selectedArticle.food_energy_environmental_security.renewable_energy_share.renewable_energy_percentage}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.renewable_energy_share?.renewable_energy_targets && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Renewable Energy Targets:</strong> {selectedArticle.food_energy_environmental_security.renewable_energy_share.renewable_energy_targets}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.carbon_emission_reduction?.carbon_reduction_targets && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Carbon Reduction Targets:</strong> {selectedArticle.food_energy_environmental_security.carbon_emission_reduction.carbon_reduction_targets}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.air_quality_indicators?.pm25_levels && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>PM2.5 Levels:</strong> {selectedArticle.food_energy_environmental_security.air_quality_indicators.pm25_levels}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.water_resource_management?.water_resource_index && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Water Resource Index:</strong> {selectedArticle.food_energy_environmental_security.water_resource_management.water_resource_index}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.waste_management_performance?.waste_recycling_rate && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Waste Recycling Rate:</strong> {selectedArticle.food_energy_environmental_security.waste_management_performance.waste_recycling_rate}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.food_security_indicators?.food_security_index && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <strong>Food Security Index:</strong> {selectedArticle.food_energy_environmental_security.food_security_indicators.food_security_index}
                          </p>
                        )}
                        {selectedArticle.food_energy_environmental_security?.news_signals_environment?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">News Signals:</p>
                            <ul className="text-sm text-emerald-600 dark:text-emerald-400 list-disc list-inside space-y-1">
                              {selectedArticle.food_energy_environmental_security.news_signals_environment.map((signal: string, idx: number) => (
                                <li key={idx}>{signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Public Administration & Governance */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3">{t('bi.category.governance')}</h5>
                      <div className="space-y-2">
                        {selectedArticle.public_administration_governance?.e_government_adoption?.e_gov_services_coverage && (
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>{t('bi.metric.eGovCoverage')}:</strong> {selectedArticle.public_administration_governance.e_government_adoption.e_gov_services_coverage}
                          </p>
                        )}
                        {selectedArticle.public_administration_governance?.e_government_adoption?.digital_service_utilization && (
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>{t('bi.metric.digitalServiceUtilization')}:</strong> {selectedArticle.public_administration_governance.e_government_adoption.digital_service_utilization}
                          </p>
                        )}
                        {selectedArticle.public_administration_governance?.g_cloud_usage?.government_cloud_migration && (
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>{t('bi.metric.govCloudMigration')}:</strong> {selectedArticle.public_administration_governance.g_cloud_usage.government_cloud_migration}
                          </p>
                        )}
                        {selectedArticle.public_administration_governance?.open_data_metrics?.open_data_portals && (
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>{t('bi.metric.openDataPortals')}:</strong> {selectedArticle.public_administration_governance.open_data_metrics.open_data_portals}
                          </p>
                        )}
                        {selectedArticle.public_administration_governance?.public_sector_modernization?.digital_transformation_initiatives?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">{t('bi.metric.digitalTransformationInitiatives')}:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.public_administration_governance.public_sector_modernization.digital_transformation_initiatives.map((initiative: string, idx: number) => (
                                <li key={idx}>{initiative}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.public_administration_governance?.anti_corruption_performance?.corruption_perception_index && (
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <strong>{t('bi.metric.corruptionIndex')}:</strong> {selectedArticle.public_administration_governance.anti_corruption_performance.corruption_perception_index}
                          </p>
                        )}
                        {selectedArticle.public_administration_governance?.anti_corruption_performance?.anti_corruption_measures?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">{t('bi.metric.antiCorruptionMeasures')}:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.public_administration_governance.anti_corruption_performance.anti_corruption_measures.map((measure: string, idx: number) => (
                                <li key={idx}>{measure}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedArticle.public_administration_governance?.news_signals_governance?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">{t('bi.metric.newsSignals')}:</p>
                            <ul className="text-sm text-indigo-600 dark:text-indigo-400 list-disc list-inside space-y-1">
                              {selectedArticle.public_administration_governance.news_signals_governance.map((signal: string, idx: number) => (
                                <li key={idx}>{signal}</li>
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
                      {t('bi.originalContent')}
                    </h4>
                    {selectedArticle.source_url ? (
                      <a
                        href={selectedArticle.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('bi.readFullArticle')}
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('bi.noArticleUrl')}
                      </button>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 italic">
                    {selectedArticle.full_content ? (
                      <div className="max-h-40 overflow-y-auto">
                        {selectedArticle.full_content.length > 500 
                          ? `${selectedArticle.full_content.substring(0, 500)}...`
                          : selectedArticle.full_content
                        }
                      </div>
                    ) : (
                      "คลิก '{t('bi.readFullArticle')}' เพื่ออ่านบทความต้นฉบับบนเว็บไซต์ต้นทาง"
                    )}
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
