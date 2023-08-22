import bytes, { Unit } from 'bytes';
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
import { H3 } from '../ui/typography';
import { CalendarDays, Circle, Loader, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { TrendingUp } from 'lucide-react';
import { DatabaseFileUsage } from '~/models/monitor.server';

export const FileChart = ({ url }: { url: string }) => {
	const usageFetcher = useFetcher();
	const [unit, setUnit] = useState('last_24_hours');
	const chartRef = useRef<ChartJS>(null);

	Tooltip.positioners.mouse = function (items, evtPos) {
		return evtPos;
	};

	const getOptions = useCallback(
		(sizeUnit: string) => {
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
							label: function (tooltipItem: { formattedValue: string }) {
								return tooltipItem.formattedValue + sizeUnit;
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
								return value + sizeUnit;
							},
						},
						stacked: true,
					},
					x: {
						stacked: true,
						type: 'time',
						min: () => usageFetcher.data?.file?.startDate,
						max: () => usageFetcher.data?.file?.endDate,
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
		},
		[unit, usageFetcher.data],
	);

	const [options, setOptions] = useState(getOptions('GB'));

	useEffect(() => {
		usageFetcher.load(url + `?range=${unit}`);
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

		let sizeUnit = 'GB';
		const max = usageFetcher.data?.file?.usage?.reduce(
			(a: number, e: { maxSize?: number | null; size?: number | null }) =>
				Math.max(
					Number(a),
					Math.max(Number(e.maxSize) || 0, Number(e.size) || 0),
				),
			0,
		);

		if (max < 10000) {
			sizeUnit = 'KB';
		} else if (max < 100000) {
			sizeUnit = 'MB';
		}

		const xUnit =
			dateOptions.filter((x) => x.value === unit)?.[0]?.chartUnit || 'hour';

		const chartData = {
			datasets: [
				{
					spanGaps: 1000 * 60 * (xUnit == 'hour' ? 1.5 : 90), // 1.5 min or 1.5 hour
					fill: true,
					label: 'Used',
					cubicInterpolationMode: 'monotone',
					tension: 0.4,
					data: usageFetcher.data?.file?.usage?.map((x: DatabaseFileUsage) => ({
						x: x.createdAt,
						y: Number(
							bytes(Number(x.size), { unit: sizeUnit as Unit }).replace(
								sizeUnit,
								'',
							),
						),
					})),
					segment: {
						borderColor: (ctx: { p0: { stop: any }; p1: { stop: any } }) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								darkGradient,
							);
						},
						backgroundColor: (ctx: {
							p0: { stop: any };
							p1: { stop: any };
						}) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								lightGradient,
							);
						},
						hoverBackgroundColor: (ctx: {
							p0: { stop: any };
							p1: { stop: any };
						}) => {
							if (ctx.p0.stop || ctx.p1.stop) return 'transparent';
							return createLinearGradient(
								chart.ctx,
								chart.chartArea,
								darkGradient,
							);
						},
						hoverBorderColor: (ctx: {
							p0: { stop: any };
							p1: { stop: any };
						}) => {
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
					label: 'Free',
					fill: true,
					data: usageFetcher.data?.file?.usage?.map((x: DatabaseFileUsage) =>
						Number(
							bytes(Math.max(Number(x.maxSize) - Number(x.size), 0), {
								unit: sizeUnit as Unit,
							}).replace(sizeUnit, ''),
						),
					),
					borderColor: '#cbd5e1',
					backgroundColor: '#e2e8f0',
					borderRadius: { topLeft: 2, topRight: 2 },
					cubicInterpolationMode: 'monotone',
					pointStyle: false,
					tension: 0.4,
				},
			],
		};
		setOptions(getOptions(sizeUnit));
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
							onClick={() => usageFetcher.load(url + `?range=${unit}`)}
						>
							<RefreshCw size={14} />
						</Button>
						<DateFilter value={unit} onChange={setUnit} />
					</div>
				</div>
				<div className="space-x-4 text-sm h-5 flex content-center">
					{usageFetcher.data?.file?.daysTillFull !== undefined && (
						<span className="flex my-auto space-x-2">
							<CalendarDays size={14} className="text-slate-400 " />
							<span>{usageFetcher.data.file.daysTillFull} days till full</span>
						</span>
					)}
					{usageFetcher.data?.file?.growthRate !== undefined && (
						<span className="flex my-auto space-x-2">
							<TrendingUp size={14} className="text-slate-400 " />
							<span>
								{bytes(usageFetcher.data?.file?.growthRate) || '0B'}/day growth
							</span>
						</span>
					)}
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
				<small className="text-muted-foreground">*Peak values shown.</small>
			</div>
		</>
	);
};
