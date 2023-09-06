import { CronJob } from 'quirrel/remix';
import searchServiceServer from './searchService.server';

export default CronJob('/queues/search', '0 * * * *', async (meta) => {
	searchServiceServer.enqueue('load');
});
