'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Cell } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Import leaflet CSS
import 'leaflet/dist/leaflet.css';

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

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
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
          <p className="text-gray-600 dark:text-gray-400">
            Insights from {companies.length} extracted companies
          </p>
        </div>

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
            {typeof window !== 'undefined' && (
              <>
                {/* Configure leaflet markers only on client side */}
                {(() => {
                  import('leaflet').then((L) => {
                    L.Icon.Default.mergeOptions({
                      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    });
                  });
                  return null;
                })()}
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
              </>
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