import { ChartArea } from 'chart.js';

export const lightGradient = [
	'#bae6fd', //200
	'#7dd3fc', //300
	'#38bdf8', //400
	'#0ea5e9', //500
];

export const darkGradient = [
	'#7dd3fc', //300
	'#38bdf8', //400
	'#0ea5e9', //500
	'#0284c7', //600
];

export const lightErrorGradient = [
	'#fecaca', //200
	'#fca5a5', //300
	'#f87171', //400
	'#ef4444', //500
];

export const darkErrorGradient = [
	'#fca5a5', //300
	'#f87171', //400
	'#ef4444', //500
	'#dc2626', //600
];

// let width: number, height: number, gradient: any;
export function createConicGradient(
	ctx: CanvasRenderingContext2D,
	chartArea: ChartArea,
	colors: string[],
) {
	if (!chartArea) {
		return;
	}
	// 135 deg = 2.3561944902 rad
	// - 1px for 1/2 the border width
	const gradient = ctx.createConicGradient(
		2.3561944902,
		chartArea.width / 2 - 1,
		chartArea.height / 2 + 13,
	);

	gradient.addColorStop(0, colors[0]);
	gradient.addColorStop(0.65, colors[1]);
	gradient.addColorStop(0.7, colors[2]);
	gradient.addColorStop(0.75, colors[3]);
	return gradient;
}

export function createLinearGradient(
	ctx: CanvasRenderingContext2D,
	chartArea: ChartArea,
	colors: string[],
) {
	if (!chartArea) {
		return;
	}

	const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height);

	gradient.addColorStop(0, colors[3]);
	gradient.addColorStop(0.05, colors[2]);
	gradient.addColorStop(0.1, colors[1]);
	gradient.addColorStop(0.15, colors[0]);
	return gradient;
}
