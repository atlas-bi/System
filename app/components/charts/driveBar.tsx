import type { Usage } from '@prisma/client';
import { cn } from '@/lib/utils';

import bytes from 'bytes';
import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  TimeScale,
} from 'chart.js';
import React, { useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { createLinearGradient, darkGradient, lightGradient } from './functions';

ChartJS.register([
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
]);

export const options = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'Storage Usage',
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      beginAtZero: true,
      ticks: {
        callback: function (value: string) {
          return value + 'GB';
        },
      },
      stacked: true,
    },
    x: {
      stacked: true,
    },
  },
};

const BarChart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & any
>(({ className, data, ...props }, ref) => {
  const chartRef = useRef<ChartJS>(null);

  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    datasets: [],
  });

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }
    const chartData = {
      labels: data.usage.map((x: Usage) =>
        format(new Date(x.createdAt), 'MMM dd, yyyy'),
      ),
      datasets: [
        {
          label: 'Used',
          data: data.usage.map((x: Usage) =>
            bytes(Number(x.used), { unit: 'GB' }).replace('GB', ''),
          ),
          borderColor: createLinearGradient(
            chart.ctx,
            chart.chartArea,
            darkGradient,
          ),
          backgroundColor: createLinearGradient(
            chart.ctx,
            chart.chartArea,
            lightGradient,
          ),
          hoverBackgroundColor: createLinearGradient(
            chart.ctx,
            chart.chartArea,
            darkGradient,
          ),
          hoverBorderColor: createLinearGradient(
            chart.ctx,
            chart.chartArea,
            darkGradient,
          ),
        },
        {
          label: 'Free',
          data: data.usage.map((x: Usage) =>
            bytes(Number(x.free), { unit: 'GB' }).replace('GB', ''),
          ),
          borderColor: '#cbd5e1',
          backgroundColor: '#e2e8f0',
          borderRadius: { topLeft: 2, topRight: 2 },
        },
      ],
    };

    setChartData(chartData);
  }, [data]);

  return (
    <div ref={ref} className={cn('m-auto max-h-[450px]', className)} {...props}>
      <Bar ref={chartRef} options={options} data={chartData} />
    </div>
  );
});

BarChart.displayName = 'Line Chart';

export { BarChart };
