import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu';

import NewMonitor from './NewMonitor';
import NewNotification from './NewNotification';

export function Links() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NewMonitor className={navigationMenuTriggerStyle()} />
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NewNotification className={navigationMenuTriggerStyle()} />
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
