import { vi } from "vitest";
import {
	dateRange,
	jsonParser,
	namedAction,
	redirectBack,
	safeRedirect,
	validateEmail,
} from "./utils";

test("validateEmail returns false for non-emails", () => {
	expect(validateEmail(undefined)).toBe(false);
	expect(validateEmail(null)).toBe(false);
	expect(validateEmail("")).toBe(false);
	expect(validateEmail("not-an-email")).toBe(false);
	expect(validateEmail("n@")).toBe(false);
});

test("validateEmail returns true for emails", () => {
	expect(validateEmail("kody@example.com")).toBe(true);
});

test("safeRedirect blocks unsafe destinations", () => {
	expect(safeRedirect(null)).toBe("/");
	expect(safeRedirect("//evil.example")).toBe("/");
	expect(safeRedirect("https://evil.example")).toBe("/");
	expect(safeRedirect("/dashboard")).toBe("/dashboard");
	expect(safeRedirect("/dashboard", "/home")).toBe("/dashboard");
});

test("jsonParser returns parsed JSON or the original value", () => {
	expect(jsonParser('["200s"]')).toEqual(["200s"]);
	expect(jsonParser("plain-text")).toBe("plain-text");
});

test("dateRange returns the expected windows", () => {
	const lastDay = dateRange("last_24_hours");
	expect(lastDay.endDate.getTime()).toBeGreaterThanOrEqual(
		lastDay.startDate.getTime(),
	);
	expect(dateRange("today").startDate).toEqual(dateRange("today").startDate);
	expect(
		Math.abs(
			dateRange(null).startDate.getTime() -
				dateRange("last_24_hours").startDate.getTime(),
		),
	).toBeLessThanOrEqual(1);
	expect(dateRange("yesterday").startDate.getTime()).toBeLessThan(
		dateRange("today").startDate.getTime(),
	);
	expect(dateRange("this_week").endDate.getTime()).toBeGreaterThanOrEqual(
		dateRange("this_week").startDate.getTime(),
	);
	expect(dateRange("last_7_days").startDate.getTime()).toBeLessThan(
		dateRange("today").startDate.getTime(),
	);
	expect(dateRange("this_month").startDate.getTime()).toBeLessThanOrEqual(
		dateRange("today").startDate.getTime(),
	);
	expect(dateRange("last_30_days").startDate.getTime()).toBeLessThan(
		dateRange("today").startDate.getTime(),
	);
	expect(dateRange("last_90_days").startDate.getTime()).toBeLessThan(
		dateRange("today").startDate.getTime(),
	);
	expect(dateRange("this_year").startDate.getFullYear()).toBe(
		new Date().getFullYear(),
	);
	expect(dateRange("all_time").startDate.getFullYear()).toBeLessThan(
		new Date().getFullYear(),
	);
});

test("namedAction dispatches to the selected handler", async () => {
	const handler = vi.fn(async () => new Response("ok"));
	const request = new Request("http://localhost/form", {
		method: "POST",
		body: new URLSearchParams({ _action: "save", title: "Example" }),
	});

	await expect(namedAction(request, { save: handler })).resolves.toBeInstanceOf(
		Response,
	);
	expect(handler).toHaveBeenCalled();
});

test("namedAction rejects unknown actions", async () => {
	const request = new Request("http://localhost/form", {
		method: "POST",
		body: new URLSearchParams({ _action: "missing" }),
	});

	await expect(namedAction(request, {})).rejects.toBeInstanceOf(Response);
});

test("redirectBack prefers the referer header", () => {
	const response = redirectBack(
		new Request("http://localhost/current", {
			headers: { Referer: "http://localhost/previous" },
		}),
		{ fallback: "/fallback" },
	);

	expect(response.status).toBe(302);
	expect(response.headers.get("Location")).toBe("http://localhost/previous");
});

test("redirectBack uses the fallback when referer is missing", () => {
	const response = redirectBack(new Request("http://localhost/current"), {
		fallback: "/fallback",
	});

	expect(response.status).toBe(302);
	expect(response.headers.get("Location")).toBe("/fallback");
});
