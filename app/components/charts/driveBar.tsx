import type { Usage } from '@prisma/client';

import bytes from 'bytes';
import {
	LineElement,
	CategoryScale,
	ChartData,
	Chart as ChartJS,
	LinearScale,
	PointElement,
	Tooltip,
	Filler,
	TimeScale,
} from 'chart.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { createLinearGradient, darkGradient, lightGradient } from './functions';
import { useFetcher } from '@remix-run/react';
import { DateFilter } from './DateFilter';
import { dateOptions } from '~/models/dates';

ChartJS.register([
	CategoryScale,
	LinearScale,
	LineElement,
	PointElement,
	TimeScale,
	Filler,
	Tooltip,
]);

import 'chartjs-adapter-date-fns';
import { H2, H3 } from '../ui/typography';
import { Circle, Loader, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export const StorageChart = ({ url }: { url: string }) => {
	const usageFetcher = useFetcher();
	const [unit, setUnit] = useState('last_24_hours');
	const chartRef = useRef<ChartJS>(null);
	const getOptions = useCallback(() => {
		return {
			responsive: true,
			maintainAspectRatio: false,
			animation: {
				duration: 300,
				resize: {
					duration: 0,
				},
				active: {
					duration: 0,
				},
			},
			plugins: {
				title: {
					display: false,
				},
				legend: {
					display: false,
				},
				tooltip: {
					callbacks: {
						label: function (tooltipItem) {
							return tooltipItem.formattedValue + 'GB';
						},
					},
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
					type: 'time',
					min: () => usageFetcher.data?.drive?.startDate,
					max: () => usageFetcher.data?.drive?.endDate,
					time: {
						unit: () =>
							dateOptions.filter((x) => x.value === unit)?.[0]?.unit ||
							undefined,
					},
					grid: {
						display: false,
					},
				},
			},
		};
	}, [unit, usageFetcher.data]);

	const [options, setOptions] = useState(getOptions());

	useEffect(() => {
		usageFetcher.load(
			url +
				`?range=${unit}&unit=${dateOptions.filter((x) => x.value === unit)?.[0]
					?.unit}`,
		);
	}, [unit]);

	useEffect(() => {
		if (usageFetcher.state === 'loading') {
			setChartData(emptyDataset);
		}
	}, [usageFetcher]);

	const emptyDataset = {
		datasets: [],
	};
	const [chartData, setChartData] = useState<ChartData<'bar'>>(emptyDataset);

	useEffect(() => {
		const chart = chartRef.current;

		if (!chart) {
			return;
		}
		const chartData = {
			labels: usageFetcher.data?.drive?.usage?.map((x: Usage) => x.createdAt),
			datasets: [
				{
					fill: true,
					label: 'Used',
					data: usageFetcher.data?.drive?.usage?.map((x: Usage) =>
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
					fill: true,
					data: usageFetcher.data?.drive?.usage?.map((x: Usage) =>
						bytes(Number(x.free), { unit: 'GB' }).replace('GB', ''),
					),
					borderColor: '#cbd5e1',
					backgroundColor: '#e2e8f0',
					borderRadius: { topLeft: 2, topRight: 2 },
				},
			],
		};
		setOptions(getOptions());
		setChartData(chartData);
	}, [usageFetcher.data]);

	return (
		<>
			<div className="w-full space-y-5">
				<div className="flex space-x-2 justify-between">
					<H3 className="text-3xl">Storage History</H3>
					<div className="space-x-2 flex">
						<Button
							variant="outline"
							className="h-8"
							onClick={() =>
								usageFetcher.load(
									url +
										`?range=${unit}&unit=${dateOptions.filter(
											(x) => x.value === unit,
										)?.[0]?.unit}`,
								)
							}
						>
							<RefreshCw size={14} />
						</Button>
						<DateFilter value={unit} onChange={setUnit} />
					</div>
				</div>
				<div className="h-[450px] relative">
					<Line ref={chartRef} options={options} data={chartData} />
					{usageFetcher.state === 'loading' && (
						<div className="absolute flex content-center top-0 bottom-0 right-0 left-0">
							<Loader className="m-auto animate-spin" />
						</div>
					)}
				</div>
				<div className="flex space-x-4 text-muted-foreground">
					<div className="flex space-x-2 items-center">
						<Circle
							className={`fill-[#e2e8f0] text-[#cbd5e1] h-3 w-3`}
							size={10}
						/>
						<span>Free</span>
					</div>
					<div className="flex space-x-2 items-center">
						<Circle
							className={`fill-[#7dd3fc] text-[#0ea5e9] h-3 w-3`}
							size={10}
						/>
						<span>Used</span>
					</div>
				</div>
			</div>
		</>
	);
};
