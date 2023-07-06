import { decrypt } from '@/lib/utils';
import { NodeSSH } from 'node-ssh';
import { Queue } from 'quirrel/remix';
import { getServer, serverLog, updateServer } from '~/models/server.server';

export default Queue('queues/monitor', async (job, meta) => {
  const server = await getServer({ id: job });
  const { username, host, password, port, privateKey } = server;

  try {
    const ssh = new NodeSSH();
    await ssh.connect({
      username,
      host,
      password: password ? decrypt(password) : undefined,
      port,
      privateKey: privateKey ? decrypt(privateKey) : undefined,
    });

    // $body = @{}
    // $body.storage=(gdr -PSProvider 'FileSystem')
    // $body.info=(Get-CIMInstance CIM_ComputerSystem)
    // Invoke-WebRequest `
    // -
    // -Uri http://localhost:3000 -Method POST -Body ($body|ConvertTo-Json) -ContentType application/json

    const storage = await ssh.execCommand(
      'powershell -command "gdr -PSProvider \'FileSystem\'|ConvertTo-Json"',
    );
    const info = await ssh.execCommand(
      'powershell -command "Get-CIMInstance CIM_ComputerSystem|ConvertTo-Json"',
    );

    if (info.code !== 0) {
      throw info;
    }

    const i = JSON.parse(info.stdout);

    if (storage.code !== 0) {
      throw storage;
    }

    const s = JSON.parse(storage.stdout);

    const sum = (
      used: string | null | undefined,
      free: string | null | undefined,
    ) => {
      let usedNum = 0;
      let freeNum = 0;
      if (used !== null && used !== undefined && parseInt(used)) {
        usedNum = parseInt(used);
      }
      if (free !== null && free !== undefined && parseInt(free)) {
        freeNum = parseInt(free);
      }

      return (usedNum + freeNum).toString();
    };

    await updateServer({
      id: server.id,
      data: {
        name: i.Name,
        dnsHostName: i.DNSHostName,
        domain: i.Domain,
        manufacturer: i.Manufacturer,
        model: i.Model,
        systemFamily: i.SystemFamily,
        systemSkuNumber: i.SystemSKUNumber,
        systemType: i.SystemType,
        totalPhysicalMemory: i.TotalPhysicalMemory.toString(),
        serverName: i.ServerName,
      },
      drives: s.map(
        (drive: {
          CurrentLocation: any;
          Name: any;
          Root: any;
          Description: any;
          MaximumSize: { toString: () => any };
          Used: string | null | undefined;
          Free: string | null | undefined;
        }) => {
          return {
            data: {
              location: drive.CurrentLocation,
              name: drive.Name,
              root: drive.Root,
              description: drive.Description,
              maximumSize: drive.MaximumSize?.toString(),
              size: sum(drive.Used, drive.Free),
            },
            used: drive.Used?.toString(),
            free: drive.Free?.toString(),
          };
        },
      ),
    });
  } catch (e) {
    serverLog({
      serverId: server.id,
      type: 'error',
      message: JSON.stringify(e),
    });
    console.log(`${job} monitor failed.`);
  }
});
