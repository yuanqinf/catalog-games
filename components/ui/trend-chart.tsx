'use client';

import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { LucideIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type DataItem = Record<string, string | number>;

interface TrendChartProps {
  title?: string;
  description?: string;
  data: DataItem[];
  dataKey: string; // e.g. "interest value"
  xKey: string; // e.g. "date"
  xTickFormat?: (val: string) => string;
  strokeColor?: string;
  footerTrendText?: string;
  footerSubText?: string;
  trendIcon?: LucideIcon;
  hideXAxis?: boolean;
  hideYAxis?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export function TrendChart({
  title = 'Search Trends',
  description = 'Last 7 days',
  data,
  dataKey,
  xKey,
  xTickFormat = (val) => val,
  strokeColor = 'white',
  footerTrendText,
  footerSubText,
  trendIcon: Icon,
  hideXAxis = false,
  hideYAxis = false,
  isLoading = false,
  isError = false,
  errorMessage = 'Trend data temporarily unavailable',
}: TrendChartProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center">
            <p className="mb-2 text-sm font-medium text-gray-400">
              Loading trend data...
            </p>
            {/* Animated placeholder mini chart */}
            <div className="flex h-[70px] w-full items-end justify-around gap-1">
              {[30, 50, 40, 60, 45, 70, 55].map((height, i) => (
                <div
                  key={i}
                  className="w-full animate-pulse rounded-t bg-neutral-700"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center">
            <p className="mb-1 text-sm font-medium text-gray-400">
              ⚠️ {errorMessage}
            </p>
            {/* Placeholder mini chart */}
            <div className="flex h-[70px] w-full items-end justify-around gap-1">
              {[30, 50, 40, 60, 45, 70, 55].map((height, i) => (
                <div
                  key={i}
                  className="w-full rounded-t bg-neutral-700/50"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal state with data
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <ChartContainer
          className="h-[100px] w-full"
          config={{ [dataKey]: { label: dataKey, color: strokeColor } }}
        >
          <LineChart
            data={data}
            margin={{ left: 6, right: 6, top: 6, bottom: 6 }}
          >
            <CartesianGrid vertical={false} />
            {!hideXAxis && (
              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={xTickFormat}
              />
            )}
            {!hideYAxis && (
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                tickMargin={6}
                domain={['auto', 'auto']}
              />
            )}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey={dataKey}
              type="natural"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      {(footerTrendText || footerSubText) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footerTrendText && (
            <div className="flex gap-2 leading-none font-medium">
              {footerTrendText} {Icon && <Icon className="h-4 w-4" />}
            </div>
          )}
          {footerSubText && (
            <div className="text-muted-foreground leading-none">
              {footerSubText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
