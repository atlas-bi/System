'use client';

import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

import { Command as CommandPrimitive } from 'cmdk';
import { Badge } from './badge';
import { Command, CommandGroup, CommandItem, CommandEmpty } from './command';
import { Label } from './label';

type DataItem = Record<'value' | 'label', string>;

export function MultiSelect({
	label = 'Select an item',
	placeholder = 'Select an item',
	parentClassName,
	data,
	onChange,
	name,
	active = [],
}: {
	label?: string;
	placeholder?: string;
	parentClassName?: string;
	data: DataItem[];
	onChange?: any;
	name?: string;
	active?: DataItem[];
}) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [open, setOpen] = React.useState(false);
	const [selected, setSelected] = React.useState<DataItem[]>(active);
	const [inputValue, setInputValue] = React.useState('');

	const handleUnselect = React.useCallback((item: DataItem) => {
		setSelected((prev) => prev.filter((s) => s.value !== item.value));
	}, []);

	React.useEffect(() => {
		console.log(typeof onChange);
		if (typeof onChange == 'function') onChange(selected);
	}, [selected]);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const input = inputRef.current;
			if (input) {
				if (e.key === 'Delete' || e.key === 'Backspace') {
					if (input.value === '') {
						setSelected((prev) => {
							const newSelected = [...prev];
							newSelected.pop();
							return newSelected;
						});
					}
				}
				// This is not a default behaviour of the <input /> field
				if (e.key === 'Escape') {
					input.blur();
				}
			}
		},
		[],
	);

	const selectables = data.filter((item) => !selected.includes(item));

	return (
		<div
			className={cn(
				label && 'gap-1.5',
				parentClassName,
				'grid w-full items-center',
			)}
		>
			{label && (
				<Label className="text-slate-700 text-sm font-medium">{label}</Label>
			)}
			<Command
				onKeyDown={handleKeyDown}
				className="overflow-visible bg-transparent"
			>
				<div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
					<div className="flex gap-1 flex-wrap">
						{selected.map((item, index) => {
							{
								/*if (index > 1) return;*/
							}
							return (
								<Badge key={item.value} variant="secondary">
									{name && (
										<input type="hidden" name={name} value={item.value} />
									)}
									{item.label}
									<button
										className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleUnselect(item);
											}
										}}
										onMouseDown={(e) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										onClick={() => handleUnselect(item)}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</button>
								</Badge>
							);
						})}
						{/*{selected.length > 2 && <p>{`+${selected.length - 2} more`}</p>}*/}
						{/* Avoid having the "Search" Icon */}
						<CommandPrimitive.Input
							ref={inputRef}
							value={inputValue}
							onValueChange={setInputValue}
							onBlur={() => setOpen(false)}
							onFocus={() => setOpen(true)}
							placeholder={placeholder}
							className="ml-0 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
						/>
					</div>
				</div>
				<div className="relative mt-2 z-10">
					{open && selectables.length > 0 ? (
						<div className="absolute w-full top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
							{/*<CommandEmpty>No results found.</CommandEmpty>*/}
							<CommandGroup className="h-full overflow-auto">
								{selectables.map((framework) => {
									return (
										<CommandItem
											key={framework.value}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onSelect={(value) => {
												setInputValue('');
												setSelected((prev) => [...prev, framework]);
											}}
										>
											{framework.label}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</div>
					) : null}
				</div>
			</Command>
		</div>
	);
}
