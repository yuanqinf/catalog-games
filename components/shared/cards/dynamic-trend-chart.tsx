'use client';

import { useState, useEffect } from 'react';
import { TrendChart } from '@/components/ui/trend-chart';

interface TrendDataPoint {
  date: Date;
  value: number;
}

interface TrendsResponse {
  data: TrendDataPoint[];
  keyword: string;
  dateRange: {
    start: string;
    end: string;
  };
  geo: string;
}

interface DynamicTrendChartProps {
  keyword: string;
  title?: string;
  description?: string;
  hideXAxis?: boolean;
  hideYAxis?: boolean;
}

export default function DynamicTrendChart({
  keyword,
  title,
  description = 'Last 7 days',
  hideXAxis = false,
  hideYAxis = false,
}: DynamicTrendChartProps) {
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keyword?.trim()) return;

    const fetchTrends = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ keyword: keyword.trim() });
        const response = await fetch(`/api/trends?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch trends');
        }

        // Parse dates in the response
        const trendsData = data as TrendsResponse;
        trendsData.data = trendsData.data.map((point) => ({
          ...point,
          date: new Date(point.date),
        }));

        setTrends(trendsData);
      } catch (err) {
        console.error('Failed to fetch trends:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [keyword]);

  // Transform API data to TrendChart format
  const chartData =
    trends?.data.map((point) => ({
      date: point.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: point.value,
    })) || [];

  // Show loading state with placeholder data
  if (loading) {
    return (
      <TrendChart
        title={title || `${keyword} Trends`}
        description="Loading..."
        data={[{ date: 'Loading...', value: 0 }]}
        dataKey="value"
        xKey="date"
        hideXAxis={hideXAxis}
        hideYAxis={hideYAxis}
        strokeColor="#6b7280"
      />
    );
  }

  // Show error state with placeholder
  if (error) {
    return (
      <TrendChart
        title={title || `${keyword} Trends`}
        description="Failed to load trends"
        data={[{ date: 'Error', value: 0 }]}
        dataKey="value"
        xKey="date"
        hideXAxis={hideXAxis}
        hideYAxis={hideYAxis}
        strokeColor="#ef4444"
      />
    );
  }

  // Show actual data
  return (
    <TrendChart
      title={title || `${keyword} Trends`}
      description={description}
      data={chartData}
      dataKey="value"
      xKey="date"
      hideXAxis={hideXAxis}
      hideYAxis={hideYAxis}
      strokeColor="#10b981"
    />
  );
}
