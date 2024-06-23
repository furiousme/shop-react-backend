import mockProducts from "../../../mocks/mock-products";
import {handler, defaultHeaders}  from "./get-products-list";

describe("getProductsList", () => {
    it("should return 200 status code and a list of products", async () => {
        const result = await handler();

        expect(result).toStrictEqual({
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify(mockProducts),
        });
    });
});