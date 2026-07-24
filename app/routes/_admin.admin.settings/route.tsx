import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { prisma } from "~/db.server";
import { authenticate } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
	await authenticate(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
	return json({
		usageRetentionEnabled: settings?.usageRetentionEnabled ?? false,
		usageRetentionMonths: settings?.usageRetentionMonths ?? 24,
	});
}

export async function action({ request }: ActionFunctionArgs) {
	await authenticate(request, {
		failureRedirect: `/auth/?returnTo=${encodeURI(
			new URL(request.url).pathname,
		)}`,
	});

	const formData = await request.formData();
	const months = Number(formData.get("usageRetentionMonths"));
	const enabled = formData.get("usageRetentionEnabled") === "on";

	if (!Number.isInteger(months) || months < 1) {
		return json(
			{ error: "Select a valid data retention period." },
			{ status: 400 },
		);
	}

	await prisma.appSettings.upsert({
		where: { id: 1 },
		create: {
			id: 1,
			usageRetentionEnabled: enabled,
			usageRetentionMonths: months,
		},
		update: {
			usageRetentionEnabled: enabled,
			usageRetentionMonths: months,
		},
	});

	return redirect("/admin/settings");
}

export default function Settings() {
	const { usageRetentionEnabled, usageRetentionMonths } =
		useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	return (
		<div className="max-w-xl space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">Data Retention</h1>
				<p className="text-muted-foreground">
					Automatically delete collected usage data older than the selected
					period.
				</p>
			</div>

			<Form method="post" className="space-y-4">
				<div className="flex items-center justify-between rounded-md border p-4">
					<div className="space-y-1">
						<Label htmlFor="usageRetentionEnabled">
							Enable automatic cleanup
						</Label>
						<p className="text-sm text-muted-foreground">
							Delete old usage data once a day.
						</p>
					</div>
					<Switch
						id="usageRetentionEnabled"
						name="usageRetentionEnabled"
						defaultChecked={usageRetentionEnabled}
						value="on"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="usageRetentionMonths">Keep data for</Label>
					<select
						id="usageRetentionMonths"
						name="usageRetentionMonths"
						defaultValue={usageRetentionMonths}
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						{[1, 3, 6, 12, 24, 36, 60, 120].map((months) => (
							<option value={months} key={months}>
								{months} {months === 1 ? "month" : "months"}
							</option>
						))}
					</select>
					<p className="text-sm text-muted-foreground">
						The job runs every day at 02:00 and only runs when enabled.
					</p>
				</div>
				{actionData?.error && (
					<p className="text-sm text-destructive">{actionData.error}</p>
				)}
				<Button type="submit">Save settings</Button>
			</Form>
		</div>
	);
}
