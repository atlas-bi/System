// import { useMatches } from "@remix-run/react";
// import { useMemo } from "react";

import {
	endOfDay,
	endOfToday,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfToday,
	startOfWeek,
	startOfYear,
	subDays,
	subHours,
	subYears,
} from 'date-fns';

// import type { User } from "~/models/user.server";

const DEFAULT_REDIRECT = '/';

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
	to: FormDataEntryValue | string | null | undefined,
	defaultRedirect: string = DEFAULT_REDIRECT,
) {
	if (!to || typeof to !== 'string') {
		return defaultRedirect;
	}

	if (!to.startsWith('/') || to.startsWith('//')) {
		return defaultRedirect;
	}

	return to;
}

// /**
//  * This base hook is used in other hooks to quickly search for specific data
//  * across all loader data using useMatches.
//  * @param {string} id The route id
//  * @returns {JSON|undefined} The router data or undefined if not found
//  */
// export function useMatchesData(
//   id: string
// ): Record<string, unknown> | undefined {
//   const matchingRoutes = useMatches();
//   const route = useMemo(
//     () => matchingRoutes.find((route) => route.id === id),
//     [matchingRoutes, id]
//   );
//   return route?.data;
// }

// function isUser(user: any): user is User {
//   return user && typeof user === "object" && typeof user.email === "string";
// }

// export function useOptionalUser(): User | undefined {
//   const data = useMatchesData("root");
//   if (!data || !isUser(data.user)) {
//     return undefined;
//   }
//   return data.user;
// }

// export function useUser(): User {
//   const maybeUser = useOptionalUser();
//   if (!maybeUser) {
//     throw new Error(
//       "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
//     );
//   }
//   return maybeUser;
// }

export const jsonParser = (str: any) => {
	try {
		return JSON.parse(str);
	} catch (e) {
		return str;
	}
};

export function validateEmail(email: unknown): email is string {
	return typeof email === 'string' && email.length > 3 && email.includes('@');
}

export function dateRange(key: string | null = 'last_24_hours') {
	const today = new Date();
	switch (key) {
		case 'today':
			return { startDate: startOfToday(), endDate: endOfToday() };
			break;
		case 'last_24_hours':
		default:
			return { startDate: subHours(today, 24), endDate: today };
			break;
		case 'yesterday':
			return {
				startDate: startOfDay(subDays(today, 1)),
				endDate: endOfDay(subDays(today, 1)),
			};
			break;
		case 'this_week':
			return { startDate: startOfWeek(today), endDate: endOfWeek(today) };
			break;
		case 'last_7_days':
			return { startDate: subDays(today, 7), endDate: endOfToday() };
			break;
		case 'this_month':
			return { startDate: startOfMonth(today), endDate: endOfToday() };
			break;
		case 'last_30_days':
			return { startDate: subDays(today, 30), endDate: endOfToday() };
			break;
		case 'last_90_days':
			return { startDate: subDays(today, 90), endDate: endOfToday() };
			break;
		case 'this_year':
			return { startDate: startOfYear(today), endDate: endOfToday() };
			break;
		case 'all_time':
			return { startDate: subYears(today, 50), endDate: endOfToday() };
			break;
	}
}
