import type { MonitorFeeds } from "~/models/monitor.server";

import {
	LineElement,
	CategoryScale,
	ChartData,
	Chart as ChartJS,
	ChartOptions,
	LinearScale,
	PointElement,
	type ScriptableLineSegmentContext,
	Tooltip,
	Filler,
	TimeScale,
} from "chart.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
	darkErrorGradient,
	darkGradient,
	lightErrorGradient,
	lightGradient,
} from "./functions";
import { useFetcher } from "@remix-run/react";
import { DateFilter } from "./DateFilter";
import { dateOptions } from "~/models/dates";

ChartJS.register([
	CategoryScale,
	LinearScale,
	LineElement,
	PointElement,
	TimeScale,
	Filler,
	Tooltip,
]);

import "chartjs-adapter-date-fns";
import { H2, H3 } from "../ui/typography";
import { Loader, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export const PingChart = ({ url }: { url: string }) => {
	type PingFetcherData = {
		monitor?: {
			startDate?: string | number | Date;
			endDate?: string | number | Date;
			feeds?: Array<{
				createdAt: string | Date;
				ping: string | null;
				hasError: boolean;
			}>;
		};
	};
	const pingFetcher = useFetcher<PingFetcherData>();
	const [unit, setUnit] = useState("last_24_hours");

	Tooltip.positioners.mouse = function (items, evtPos) {
		return evtPos;
	};

	const getOptions = useCallback((): ChartOptions<"line"> => {
		const startDate = pingFetcher.data?.monitor?.startDate;
		const endDate = pingFetcher.data?.monitor?.endDate;
		const min = startDate ? new Date(startDate).getTime() : undefined;
		const max = endDate ? new Date(endDate).getTime() : undefined;
		type AllowedTimeUnit =
			| "millisecond"
			| "second"
			| "minute"
			| "hour"
			| "day"
			| "week"
			| "month"
			| "quarter"
			| "year";
		const allowedTimeUnits: AllowedTimeUnit[] = [
			"millisecond",
			"second",
			"minute",
			"hour",
			"day",
			"week",
			"month",
			"quarter",
			"year",
		];
		const candidateTimeUnit = dateOptions.filter((x) => x.value === unit)?.[0]
			?.chartUnit;
		const timeUnit =
			candidateTimeUnit &&
			allowedTimeUnits.includes(candidateTimeUnit as AllowedTimeUnit)
				? (candidateTimeUnit as AllowedTimeUnit)
				: undefined;

		return {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				intersect: false,
				mode: "index" as const,
			},
			animation: {
				duration: 300,
			},
			plugins: {
				title: {
					display: false,
				},
				legend: {
					display: false,
				},
				tooltip: {
					position: "mouse",
					callbacks: {
						label: function (tooltipItem: { formattedValue: string }) {
							return tooltipItem.formattedValue + "ms";
						},
					},
				},
			},
			scales: {
				y: {
					type: "linear" as const,
					display: true,
					position: "left" as const,
					beginAtZero: true,
					ticks: {
						callback: function (tickValue: number | string) {
							return `${tickValue}ms`;
						},
					},
					stacked: true,
				},
				x: {
					stacked: true,
					type: "time",
					min,
					max,
					time: {
						unit: timeUnit,
					},
					grid: {
						display: false,
					},
				},
			},
		};
	}, [unit, pingFetcher.data]);

	const [options, setOptions] = useState<ChartOptions<"line">>(getOptions());

	useEffect(() => {
		pingFetcher.load(url + `?range=${unit}`);
	}, [unit]);

	useEffect(() => {
		if (pingFetcher.state === "loading") {
			setChartData(emptyDataset);
		}
	}, [pingFetcher]);

	const emptyDataset: ChartData<"line", { x: Date; y: number }[]> = {
		datasets: [],
	};
	const [chartData, setChartData] =
		useState<ChartData<"line", { x: Date; y: number }[]>>(emptyDataset);

	useEffect(() => {
		const chartData: ChartData<"line", { x: Date; y: number }[]> = {
			datasets: [
				{
					spanGaps: 1000 * 60 * 1.5, // 1.5 min
					fill: true,
					label: "Response Time",
					cubicInterpolationMode: "monotone" as const,
					tension: 0.4,
					data:
						pingFetcher.data?.monitor?.feeds?.map((x) => ({
							x: new Date(x.createdAt),
							y: Number(x.ping),
						})) ?? [],
					segment: {
						borderColor: (ctx: ScriptableLineSegmentContext) => {
							if (ctx.p0.skip || ctx.p1.skip) return "transparent";
							return pingFetcher.data?.monitor?.feeds?.[ctx.p0DataIndex]
								?.hasError
								? darkErrorGradient[0]
								: darkGradient[0];
						},
						backgroundColor: (ctx: ScriptableLineSegmentContext) => {
							if (ctx.p0.skip || ctx.p1.skip) return "transparent";
							return pingFetcher.data?.monitor?.feeds?.[ctx.p0DataIndex]
								?.hasError
								? lightErrorGradient[0]
								: lightGradient[0];
						},
					},
					pointRadius: 0,
					pointHoverRadius: 0,
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
					<Line options={options} data={chartData} />
					{pingFetcher.state === "loading" && (
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
