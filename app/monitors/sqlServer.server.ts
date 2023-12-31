import {
	Monitor,
	monitorError,
	updateMonitor,
	getMonitorDisabledDatabases,
	setFileDays,
	setFileGrowth,
	DatabaseFile,
} from '~/models/monitor.server';
import mssql from 'mssql';
import Notifier from '~/notifications/notifier';
import { decrypt } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

export default async function SqlServerMonitor({
	monitor,
}: {
	monitor: Monitor;
}) {
	const { sqlConnectionString } = monitor;

	let startTime = Date.now();

	try {
		if (!sqlConnectionString) throw new Error('Connection string not defined.');

		let name,
			version,
			model,
			manufacturer,
			os,
			osVersion,
			lastBootTime,
			cpuLoad,
			targetMemory,
			usedMemory,
			databaseInfo,
			fileInfo,
			osInfo;

		let pool;
		try {
			pool = new mssql.ConnectionPool(decrypt(sqlConnectionString.toString()));
			await pool.connect();
			const systemInfo = (
				await pool.request().query(
					`
WITH SQLProcessCPU
AS (
    SELECT TOP (1) SQLProcessUtilization AS 'CPU_Usage'
        , ROW_NUMBER() OVER (
            ORDER BY (
                    SELECT NULL
                    )
            ) AS 'row_number'
    FROM (
        SELECT record.value('(./Record/@id)[1]', 'int') AS record_id
            , record.value('(./Record/SchedulerMonitorEvent/SystemHealth/SystemIdle)[1]', 'int') AS [SystemIdle]
            , record.value('(./Record/SchedulerMonitorEvent/SystemHealth/ProcessUtilization)[1]', 'int') AS [SQLProcessUtilization]
            , [timestamp]
        FROM (
            SELECT [timestamp]
                , CONVERT(XML, record) AS [record]
            FROM sys.dm_os_ring_buffers
            WHERE ring_buffer_type = N'RING_BUFFER_SCHEDULER_MONITOR'
                AND record LIKE '%<SystemHealth>%'
            ) AS x
        ) AS y
    )
SELECT SERVERPROPERTY('SERVERNAME') AS servername
    , SERVERPROPERTY('productversion') AS productversion
    , SERVERPROPERTY('edition') AS edition
    , SERVERPROPERTY('productversion')as year
    , (
        SELECT 'SQL Server ' + CASE CAST(SERVERPROPERTY('productversion') AS CHAR(2))
                WHEN '8.'
                    THEN '2000'
                WHEN '9.'
                    THEN '2005'
                WHEN '10'
                    THEN '2008/2008R2'
                WHEN '11'
                    THEN '2012'
                WHEN '12'
                    THEN '2014'
                WHEN '13'
                    THEN '2016'
                WHEN '14'
                    THEN '2017'
                WHEN '15'
                    THEN '2019'
                WHEN '16'
                    THEN '2022'
                END
        ) AS manufacturer
    , (
        SELECT create_date AS lastBootTime
        FROM sys.databases
        WHERE name = 'tempdb'
        ) lastBootTime
    , (
        SELECT AVG(CPU_Usage)
        FROM SQLProcessCPU
        WHERE row_number = 1
        ) AS 'cpu'
    , -- 5 min average
    --https://www.brentozar.com/archive/2018/05/how-to-tell-if-your-sql-server-has-too-much-memory/
    (
        SELECT cntr_value*1024 --kb to bytes
        FROM sys.dm_os_performance_counters
        WHERE counter_name LIKE '%Target Server%'
        ) targetMemory
    , (
        SELECT cntr_value*1024 --kb to bytes
        FROM sys.dm_os_performance_counters
        WHERE counter_name LIKE '%Total Server%'
        ) usedMemory
`,
				)
			)?.recordset?.[0];

			name = systemInfo.servername;
			version = systemInfo.productversion;
			model = systemInfo.edition;
			manufacturer = systemInfo.manufacturer;

			lastBootTime = systemInfo.lastBootTime.toISOString();
			targetMemory = systemInfo.targetMemory;
			usedMemory = systemInfo.usedMemory;
			cpuLoad = systemInfo.cpu;

			// os info
			if (systemInfo.year > 13) {
				// after 2016
				osInfo = (
					await pool.request().query(`
						select  (
        SELECT host_platform AS osType
        FROM sys.dm_os_host_info
        ) osType
    , (
        SELECT host_distribution AS os
        FROM sys.dm_os_host_info
        ) os
    , (
        SELECT host_release AS osVersion
        FROM sys.dm_os_host_info
        ) osVersion`)
				)?.recordset?.[0];
			} else {
				osInfo = (
					await pool.request().query(`
select 'Windows' as os,
case when windows_release ='10.0' then'Windows Server 2016 10.0'
when windows_release ='6.3' then 'Windows 8.1, Windows Server 2012 R2 6.3'
when windows_release ='6.2' then 'Windows 8, Windows Server 2012 6.2'
when windows_release ='6.1' then 'Windows 7, Windows Server 2008 R2 6.1'
when windows_release ='6.0' then 'Windows Server 2008, Windows Vista 6.0'
when windows_release ='5.2' then 'Windows Server 2003 R2, Windows Server 2003, Windows XP 64-Bit Edition 5.2'
when windows_release ='5.1' then 'Windows XP 5.1'
when windows_release ='5.0' then 'Windows 2000 5.0' end as osVersion
from sys.dm_os_windows_info`)
				)?.recordset?.[0];
			}

			os = osInfo.os;
			osVersion = osInfo.osVersion;

			// create mem temp table
			await pool.request().query(``);
			// database info

			let memQuery = '',
				memJoin = '',
				memCol = '';
			if (monitor.sqlDisableDbMemory !== true) {
				memQuery = `
				    drop table if exists #mem;
					SELECT database_id
								-- 8kb files
				        , cast(COUNT_BIG(*) as bigint) * 8 * 1024 AS db_buffer_pages
						into #mem
				    FROM sys.dm_os_buffer_descriptors
				    GROUP BY database_id`;

				memJoin = `LEFT OUTER JOIN #mem ON #mem.database_id = d.database_id`;
				memCol = `, db_buffer_pages AS pagesInMemory`;
			}

			databaseInfo = (
				await pool.request().batch(
					`
					${memQuery}

SELECT d.database_id databaseId
    , d.name
    , d.state_desc stateDesc
    , d.recovery_model_desc recoveryModel
    , d.compatibility_level compatLevel
    ${memCol}
    , bu.full_last_date backupDataDate
    , bu.full_size backupDataSize
    , bu.log_last_date backupLogDate
    , bu.log_size backupLogSize
FROM sys.databases d
LEFT JOIN (
    SELECT database_name
        , full_last_date = MAX(CASE
                WHEN [type] = 'D'
                    THEN backup_finish_date
                END)
        , full_size = MAX(CASE
                WHEN [type] = 'D'
                    THEN backup_size
                END)
        , log_last_date = MAX(CASE
                WHEN [type] = 'L'
                    THEN backup_finish_date
                END)
        , log_size = MAX(CASE
                WHEN [type] = 'L'
                    THEN backup_size
                END)
    FROM (
        SELECT s.database_name
            , s.[type]
            , s.backup_finish_date
            , backup_size =
            -- already in bytes
            CASE
                WHEN s.backup_size = s.compressed_backup_size
                    THEN s.backup_size
                ELSE s.compressed_backup_size
                END
            , RowNum = ROW_NUMBER() OVER (
                PARTITION BY s.database_name
                , s.[type] ORDER BY s.backup_finish_date DESC
                )
        FROM msdb.dbo.backupset s
        WHERE s.[type] IN ('D', 'L')
        ) f
    WHERE f.RowNum = 1
    GROUP BY f.database_name
    ) bu
    ON d.name = bu.database_name
    ${memJoin}
ORDER BY d.database_id DESC
`,
				)
			)?.recordset;

			fileInfo = (
				await pool.request().batch(`
DECLARE @command VARCHAR(5000)
DECLARE @DBInfo TABLE
( database_id int,
database_name varchar(500),
file_id int,
name VARCHAR(500),
physical_name VARCHAR(500),
is_percent_growth NVARCHAR(520),
state_desc NVARCHAR(520),
type_desc NVARCHAR(520),
total_size bigint,
used_size bigint,
growth NVARCHAR(500),
max_size bigint
)

SELECT @command = 'Use ?
SELECT d.database_id, ''?''
        , mf.file_id
        , mf.name
        , mf.physical_name
        , mf.is_percent_growth
        , mf.state_desc
        , mf.type_desc
        , total_size = cast(mf.size AS BIGINT) * 8 * 1024
        , used_size = CAST(FILEPROPERTY(mf.[name], ''SpaceUsed'') as bigint) * 8 * 1024
        , case when mf.is_percent_growth = 1 then mf.growth else mf.growth * 8 * 1024 end growth
        , CASE
            WHEN mf.max_size < 0
                THEN NULL
            ELSE cast(mf.max_size AS BIGINT) * 8 * 1024
            END AS max_size
    FROM sys.master_files mf
    inner join sys.databases d on mf.database_id=d.database_id
    where d.name=''?''
   '
INSERT INTO @DBInfo
EXEC sp_MSForEachDB @command

SELECT t.database_id databaseId
    , t.[type_desc] typeDesc
    , t.state_desc stateDesc
    , t.total_size AS currentSize
    , t.used_size as usedSize
    , t.growth
    , t.is_percent_growth isPercentGrowth
    , t.file_id fileId
    , t.name fileName
    , t.physical_name physicalName
    , t.max_size maxSize
FROM @DBInfo t
OPTION (
    RECOMPILE
    , MAXDOP 1
    );

`)
			)?.recordset;

			pool.close();
		} catch (e) {
			if (pool) {
				pool.close();
			}
			throw new Error(e);
		}

		const ping = Date.now() - startTime;

		const disabledDatabases = await getMonitorDisabledDatabases({
			monitorId: monitor.id,
		});

		// only update databases that are enabled.
		const updateableDatabases = databaseInfo.filter((database) => {
			const l =
				disabledDatabases.filter((d) => d.databaseId == database.databaseId)
					.length == 0;
			return l;
		});

		const data = await updateMonitor({
			id: monitor.id,
			data: {
				name,
				version,
				model,
				manufacturer,
				os,
				osVersion,
				lastBootTime,
			},
			databases: updateableDatabases.map((d) => ({
				data: {
					databaseId: d.databaseId.toString(),
					name: d.name,
					state: d.stateDesc,
					recoveryModel: d.recoveryModel,
					compatLevel: d.compatLevel.toString(),
					backupDataDate: d.backupDataDate
						? d.backupDataDate.toISOString()
						: null,
					backupDataSize: d.backupDataSize ? d.backupDataSize.toString() : null,
					backupLogDate: d.backupLogDate ? d.backupLogDate.toISOString() : null,
					backupLogSize: d.backupLogSize ? d.backupLogSize.toString() : null,
				},
				files: fileInfo
					.filter((f) => f.databaseId == d.databaseId)
					.map((f) => ({
						data: {
							sqlDatabaseId: f.databaseId ? f.databaseId.toString() : null,
							fileName: f.fileName,
							type: f.typeDesc,
							growth: f.growth ? f.growth.toString() : null,
							isPercentGrowth: f.isPercentGrowth
								? f.isPercentGrowth.toString()
								: null,
							fileId: f.fileId ? f.fileId.toString() : null,
							filePath: f.physicalName,
							state: f.stateDesc,
						},
						usedSize: f.usedSize ? f.usedSize.toString() : null,
						currentSize: f.currentSize ? f.currentSize.toString() : null,
						maxSize: f.maxSize ? f.maxSize.toString() : null,
					})),
				memory: d.pagesInMemory ? d.pagesInMemory.toString() : null,
			})),
			feed: {
				ping: ping.toString(),
				cpuLoad: cpuLoad?.toString(),
				memoryFree: (Number(targetMemory) - Number(usedMemory)).toString(),
				memoryTotal: targetMemory?.toString(),
			},
		});

		// calculate days till full
		data.databases?.map(
			(d: { files?: DatabaseFile[] }) =>
				d.files?.map(async (file: DatabaseFile) => {
					// if (!file.usage || file.usage.length <= 1) {
					await setFileDays({ id: file.id, daysTillFull: null });
					await setFileGrowth({ id: file.id, growthRate: null });
					// } else {
					// 	const end = file.usage[0];
					// 	const start = file.usage[file.usage.length - 1];
					// 	const diffDays =
					// 		differenceInDays(end.createdAt, start.createdAt) + 1;
					// 	const usedGrowth = end.size - start.size;
					// 	const free = Number(end.maxSize) - end.size;
					// 	const daysTillFull = (
					// 		Math.max(Math.round((free * diffDays) / usedGrowth), -1) || -1
					// 	).toString();
					// 	await setFileDays({ id: file.id, daysTillFull });
					// 	await setFileGrowth({
					// 		id: file.id,
					// 		growthRate: (usedGrowth / diffDays).toString(),
					// 	});
					// }
				}),
		);

		await Notifier({ job: monitor.id });

		console.log(`successfully ran ${monitor.type} monitor: ${monitor.id}`);
	} catch (e) {
		console.log(e);
		let message = e.toString();
		try {
			message = JSON.stringify(e);
			// don't return nothing
			if (message === '{}') {
				message = e.toString();
			}
		} catch (e) {}

		await Notifier({ job: monitor.id, message });
		await monitorError({ id: monitor.id });
		console.log(`${monitor.type} monitor ${monitor.id} failed.`);
	}
}
