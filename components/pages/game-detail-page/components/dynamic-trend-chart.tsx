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
  description?: string;
  hideXAxis?: boolean;
  hideYAxis?: boolean;
}

export default function DynamicTrendChart({
  keyword,
  description,
  hideXAxis = false,
  hideYAxis = false,
}: DynamicTrendChartProps) {
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid hydration issues
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !keyword?.trim()) {
      return;
    }

    const fetchTrends = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ keyword: keyword.trim() });
        const response = await fetch(`/api/trends?${params}`);
        const data = await response.json();

        if (!response.ok) {
          return;
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
  }, [keyword, mounted]);

  // Transform API data to TrendChart format
  const chartData =
    trends?.data.map((point) => ({
      date: point.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: point.value,
    })) || [];

  // Determine if we should show error state
  const hasError = !!error;
  const hasNoData = !trends || chartData.length === 0;

  // Show initial state before mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <TrendChart
        description={description}
        data={[{ date: '', value: 0 }]}
        dataKey="value"
        xKey="date"
        hideXAxis={hideXAxis}
        hideYAxis={hideYAxis}
        strokeColor="#10b981"
        isLoading={false}
        isError={false}
      />
    );
  }

  return (
    <TrendChart
      description={description}
      data={chartData.length > 0 ? chartData : [{ date: '', value: 0 }]}
      dataKey="value"
      xKey="date"
      hideXAxis={hideXAxis}
      hideYAxis={hideYAxis}
      strokeColor="#10b981"
      isLoading={loading}
      isError={hasError || (hasNoData && !loading)}
      errorMessage={hasError ? error : 'No trend data available'}
    />
  );
}
