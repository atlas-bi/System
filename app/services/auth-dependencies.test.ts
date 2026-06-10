import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { Authenticator } from "remix-auth";

const require = createRequire(import.meta.url);

const rootPackage = JSON.parse(
	readFileSync(join(process.cwd(), "package.json"), "utf8"),
) as { dependencies: Record<string, string> };

const remixAuthPackage = require("remix-auth/package.json") as {
	version: string;
};

test("remix-auth remains on the v3 API used by route loaders", () => {
	expect(rootPackage.dependencies["remix-auth"]).toBe("3.7.0");
	expect(rootPackage.dependencies["remix-auth-form"]).toBe("1.5.0");
	expect(rootPackage.dependencies["remix-auth-saml"]).toBe("1.2.0");

	expect(remixAuthPackage.version).toMatch(/^3\./);
	expect(Authenticator.prototype).toHaveProperty(
		"isAuthenticated",
		expect.any(Function),
	);
});
