import bytes, { Unit } from "bytes";
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
import { H3 } from "../ui/typography";
import { CalendarDays, Circle, Loader, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { TrendingUp } from "lucide-react";
import { DatabaseFileUsage } from "~/models/monitor.server";

export const FileChart = ({ url }: { url: string }) => {
	type FileFetcherData = {
		file?: {
			startDate?: string | number | Date;
			endDate?: string | number | Date;
			daysTillFull?: number;
			growthRate?: number;
			usage?: Array<{
				createdAt: string | Date;
				maxSize?: number | null;
				currentSize?: number | null;
				usedSize?: number | null;
				free?: number | null;
				used?: number | null;
			}>;
		};
	};
	const usageFetcher = useFetcher<FileFetcherData>();
	const [unit, setUnit] = useState("last_24_hours");

	Tooltip.positioners.mouse = function (items, evtPos) {
		return evtPos;
	};

	const getOptions = useCallback(
		(sizeUnit: string): ChartOptions<"line"> => {
			const startDate = usageFetcher.data?.file?.startDate;
			const endDate = usageFetcher.data?.file?.endDate;
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
								return tooltipItem.formattedValue + sizeUnit;
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
								return `${tickValue}${sizeUnit}`;
							},
						},
						stacked: true,
					},
					x: {
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
		},
		[unit, usageFetcher.data],
	);

	const [options, setOptions] = useState<ChartOptions<"line">>(
		getOptions("GB"),
	);

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
		useState<ChartData<"line", { x: Date; y: number | null }[]>>(emptyDataset);

	useEffect(() => {
		let sizeUnit = "GB";
		const max =
			usageFetcher.data?.file?.usage?.reduce(
				(
					a: number,
					e: {
						maxSize?: number | null;
						currentSize?: number | null;
						usedSize?: number | null;
					},
				) =>
					Math.max(
						Number(a),
						Math.max(
							Number(e.maxSize) || 0,
							Number(e.currentSize) || 0,
							Number(e.usedSize) || 0,
						),
					),
				0,
			) ?? 0;

		if (max < 10000) {
			sizeUnit = "KB";
		} else if (max < 100000) {
			sizeUnit = "MB";
		}

		const xUnit =
			dateOptions.filter((x) => x.value === unit)?.[0]?.chartUnit || "hour";

		const chartData: ChartData<"line", { x: Date; y: number | null }[]> = {
			datasets: [
				{
					spanGaps: 1000 * 60 * (xUnit == "hour" ? 1.5 : 90), // 1.5 min or 1.5 hour
					fill: true,
					label: "Used",
					cubicInterpolationMode: "monotone" as const,
					tension: 0.4,
					data:
						usageFetcher.data?.file?.usage?.map((x) => ({
							x: new Date(x.createdAt),
							y: Number(
								bytes(Number(x.used), { unit: sizeUnit as Unit })?.replace(
									sizeUnit,
									"",
								),
							),
						})) ?? [],
					segment: {
						borderColor: (ctx: ScriptableLineSegmentContext) => {
							if (ctx.p0.skip || ctx.p1.skip) return "transparent";
							const { chart } = ctx as unknown as {
								chart: { ctx: CanvasRenderingContext2D; chartArea: unknown };
							};
							return (
								createLinearGradient(
									chart.ctx,
									chart.chartArea as any,
									darkGradient,
								) ?? "transparent"
							);
						},
						backgroundColor: (ctx: ScriptableLineSegmentContext) => {
							if (ctx.p0.skip || ctx.p1.skip) return "transparent";
							const { chart } = ctx as unknown as {
								chart: { ctx: CanvasRenderingContext2D; chartArea: unknown };
							};
							return (
								createLinearGradient(
									chart.ctx,
									chart.chartArea as any,
									lightGradient,
								) ?? "transparent"
							);
						},
					},
					pointStyle: false as const,
					stack: "line-stack",
				},
				{
					spanGaps: 1000 * 60 * (xUnit == "hour" ? 1.5 : 90), // 1.5 min or 1.5 hour
					label: "Free",
					fill: true,
					data:
						usageFetcher.data?.file?.usage?.map((x) => ({
							x: new Date(x.createdAt),
							y: x.free
								? Number(
										bytes(Number(x.free), {
											unit: sizeUnit as Unit,
										})?.replace(sizeUnit, ""),
									)
								: null,
						})) ?? [],
					borderColor: "#cbd5e1",
					backgroundColor: "#e2e8f0",
					cubicInterpolationMode: "monotone" as const,
					pointStyle: false as const,
					tension: 0.4,
					stack: "line-stack",
				},
				{
					spanGaps: 1000 * 60 * (xUnit == "hour" ? 1.5 : 90), // 1.5 min or 1.5 hour
					label: "Limit",
					fill: true,
					data:
						usageFetcher.data?.file?.usage?.map((x) => ({
							x: new Date(x.createdAt),
							y: x.maxSize
								? Number(
										bytes(Number(x.maxSize), {
											unit: sizeUnit as Unit,
										})?.replace(sizeUnit, ""),
									)
								: null,
						})) ?? [],
					borderColor: "#a7f3d0",
					backgroundColor: "#d1fae5",
					cubicInterpolationMode: "monotone" as const,
					pointStyle: false as const,
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
								{bytes(usageFetcher.data?.file?.growthRate) || "0B"}/day growth
							</span>
						</span>
					)}
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
						<span>Used</span>
					</div>
					<div className="flex space-x-2 items-center">
						<Circle
							className={`fill-[#d1fae5] text-[#a7f3d0] h-3 w-3`}
							size={10}
						/>
						<span>Max</span>
					</div>
				</div>
				<small className="text-muted-foreground">*Peak values shown.</small>
			</div>
		</>
	);
};
