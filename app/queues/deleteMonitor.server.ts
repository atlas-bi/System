import { Queue } from "quirrel/remix";
import { deleteMonitor } from "~/models/monitor.server";

export default Queue("queues/deleteMonitor", async (monitorId: string) => {
	try {
		await deleteMonitor({ id: monitorId });
	} catch (error) {
		console.log("monitor delete failed.", error);
		throw error;
	}
});
