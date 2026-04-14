declare module "tcp-ping" {
	export interface PingResult {
		address: string;
		port: number;
		time: number;
		results: Array<{
			time: number;
			seq: number;
			ttl?: number;
		}>;
	}

	export function ping(
		address: string,
		port: number,
		callback: (err: Error | null, result?: PingResult) => void,
	): void;

	export function ping(
		options: {
			address: string;
			port: number;
			timeout?: number;
			attempts?: number;
		},
		callback: (err: Error | null, result?: PingResult) => void,
	): void;

	const tcpPing = { ping };
	export default tcpPing;
}
