'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Cell, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, PieLabelRenderProps } from 'recharts';
import dynamic from 'next/dynamic';
import * as L from 'leaflet';

// Dynamic chart generation state
interface DynamicChart {
  type: 'bar' | 'area' | 'pie' | 'line' | 'scatter';
  title: string;
  data: (Record<string, string | number>)[];
  dataKey: string;
  xAxisKey?: string;
  yAxisKey?: string;
}

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface Company {
  id: string;
  company_name: string;
  location: string;
  asset_valuation: string;
  extraction_id: string;
  extraction_timestamp: string;
  source_text: string;
  model_used: string;
  text_length: number;
  created_at: string;
}

// Thai location coordinates mapping
const THAI_LOCATIONS: Record<string, { lat: number; lng: number; english: string }> = {
  'กรุงเทพฯ': { lat: 13.7563, lng: 100.5018, english: 'Bangkok' },
  'กรุงเทพมหานคร': { lat: 13.7563, lng: 100.5018, english: 'Bangkok' },
  'เชียงใหม่': { lat: 18.7883, lng: 98.9853, english: 'Chiang Mai' },
  'ภูเก็ต': { lat: 7.9519, lng: 98.3381, english: 'Phuket' },
  'พัทยา': { lat: 12.9276, lng: 100.8771, english: 'Pattaya' },
  'หาดใหญ่': { lat: 6.9964, lng: 100.4982, english: 'Hat Yai' },
  'ขอนแก่น': { lat: 16.4322, lng: 102.8236, english: 'Khon Kaen' },
  'นครราชสีมา': { lat: 14.9799, lng: 102.0978, english: 'Nakhon Ratchasima' },
  'อุดรธานี': { lat: 17.4138, lng: 102.7872, english: 'Udon Thani' },
  'ชลบุรี': { lat: 13.3611, lng: 100.9847, english: 'Chonburi' },
  'ระยอง': { lat: 12.6833, lng: 101.2833, english: 'Rayong' },
  'สุราษฎร์ธานี': { lat: 9.1382, lng: 99.3217, english: 'Surat Thani' },
  'นครศรีธรรมราช': { lat: 8.4304, lng: 99.9597, english: 'Nakhon Si Thammarat' },
  'สงขลา': { lat: 7.1756, lng: 100.6143, english: 'Songkhla' },
  'นครปฐม': { lat: 13.8196, lng: 100.0620, english: 'Nakhon Pathom' },
};

