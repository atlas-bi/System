import { CronJob } from 'quirrel/remix';
import { getEnabledMonitors } from '~/models/monitor.server';

import monitorServer from './monitor.server';

export default CronJob('/queues/heartbeat', '* * * * *', async (meta) => {
  try {
    const jobs = await getEnabledMonitors();
    jobs.map((job: { id: string }) => monitorServer.enqueue(job.id));
  } catch (e) {
    console.log('heartbeat failed.', e);
  }
});
