import type { MonitorFeeds } from '@prisma/client';

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
import {
	createLinearGradient,
	darkErrorGradient,
	darkGradient,
	lightErrorGradient,
	lightGradient,
} from './functions';
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

export const PingChart = ({ url }: { url: string }) => {
	const pingFetcher = useFetcher();
	const [unit, setUnit] = useState('last_24_hours');
	const chartRef = useRef<ChartJS>(null);

	Tooltip.positioners.mouse = function (items, evtPos) {
		return evtPos;
	};

	const getOptions = useCallback(() => {
		return {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				intersect: false,
				mode: 'index',
			},
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
					position: 'mouse',
					callbacks: {
						label: function (tooltipItem) {
							return tooltipItem.formattedValue + 'ms';
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
							return value + 'ms';
						},
					},
					stacked: true,
				},
				x: {
					stacked: true,
					type: 'time',
					min: () => pingFetcher.data?.monitor?.startDate,
					max: () => pingFetcher.data?.monitor?.endDate,
					time: {
						unit: () =>
							dateOptions.filter((x) => x.value === unit)?.[0]?.chartUnit ||
							undefined,
					},
					grid: {
						display: false,
					},
				},
			},
		};
	}, [unit, pingFetcher.data]);

	const [options, setOptions] = useState(getOptions());

	useEffect(() => {
		pingFetcher.load(url + `?range=${unit}`);
	}, [unit]);

	useEffect(() => {
		if (pingFetcher.state === 'loading') {
			setChartData(emptyDataset);
		}
	}, [pingFetcher]);

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
			datasets: [
				{
					spanGaps: 1000 * 60 * 1.5, // 1.5 min
					fill: true,
					label: 'Response Time',
					cubicInterpolationMode: 'monotone',
					tension: 0.4,
					data: pingFetcher.data?.monitor?.feeds?.map((x: MonitorFeeds) => ({
						x: x.createdAt,
						y: Number(x?.ping),
					})),
					segment: {
						borderColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return pingFetcher.data?.monitor?.feeds?.[ctx.p0DataIndex]
								?.hasError
								? darkErrorGradient[0]
								: darkGradient[0];
						},
						backgroundColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return pingFetcher.data?.monitor?.feeds?.[ctx.p0DataIndex]
								?.hasError
								? lightErrorGradient[0]
								: lightGradient[0];
						},
						hoverBorderColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return pingFetcher.data?.monitor?.feeds?.[ctx.p0DataIndex]
								?.hasError
								? darkErrorGradient[1]
								: darkGradient[1];
						},
						hoverBackgroundColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return pingFetcher.data?.monitor?.feeds?.[ctx.p0DataIndex]
								?.hasError
								? lightErrorGradient[1]
								: lightGradient[1];
						},
					},
					pointStyle: false,
				},
			],
		};
		setOptions(getOptions());
		setChartData(chartData);
	}, [pingFetcher.data]);

	return (
		<>
			<div className="w-full space-y-5">
				<div className="flex space-x-2 justify-between">
					<H3 className="text-3xl">Response Time</H3>
					<div className="space-x-2 flex">
						<Button
							variant="outline"
							className="h-8"
							onClick={() => pingFetcher.load(url + `?range=${unit}`)}
						>
							<RefreshCw size={14} />
						</Button>
						<DateFilter value={unit} onChange={setUnit} />
					</div>
				</div>
				<div className="h-[450px] relative">
					<Line ref={chartRef} options={options} data={chartData} />
					{pingFetcher.state === 'loading' && (
						<div className="absolute flex content-center top-0 bottom-0 right-0 left-0">
							<Loader className="m-auto animate-spin" />
						</div>
					)}
				</div>
				<small className="text-muted-foreground">*Peak values shown.</small>
			</div>
		</>
	);
};
