import { parseSqlConnectionString } from '@tediousjs/connection-string';

export function parseSql(conn: string) {
	return parseSqlConnectionString(conn, true);
}
