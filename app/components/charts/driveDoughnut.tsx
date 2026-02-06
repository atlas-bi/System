import { cn } from '@/lib/utils';

import {
	Chart as ChartJS,
	ArcElement,
	ChartData,
	type ScriptableContext,
} from 'chart.js';
import React, { useEffect, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { createConicGradient, darkGradient, lightGradient } from './functions';

ChartJS.register(ArcElement);

type Data = {
	data: {
		labels: string[];
		datasets: {
			label: string;
			data: number[];
			backgroundColor?: string[];
			borderColor?: string[];
			borderWidth?: number;
		}[];
	};
};

const DoughnutChart = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & Data
>(({ className, data, ...props }, ref) => {
	const [chartData, setChartData] = useState<ChartData<'doughnut'>>({
		datasets: [],
	});

	useEffect(() => {
		const chartData = {
			...data,
			datasets: data.datasets.map((dataset) => ({
				...dataset,
				backgroundColor: (ctx: ScriptableContext<'doughnut'>) =>
					ctx.dataIndex === 0
						? createConicGradient(
							ctx.chart.ctx,
							ctx.chart.chartArea,
							lightGradient,
						)
						: '#e2e8f0',
				hoverBackgroundColor: (ctx: ScriptableContext<'doughnut'>) =>
					ctx.dataIndex === 0
						? createConicGradient(
							ctx.chart.ctx,
							ctx.chart.chartArea,
							darkGradient,
						)
						: '#e2e8f0',
				borderColor: (ctx: ScriptableContext<'doughnut'>) =>
					ctx.dataIndex === 0
						? createConicGradient(
							ctx.chart.ctx,
							ctx.chart.chartArea,
							darkGradient,
						)
						: '#cbd5e1',
				hoverBorderColor: (ctx: ScriptableContext<'doughnut'>) =>
					ctx.dataIndex === 0
						? createConicGradient(
							ctx.chart.ctx,
							ctx.chart.chartArea,
							darkGradient,
						)
						: '#cbd5e1',
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
				options={{
					responsive: true,
					plugins: {
						tooltip: {
							enabled: false,
						},
						legend: {
							display: false,
						},
					},
					rotation: -135,
					circumference: 270,
					animation: {
						animateScale: false,
						animateRotate: true,
					},
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
							const used = Number(chart.data.datasets?.[0]?.data?.[0] ?? 0);
							const free = Number(chart.data.datasets?.[0]?.data?.[1] ?? 0);
							const percent =
								used > 0 && free > 0
									? Math.round((used / (used + free)) * 100)
									: -1;

							const text =
								percent > 0 ? percent.toString() + '%' : percent.toString();

							let color = '#475569';

							if (percent > 80) {
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
