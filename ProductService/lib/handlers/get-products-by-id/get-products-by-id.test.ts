import mockProducts from "../../../mocks/mock-products";
import {handler, defaultHeaders}  from "./get-products-by-id";

describe("getProductsById", () => {
    it("should return 200 status code and a product item if it was found", async () => {
        const mockProduct = mockProducts[0];
        const result = await handler({pathParameters: {
            productId: mockProduct.id,
        }});

        expect(result).toStrictEqual({
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify(mockProduct),
        });
    });

    it("should return 400 status code and an error if product id is invalid", async () => {
        const result = await handler({pathParameters: {
            productId: "invalid id",
        }});

        expect(result).toStrictEqual({
            statusCode: 400,
            headers: defaultHeaders,
            body: JSON.stringify({error: {
                message: "Invalid product id"
            }}),
        });
    });

    it("should return 404 status code and an error if a product was not found", async () => {
        const result = await handler({ pathParameters: {
            productId: "9999",
        }});

        expect(result).toStrictEqual({
            statusCode: 404,
            headers: defaultHeaders,
            body: JSON.stringify({ error: {
                message: "Product not found" 
            }}),
        });
    });
});