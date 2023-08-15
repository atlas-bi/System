import { Button } from '~/components/ui/button';
import Notification from '~/components/notificationForms/base';

export default function NewNotification({ className }: { className: string }) {
	return (
		<Notification notification={{ smtpPort: '25' }}>
			<Button variant="ghost" className={className}>
				Add Notification
			</Button>
		</Notification>
	);
}
