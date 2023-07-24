import { Button } from '~/components/ui/button';
import Monitor from '~/components/monitorForms/base';

export default function NewMonitor({ className }: { className: string }) {
	return (
		<Monitor monitor={{}}>
			<Button variant="ghost" className={className}>
				Add Monitor
			</Button>
		</Monitor>
	);
}
