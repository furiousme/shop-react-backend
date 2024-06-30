import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../../../constants";
import {handler}  from "./get-products-by-id";

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const mockProduct = {
  "id": "b07102fd-f82a-4caa-9543-3e7a9a17f56f",
  "title": "Hydrating Face Cream",
  "description": "A lightweight face cream that provides long-lasting hydration.",
  "price": 25
};

const mockStock = {
"id": "498f1e8d-cc59-49de-81dc-a07fbc61c844",
"product_id": "b07102fd-f82a-4caa-9543-3e7a9a17f56f",
"count": 21
}

const marshalledMockProduct = {
  id: { S: 'b07102fd-f82a-4caa-9543-3e7a9a17f56f' },
  title: { S: 'Hydrating Face Cream' },
  description: {
    S: 'A lightweight face cream that provides long-lasting hydration.'
  },
  price: { N: '25' }
}


const marshalledMockStock = {
  id: { S: '498f1e8d-cc59-49de-81dc-a07fbc61c844' },
  product_id: { S: 'b07102fd-f82a-4caa-9543-3e7a9a17f56f' },
  count: { N: '21' }
}


describe("getProductsById lambda", () => {
    const ORIG_ENV = process.env;

    beforeAll(() => {
      process.env = { ...ORIG_ENV, PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME: STOCKS_TABLE_NAME }
      jest.spyOn(console, 'log').mockImplementation(() => {});
    })
    
    afterAll(() => {
      jest.restoreAllMocks();
      process.env = ORIG_ENV
    })

    it("should return a product item if it was found", async () => {
        const mockProductItemsResult = Promise.resolve({Items: [marshalledMockProduct]});
        const mockStockItemsResult = Promise.resolve({Items: [marshalledMockStock]})
        const mockResult = {...mockProduct, count: mockStock.count };

        jest
          .spyOn(DynamoDBDocumentClient.prototype, "send")
          .mockReturnValueOnce(mockProductItemsResult as never)
          .mockReturnValueOnce(mockStockItemsResult as never);

        const result = await handler({pathParameters: {
            productId: mockProduct.id,
        }});

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toStrictEqual(mockResult);  
    });

    it("should return 400 status code and an error if product id is invalid", async () => {
        const result = await handler({pathParameters: {
            productId: "",
        }});

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBeDefined();

    });

    it("should return 404 status code and an error if a product was not found", async () => {
      const mockProductItemsResult = Promise.resolve({Items: []});
      const mockStockItemsResult = Promise.resolve({Items: []});

      jest
        .spyOn(DynamoDBDocumentClient.prototype, "send")
        .mockReturnValueOnce(mockProductItemsResult as never)
        .mockReturnValueOnce(mockStockItemsResult as never);

      const result = await handler({ pathParameters: {
          productId: "9999",
      }});

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error?.message).toBe("Product not found");
    });
  })