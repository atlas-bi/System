import type { MonitorFeeds } from "~/models/monitor.server";

import bytes from "bytes";
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
import { useCallback, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { createLinearGradient, darkGradient, lightGradient } from "./functions";
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
import { Circle, Loader, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

export const MemoryChart = ({ url }: { url: string }) => {
	type MemoryFetcherData = {
		monitor?: {
			startDate?: string | number | Date;
			endDate?: string | number | Date;
			feeds?: Array<{ createdAt: string | Date; free: number; used: number }>;
		};
	};
	const usageFetcher = useFetcher<MemoryFetcherData>();
	const [unit, setUnit] = useState("last_24_hours");

	Tooltip.positioners.mouse = function (items, evtPos) {
		return evtPos;
	};

	const getOptions = useCallback((): ChartOptions<"line"> => {
		const startDate = usageFetcher.data?.monitor?.startDate;
		const endDate = usageFetcher.data?.monitor?.endDate;
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
						label: function (tooltipItem: {
							datasetIndex: number;
							formattedValue: string;
						}) {
							if (tooltipItem.datasetIndex === 0) {
								return tooltipItem.formattedValue + "GB Used";
							}
							return tooltipItem.formattedValue + "GB Free";
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
							return `${tickValue}GB`;
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
	}, [unit, usageFetcher.data]);

	const [options, setOptions] = useState<ChartOptions<"line">>(getOptions());

	useEffect(() => {
		usageFetcher.load(url + `?range=${unit}`);
	}, [unit]);

	useEffect(() => {
		if (usageFetcher.state === "loading") {
			setChartData(emptyDataset);
		}
	}, [usageFetcher]);

	const emptyDataset: ChartData<"line", { x: Date; y: number }[]> = {
		datasets: [],
	};
	const [chartData, setChartData] =
		useState<ChartData<"line", { x: Date; y: number }[]>>(emptyDataset);

	useEffect(() => {
		const xUnit =
			dateOptions.filter((x) => x.value === unit)?.[0]?.chartUnit || "hour";
		const chartData: ChartData<"line", { x: Date; y: number }[]> = {
			datasets: [
				{
					spanGaps: 1000 * 60 * (xUnit == "hour" ? 1.5 : 90), // 1.5 min or 1.5 hour
					fill: true,
					label: "Used",
					cubicInterpolationMode: "monotone" as const,
					tension: 0.4,
					data:
						usageFetcher.data?.monitor?.feeds?.map((x) => ({
							x: new Date(x.createdAt),
							y: Number(
								bytes(Number(x.used), {
									unit: "GB",
								})?.replace("GB", "") ?? "0",
							),
						})) ?? [],
					segment: {
						borderColor: (ctx: ScriptableLineSegmentContext) => {
							if (ctx.p0.skip || ctx.p1.skip) return "transparent";
							return darkGradient[0];
						},
						backgroundColor: (ctx: ScriptableLineSegmentContext) => {
							if (ctx.p0.skip || ctx.p1.skip) return "transparent";
							return lightGradient[0];
						},
					},
					pointStyle: false as const,
				},
				{
					spanGaps: 1000 * 60 * (xUnit == "hour" ? 1.5 : 90), // 1.5 min or 1.5 hour
					label: "Free",
					fill: true,
					data:
						usageFetcher.data?.monitor?.feeds?.map((x) => ({
							x: new Date(x.createdAt),
							y: Number(
								bytes(Number(x.free) || 0, { unit: "GB" })?.replace("GB", "") ??
									"0",
							),
						})) ?? [],
					borderColor: "#cbd5e1",
					backgroundColor: "#e2e8f0",
					cubicInterpolationMode: "monotone" as const,
					pointStyle: false as const,
					tension: 0.4,
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
					<H3 className="text-3xl">Memory History</H3>
					<div className="space-x-2 flex">
						<Button
							variant="outline"
							className="h-8"
							onClick={() =>
								usageFetcher.load(
									url + `?range=${unit}`,
									//&unit=${dateOptions.filter(
									//	(x) => x.value === unit,
									//)?.[0]?.unit}`,
								)
							}
						>
							<RefreshCw size={14} />
						</Button>
						<DateFilter value={unit} onChange={setUnit} />
					</div>
				</div>
				<div className="h-[450px] relative">
					<Line options={options} data={chartData} />
					{usageFetcher.state === "loading" && (
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
						<span>Total</span>
					</div>
				</div>
				<small className="text-muted-foreground">*Peak values shown.</small>
			</div>
		</>
	);
};
