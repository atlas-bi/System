const REBOOT_DRIFT_MS = 2 * 60 * 60 * 1000;

function toMs(value: Date | string | null | undefined) {
	if (value == null || value === "") return null;
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? null : time;
}

// Host boot timestamps wander by seconds or tens of minutes without a reboot.
// A real reboot moves the timestamp forward by hours.
export function isReboot(
	previous: Date | string | null | undefined,
	next: Date | string | null | undefined,
) {
	const previousMs = toMs(previous);
	const nextMs = toMs(next);
	if (previousMs == null || nextMs == null) return false;
	return nextMs - previousMs >= REBOOT_DRIFT_MS;
}

export function resolveBootTime(
	previous: Date | string | null | undefined,
	next: Date | string | null | undefined,
) {
	const nextMs = toMs(next);
	const previousMs = toMs(previous);
	if (nextMs == null) {
		return previousMs == null ? null : new Date(previousMs).toISOString();
	}
	if (previousMs == null || isReboot(previousMs, nextMs)) {
		return new Date(nextMs).toISOString();
	}
	return new Date(previousMs).toISOString();
}
