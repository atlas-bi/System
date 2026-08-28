// @vitest-environment node

import { describe, expect, it } from "vitest";
import { parseSql } from "./utils.server";

describe("parseSql", () => {
	it("parses a SQL Server connection string into key/value pairs", () => {
		expect(
			parseSql(
				"Server=localhost;Database=Atlas;User Id=sa;Password=secret;Encrypt=false",
			),
		).toEqual({
			server: "localhost",
			database: "Atlas",
			"user id": "sa",
			password: "secret",
			encrypt: "false",
		});
	});
});
