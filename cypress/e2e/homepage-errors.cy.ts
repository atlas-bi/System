describe("homepage server errors", () => {
	it("does not return a server error for the homepage request", () => {
		cy.request({
			url: "/",
			failOnStatusCode: false,
			followRedirect: false,
		}).then((response) => {
			expect(response.status).to.be.lessThan(500);
		});
	});
});
