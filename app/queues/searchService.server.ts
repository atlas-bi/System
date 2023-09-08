import { Queue } from 'quirrel/remix';
import { MeiliSearch } from 'meilisearch';
import { getSearchData } from '~/models/search.server';

export default Queue('queues/searchService', async () => {
	try {
		const client = new MeiliSearch({
			host: process.env.MEILISEARCH_URL || 'localhost:7700',
			apiKey: process.env.MEILI_MASTER_KEY || undefined,
		});

		const index = client.index('base');
		await index.deleteAllDocuments();
		// client.updateIndex('base', { primaryKey: 'id' })

		index.updateSearchableAttributes([
			'url',
			'title',
			'name',
			'tags',
			'description',
			'meta',
		]);

		index.updateDisplayedAttributes([
			'url',
			'title',
			'name',
			'tags',
			'description',
			'enabled',
			'hasError',
			'httpUrl',
		]);

		const searchData = await getSearchData();

		const r = await client.index('base').addDocuments(searchData);
		console.log(r);
		// const stats = await client.getStats();
		// console.log(stats);
	} catch (e) {
		console.log('search load failed.', e);
	}
});
