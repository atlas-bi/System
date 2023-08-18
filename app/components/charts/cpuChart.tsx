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
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
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

const SubChart = ({
	speed,
	unit,
	setUnit,
	fetcherState,
	data,
	startDate,
	endDate,
}) => {
	const chartRef = useRef<ChartJS>(null);

	Tooltip.positioners.mouse = function (items, evtPos) {
		return evtPos;
	};

	const emptyDataset = {
		datasets: [],
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
							if (tooltipItem.datasetIndex === 0) {
								return tooltipItem.formattedValue + '% Used';
							}
							if (tooltipItem.datasetIndex > 0) {
								if (speed) return tooltipItem.raw / 1000 + 'GHz';
								return '';
							}
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
							return value + '%';
						},
					},
					stacked: false,
					max: 100,
				},
				y2: {
					type: 'linear' as const,
					display: speed,
					position: 'right' as const,
					beginAtZero: true,
					ticks: {
						callback: function (value: string) {
							return Number(value) / 1000 + 'GHz';
						},
					},
					stacked: false,
				},
				x: {
					stacked: true,
					type: 'time',
					min: () => startDate,
					max: () => endDate,
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
	}, [unit, data]);
	const [options, setOptions] = useState(getOptions());

	const [chartData, setChartData] = useState<ChartData<'bar'>>(emptyDataset);
	useEffect(() => {
		if (fetcherState === 'loading') {
			setChartData(emptyDataset);
		}
	}, [fetcherState]);

	useEffect(() => {
		const chart = chartRef.current;

		if (!chart) {
			return;
		}

		const chartData = {
			labels: data?.map((x: MonitorFeeds) => x.createdAt),
			datasets: [
				{
					spanGaps: 1000 * 60 * 1.5, // 1.5 min
					fill: speed,
					label: 'Load',
					cubicInterpolationMode: 'monotone',
					tension: 0.4,
					data: data?.map((x: MonitorFeeds) => Number(x.cpuLoad)),
					segment: {
						borderColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								darkGradient,
							);
						},
						backgroundColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								lightGradient,
							);
						},
						hoverBackgroundColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								darkGradient,
							);
						},
						hoverBorderColor: (ctx) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								darkGradient,
							);
						},
					},
					pointStyle: false,
				},
				{
					label: 'Speed',
					fill: false,
					data: data?.map((x: MonitorFeeds) => Number(x.cpuSpeed)),
					borderColor: '#cbd5e1',
					backgroundColor: '#e2e8f0',
					borderRadius: { topLeft: 2, topRight: 2 },
					cubicInterpolationMode: 'monotone',
					pointStyle: false,
					tension: 0.4,
					yAxisID: 'y2',
				},
			],
		};
		setOptions(getOptions());
		setChartData(chartData);
	}, [data]);

	return <Line ref={chartRef} options={options} data={chartData} />;
};

export const CpuChart = ({
	url,
	speed = true,
}: {
	url: string;
	speed?: boolean;
}) => {
	const usageFetcher = useFetcher();
	const [unit, setUnit] = useState('last_24_hours');

	useEffect(() => {
		usageFetcher.load(`${url}?range=${unit}`);
	}, [unit]);

	return (
		<>
			<div className="w-full space-y-5">
				<div className="flex space-x-2 justify-between">
					<H3 className="text-3xl">CPU Load History</H3>
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
					<SubChart
						speed={speed}
						unit={unit}
						data={usageFetcher.data?.monitor?.feeds}
						startDate={usageFetcher.data?.monitor?.startDate}
						endDate={usageFetcher.data?.monitor?.endDate}
					/>

					{usageFetcher.state === 'loading' && (
						<div className="absolute flex content-center top-0 bottom-0 right-0 left-0">
							<Loader className="m-auto animate-spin" />
						</div>
					)}
				</div>

				<div className="grid sm:grid-cols-1 md:grid-cols-3 ls:grid-cols-4">
					{usageFetcher.data?.monitor?.cpus.map((x) => (
						<div key={x.id}>
							<H3 className="text-base">CPU {x.title}</H3>
							<div className="h-[150px] relative" key={x.id}>
								<SubChart
									unit={unit}
									speed={false}
									data={x.usage}
									startDate={usageFetcher.data?.monitor?.startDate}
									endDate={usageFetcher.data?.monitor?.endDate}
								/>
								{usageFetcher.state === 'loading' && (
									<div className="absolute flex content-center top-0 bottom-0 right-0 left-0">
										<Loader className="m-auto animate-spin" />
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="flex space-x-4 text-muted-foreground">
					<div className="flex space-x-2 items-center">
						<Circle
							className={`fill-[#e2e8f0] text-[#cbd5e1] h-3 w-3`}
							size={10}
						/>
						<span>Speed</span>
					</div>
					<div className="flex space-x-2 items-center">
						<Circle
							className={`fill-[#7dd3fc] text-[#0ea5e9] h-3 w-3`}
							size={10}
						/>
						<span>Load</span>
					</div>
				</div>
				<small className="text-muted-foreground">*Peak values shown.</small>
			</div>
		</>
	);
};
