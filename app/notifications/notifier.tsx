import {
  getMonitor,
  monitorLog,
  setDrivePercFreeSentAt,
  driveLog,
} from '~/models/monitor.server';
import type { Drive, DriveUsage } from '~/models/monitor.server';
import SMTP from './smtp';
import Telegram from './telegram';
import type { Notification } from '~/models/notification.server';

export default async function Notifier({ job }: { job: string }) {
  const monitor = await getMonitor({ id: job });

  // drive notifications

  monitor?.drives?.map(async (drive: Drive & { usage: DriveUsage[] }) => {
    // don't report inactive drives.
    if (drive.inactive) return;

    // drive has no usages, ignore.
    if (drive.usage.length <= 0) return;

    if (drive.missingNotify) {
      // notify if drive was missing
    }

    if (drive.percFreeNotify) {
      //notify space < %

      // drive has no usages, ignore.
      if (drive.usage.length <= 0) return;

      // console.log("here!", drive)

      // should we send?
      const percFree = (Number(drive.usage[0].used) / Number(drive.size)) * 100;

      if (percFree < drive.percFreeValue) {
        console.log('alert!!!', percFree, drive.percFreeValue);

        await driveLog({
          driveId: drive.id,
          type: 'error',
          message: `Percentage of free space (${percFree}%} is less than limit of ${drive.percFreeValue}`,
        });

        console.log('types', drive.percFreeNotifyTypes);

        if (drive.percFreeNotifyTypes) {
          const subject = `Alert: free space limit exceeded on ${monitor.host} ${drive.name}`;
          const message = `Alert: free space limit exceeded on ${monitor.host} ${drive.name}`;

          drive.percFreeNotifyTypes.map(
            async (notification: Notification) =>
              await sendNotification({ notification, subject, message }),
          );

          await setDrivePercFreeSentAt({
            id: drive.id,
            percFreeNotifySentAt: new Date(),
          });
        } else {
          // reset the notification time
          await setDrivePercFreeSentAt({
            id: drive.id,
            percFreeNotifySentAt: undefined,
          });
        }
      } else {
        // reset the notification time
        await setDrivePercFreeSentAt({
          id: drive.id,
          percFreeNotifySentAt: undefined,
        });
      }

      // percFreeNotifyResendAfterMinutes
      // percFreeNotifySentAt

      // percFreeNotifyTypes
    }

    if (drive.sizeFreeNotify) {
    }

    if (drive.growthRateNotify) {
    }
  });
}

const sendNotification = async ({
  notification,
  subject,
  message,
}: {
  notification: Notification;
  subject: string;
  message: string;
}) => {
  if (notification.type == 'smtp') {
    await SMTP({ notification, subject, message });
  } else if (notification.type == 'telegram') {
    await Telegram({ notification, message: subject });
  }
};
