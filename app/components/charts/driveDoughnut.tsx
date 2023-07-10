import { cn } from '@/lib/utils';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  plugins,
  ChartArea,
  ChartData,
  Chart,
} from 'chart.js';
import { VariantProps } from 'class-variance-authority';
import React, { useEffect, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import { createConicGradient, darkGradient, lightGradient } from './functions';

ChartJS.register(ArcElement);

type Data = {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
};

function drawTotals(chart: {
  chart: { width: any; height: any; ctx: any };
  config: { centerText: { text: any } };
}) {
  var width = chart.chart.width,
    height = chart.chart.height,
    ctx = chart.chart.ctx;

  ctx.restore();
  var fontSize = (height / 114).toFixed(2);
  ctx.font = fontSize + 'em sans-serif';
  ctx.textBaseline = 'middle';

  var text = '123', //chart.config.centerText.text,
    textX = Math.round((width - ctx.measureText(text).width) / 2),
    textY = height / 2;

  ctx.fillText(text, textX, textY);
  ctx.save();
}

const DoughnutChart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & Data
>(({ className, data, ...props }, ref) => {
  const chartRef = useRef<ChartJS>(null);
  const [chartData, setChartData] = useState<ChartData<'doughnut'>>({
    datasets: [],
  });

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    const chartData = {
      ...data,
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: [
          createConicGradient(chart.ctx, chart.chartArea, lightGradient),
          '#e2e8f0',
        ],
        hoverBackgroundColor: [
          createConicGradient(chart.ctx, chart.chartArea, darkGradient),
          '#e2e8f0',
        ],
        borderColor: [
          createConicGradient(chart.ctx, chart.chartArea, darkGradient),
          '#cbd5e1',
        ],
        hoverBorderColor: [
          createConicGradient(chart.ctx, chart.chartArea, darkGradient),
          '#cbd5e1',
        ],
        borderWidth: 1,
        borderRadius: [
          {
            outerStart: 5,
            outerEnd: 0,
            innerStart: 5,
            innerEnd: 0,
          },
          {
            outerStart: 0,
            outerEnd: 5,
            innerStart: 0,
            innerEnd: 5,
          },
        ],
      })),
    };

    setChartData(chartData);
  }, []);

  return (
    <div ref={ref} className={cn('m-auto', className)} {...props}>
      <Doughnut
        ref={chartRef}
        options={{
          responsive: true,
          plugins: {
            tooltip: {
              enabled: false,
            },
            legend: {
              display: false,
            },
            centerText: {
              value: 'asdf',
            },
          },
          centerText: function () {
            const used = chartData.datasets[0]?.data?.[0];
            const free = chartData.datasets[0]?.data?.[1];

            if (used && free) {
              return Math.round((used / (used + free)) * 100);
            }
            return '-1';
          },
          rotation: -135,
          circumference: 270,
          animation: {
            animateScale: false,
            animateRotate: true,
          },
          redraw: true,
          cutout: '65%',
          transitions: {
            active: {
              animation: {
                duration: 0.5,
              },
            },
          },
        }}
        data={chartData}
        plugins={[
          {
            id: 'centerText',
            beforeDraw: function (chart, args, options) {
              const percent = chart.config?.options?.centerText?.() || -1;

              const text =
                percent > 0 ? percent.toString() + '%' : percent.toString();

              let color = '#475569';

              if (text > 80) {
                color = '#881337';
              }

              const { ctx } = chart;
              ctx.save();

              const width = chart.width,
                height = chart.height,
                fontSize = (height / 114).toFixed(2);

              ctx.font = fontSize + 'em sans-serif';
              ctx.fillStyle = color;
              ctx.textBaseline = 'middle';

              let textX = Math.round((width - ctx.measureText(text).width) / 2);
              const textY = height / 2;

              ctx.fillText(text, textX, textY);
              // add "full"
              if (percent > 0) {
                const fullText = 'full';

                let textX = Math.round(
                  (width - ctx.measureText(fullText).width) / 2,
                );
                ctx.fillText(fullText, textX, textY + (height / 114) * 16); // / 16 to convert to px
              }

              ctx.restore();
            },
          },
        ]}
      />
    </div>
  );
});

DoughnutChart.displayName = 'Doughnut Chart';

export { DoughnutChart };