// Extend window interface for leaflet custom icon
declare global {
  interface Window {
    leafletCustomIcon?: unknown;
  }
}

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic chart generation
  const [prompt, setPrompt] = useState('');
  const [dynamicChart, setDynamicChart] = useState<DynamicChart | null>(null);
  const [showDynamicChart, setShowDynamicChart] = useState(false);

  // Map loading state
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Configure leaflet icons and CSS on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // Configure leaflet icons after a short delay to ensure CSS is loaded
      setTimeout(() => {
        import('leaflet').then((L) => {
          // Create custom icon
          const customIcon = new L.Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          // Store the custom icon in window for use in markers
          window.leafletCustomIcon = customIcon;
          setMapLoaded(true);
        }).catch((err) => {
          console.error('Failed to configure leaflet:', err);
        });
      }, 100);
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // For development, fetch directly from Azure Functions
      // In production, this would be the same domain
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/companies?limit=100'
        : 'http://localhost:7071/api/companies?limit=100';
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const locationData = companies.reduce((acc, company) => {
    const location = company.location || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationChartData = Object.entries(locationData)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 locations

  // Asset valuation data (simplified - extract numbers)
  const valuationData = companies
    .filter(company => company.asset_valuation && company.asset_valuation !== '')
    .map(company => {
      const valuation = company.asset_valuation;
      // Extract numbers from valuation strings (e.g., "500 ล้านบาท" -> 500)
      const match = valuation.match(/(\d+(?:\.\d+)?)/);
      const value = match ? parseFloat(match[1]) : 0;
      return {
        name: company.company_name.length > 15 ? company.company_name.substring(0, 15) + '...' : company.company_name,
        valuation: value,
        fullName: company.company_name
      };
    })
    .filter(item => item.valuation > 0) // Only include items with valid valuations
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, 10);

  // Timeline data (companies extracted over time)
  const timelineData = companies.reduce((acc, company) => {
    const date = new Date(company.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timelineChartData = Object.entries(timelineData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Process data for map
  const mapData = companies
    .filter(company => company.location && THAI_LOCATIONS[company.location])
    .map(company => ({
      ...company,
      coordinates: THAI_LOCATIONS[company.location],
    }));

  const unmappedLocations = companies
    .filter(company => company.location && !THAI_LOCATIONS[company.location])
    .map(company => company.location)
    .filter((location, index, arr) => arr.indexOf(location) === index); // unique locations

  // Dynamic chart generation functions
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with prompt:', prompt);
    
    try {
      setLoading(true);
      
      // Call the AI-powered chart generation endpoint
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/charts/generate'
        : 'http://localhost:7071/api/charts/generate';
      
      const response = await fetch(apiUrl, {
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
        setShowDynamicChart(true);
        setPrompt(''); // Clear the prompt after successful generation
      } else {
        throw new Error(result.error || 'Failed to generate chart');
      }
    } catch (error) {
      console.error('Chart generation error:', error);
      alert(`Sorry, I couldn't generate that chart. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const closeDynamicChart = () => {
    setShowDynamicChart(false);
    setDynamicChart(null);
    setPrompt('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button
            onClick={fetchCompanies}
            className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-4 py-2 rounded-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Company Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Insights from {companies.length} extracted companies
          </p>
          
          {/* Dynamic Chart Prompt */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Ask for Custom Charts
            </h3>
            <form onSubmit={handlePromptSubmit} className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Try: "companies in Bangkok with valuations over 100 million baht"'
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                Generate Chart
              </button>
            </form>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Examples: &quot;companies in Bangkok with valuations over 100 million baht&quot;, &quot;show top 5 companies from Chiang Mai&quot;, &quot;companies under 50 million created this year&quot;, &quot;pie chart of locations&quot;
            </p>
          </div>
        </div>

        {/* Dynamic Chart - Show at top when generated */}
        {showDynamicChart && dynamicChart && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
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
                    label={(props: PieLabelRenderProps) => {
                      const { name, percent } = props;
                      const percentValue = percent as number;
                      return `${name} ${(percentValue * 100).toFixed(0)}%`;
                    }}
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Locations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(locationData).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Valuation</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {companies.filter(c => c.asset_valuation && c.asset_valuation !== '').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Location Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company Locations Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="location"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {locationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Valuations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Company Valuations ({valuationData.length} companies)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={valuationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  type="category"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                />
                <YAxis type="number" domain={[0, 'dataMax + 50']} />
                <Tooltip
                  formatter={(value) => [value, 'Valuation']}
                  labelFormatter={(label) => valuationData.find(d => d.name === label)?.fullName || label}
                />
                <Bar dataKey="valuation" minPointSize={5}>
                  {valuationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Extraction Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company Extractions Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Locations Map */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Company Locations Map
          </h3>
          <div className="h-96 w-full">
            {typeof window !== 'undefined' && mapLoaded && (
              <MapContainer
                center={[13.7563, 100.5018]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapData.map((company) => (
                  <Marker
                    key={company.id}
                    position={[company.coordinates.lat, company.coordinates.lng]}
                    icon={window.leafletCustomIcon as L.Icon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold text-sm">{company.company_name}</h4>
                        <p className="text-xs text-gray-600">
                          Location: {company.coordinates.english}
                        </p>
                        {company.asset_valuation && (
                          <p className="text-xs text-gray-600">
                            Valuation: {company.asset_valuation}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(company.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
            {typeof window !== 'undefined' && !mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {mapData.length} companies with mapped locations on the map.
            {unmappedLocations.length > 0 && (
              <span className="block mt-1">
                {unmappedLocations.length} locations not shown: {unmappedLocations.slice(0, 3).join(', ')}
                {unmappedLocations.length > 3 && ` and ${unmappedLocations.length - 3} more`}
              </span>
            )}
          </div>
        </div>

        {/* Recent Companies Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Company Extractions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Asset Valuation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Extracted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {companies.slice(0, 10).map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {company.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {company.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {company.asset_valuation || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}