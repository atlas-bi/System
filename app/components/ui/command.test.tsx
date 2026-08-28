import { act } from "react";
import { createRoot } from "react-dom/client";

import { Command, CommandItem } from "./command";

describe("CommandItem", () => {
	it("only applies disabled styling when disabled is true", () => {
		const container = document.createElement("div");
		const root = createRoot(container);

		act(() => {
			root.render(
				<Command>
					<CommandItem>200</CommandItem>
				</Command>,
			);
		});

		expect(container.querySelector('[cmdk-item=""]')).toHaveClass(
			"data-[disabled=true]:opacity-50",
		);

		act(() => root.unmount());
	});
});
