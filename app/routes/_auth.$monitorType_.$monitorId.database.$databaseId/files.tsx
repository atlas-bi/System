import { useFetcher, useLocation, useParams } from '@remix-run/react';
import { useEffect } from 'react';
import { Database } from '~/models/monitor.server';
import { columns } from './filesTableColumns';
import { FilesTable } from './filesTable';
import { Skeleton } from '~/components/ui/skeleton';

export const FilesMeta = ({ database }: { database: Database }) => {
	let { monitorId, monitorType } = useParams();

	const fileFetcher = useFetcher();
	const location = useLocation();
	// if we redirect to another monitor we need to reload drives
	useEffect(() => {
		if (fileFetcher.state === 'idle' && fileFetcher.data == null) {
			fileFetcher.load(
				`/${monitorType}/${monitorId}/database/${database.id}/files`,
			);
		}
	}, []);

	useEffect(() => {
		if (fileFetcher.state === 'idle' && fileFetcher.data == null) {
			fileFetcher.load(
				`/${monitorType}/${monitorId}/database/${database.id}/files`,
			);
		}
	}, [location]);

	useEffect(() => {
		if (fileFetcher.state === 'idle' && fileFetcher.data == null) {
			fileFetcher.load(
				`/${monitorType}/${monitorId}/database/${database.id}/files`,
			);
		}
	}, [fileFetcher, database]);

	return (
		<>
			{fileFetcher.data ? (
				fileFetcher.data.files ? (
					<FilesTable
						files={fileFetcher.data?.files}
						columns={columns}
						database={database}
					/>
				) : (
					<>no files.</>
				)
			) : (
				<Skeleton className="border rounded-md min-h-[100px] w-full" />
			)}
		</>
	);
};
