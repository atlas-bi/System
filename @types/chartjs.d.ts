import type { TooltipPositionerFunction } from 'chart.js';

declare module 'chart.js' {
	// Extend tooltip positioner map
	interface TooltipPositionerMap {
		mouse: TooltipPositionerFunction<ChartType>;
	}
}
