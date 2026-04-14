import { Queue } from "quirrel/remix";
import { getSearchData } from "~/models/search.server";

const normalizeMeiliHost = (host: string) => {
	if (!host) return "";
	return host.startsWith("http://") || host.startsWith("https://")
		? host
		: `http://${host}`;
};

export default Queue("queues/searchService", async () => {
	try {
		const rawHost = process.env.MEILISEARCH_URL || "";
		if (!rawHost) {
			return;
		}

		const { MeiliSearch } = await import("meilisearch");

		const client = new MeiliSearch({
			host: normalizeMeiliHost(rawHost),
			apiKey: process.env.MEILI_MASTER_KEY || undefined,
		});

		const index = client.index("base");
		await index.deleteAllDocuments();
		// client.updateIndex('base', { primaryKey: 'id' })

		index.updateSearchableAttributes([
			"url",
			"title",
			"name",
			"tags",
			"description",
			"meta",
		]);

		index.updateDisplayedAttributes([
			"url",
			"title",
			"name",
			"tags",
			"description",
			"enabled",
			"hasError",
			"httpUrl",
		]);

		const searchData = await getSearchData();

		const r = await client.index("base").addDocuments(searchData);
		console.log(r);
		// const stats = await client.getStats();
		// console.log(stats);
	} catch (e) {
		console.log("search load failed.", e);
	}
});
