import { CronJob } from 'quirrel/remix';
import { getEnabledServers } from '~/models/server.server';

import monitorServer from './monitor.server';

// scheduled for 1 AM UTC.
export default CronJob('/queues/heartbeat', '* * * * *', async (meta) => {
  const jobs = await getEnabledServers();
  jobs.map((job: { id: string }) => monitorServer.enqueue(job.id));
});
