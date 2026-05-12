import { parse } from "@tediousjs/connection-string";

export function parseSql(conn: string) {
	return Object.fromEntries(parse(conn));
}
