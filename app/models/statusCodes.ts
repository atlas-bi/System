export const statusCodes = [
	{ label: '100-199', value: '100s' },
	{ label: '200-299', value: '200s' },
	{ label: '300-399', value: '300s' },
	{ label: '400-499', value: '400s' },
	{ label: '500-599', value: '500s' },
	...[...Array(999).keys()]
		.map((x) => {
			if (x > 99) {
				return { label: x.toString(), value: x.toString() };
			}
		})
		.filter((x) => x),
];
