import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../../../constants";
import mockProducts from "../../../mocks/mock-products";
import mockStocks from "../../../mocks/mock-stocks";
import {handler}  from "./get-products-list";

jest.mock('@aws-sdk/client-dynamodb', () => {
    return {
      DynamoDBClient: jest.fn().mockImplementation(() => {
        return {};
      }),
    };
  });

jest.mock('@aws-sdk/lib-dynamodb', () => {
return {
    DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation(() => {
        return {
        send: jest.fn().mockImplementation((command) => {
            let res;

            if(command.name == 'ScanCommand'){
            if (command.TableName === PRODUCTS_TABLE_NAME) {
                res = {Items: mockProducts};
            }

            if (command.TableName === STOCKS_TABLE_NAME) {
                res = {Items: mockStocks};
            }
            }
            return Promise.resolve(res);
        }),
        };
    }),
    },
    ScanCommand: jest.fn().mockImplementation(({TableName}) => {
    return { name: 'ScanCommand', TableName };
    }),
};
});

describe("getProductsList lambda", () => {
    const ORIG_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...ORIG_ENV, PRODUCTS_TABLE_NAME: PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME: STOCKS_TABLE_NAME }
      })
    
      afterAll(() => {
        jest.restoreAllMocks();
        process.env = ORIG_ENV
      })

    it("should return a list of products on success", async () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});

        const result = await handler();
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body).toBeInstanceOf(Array);
        expect(body).toHaveLength(mockProducts.length);
    });
});