import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Product, Stock, TypedScanCommandOutput } from "../../../models";
import { prepareProductsWithStock } from "../../../utils/prepare-products";

export const defaultHeaders = { "Content-Type": "application/json" };

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async () => {
  const productsPromise = docClient.send(new ScanCommand({
    TableName: process.env.PRODUCTS_TABLE_NAME,
  })) as Promise<TypedScanCommandOutput<Product[]>>;

  const stocksPromise = docClient.send(new ScanCommand({
    TableName: process.env.STOCKS_TABLE_NAME,
  })) as Promise<TypedScanCommandOutput<Stock[]>>;

  const response = await Promise
    .all([productsPromise, stocksPromise])
    .then(([productsResponse, stocksResponse]) => {
      const products = productsResponse.Items;
      const stocks = stocksResponse.Items;

      console.log({products, stocks});

      const items =  products && stocks ? prepareProductsWithStock(products, stocks) : [];

      return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(items)
      }
    })
    .catch((e) => {
      console.log("ERROR:", JSON.stringify(e));
      
      return {
        statusCode: 500,
        headers: defaultHeaders,
        body: JSON.stringify({success: false, message: "Internal error"})
      }
    })

    return response;
};