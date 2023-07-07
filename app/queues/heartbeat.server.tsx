import { CronJob } from 'quirrel/remix';
import { getEnabledServers } from '~/models/server.server';

import monitorServer from './monitor.server';

export default CronJob('/queues/heartbeat', '* * * * *', async (meta) => {
  try {
    const jobs = await getEnabledServers();
    jobs.map((job: { id: string }) => monitorServer.enqueue(job.id));
  } catch (e) {
    console.log('heartbeat failed.', e);
  }
});
