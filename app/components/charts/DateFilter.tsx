import { Dispatch, Fragment } from 'react';
import {
	Select,
	SelectContent,
	SelectItemNoIndicator,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select';
import { Separator } from '~/components/ui/separator';
import { dateOptions } from '~/models/dates';

export const DateFilter = ({
	value,
	onChange,
}: {
	value?: string;
	onChange: Dispatch<string>;
}) => {
	return (
		<Select value={value || 'last_24_hours'} onValueChange={onChange}>
			<SelectTrigger className="h-8 w-[150px] focus:ring-0 focus:ring-offset-0">
				<SelectValue
					placeholder={
						dateOptions.filter((x) => x.value === value)?.[0]?.name ||
						'Last 24 hours'
					}
				/>
			</SelectTrigger>
			<SelectContent side="top">
				{dateOptions.map((option) => (
					<Fragment key={option.value}>
						{option.divider && <Separator className="my-1" />}
						<SelectItemNoIndicator value={option.value}>
							{option.name}
						</SelectItemNoIndicator>
					</Fragment>
				))}
			</SelectContent>
		</Select>
	);
};
