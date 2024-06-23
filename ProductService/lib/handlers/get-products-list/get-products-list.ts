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

  const items = await Promise
    .all([productsPromise, stocksPromise])
    .then(([productsResponse, stocksResponse]) => {
      const products = productsResponse.Items;
      const stocks = stocksResponse.Items;

      return products && stocks ? prepareProductsWithStock(products, stocks) : []
    })
    .catch((e) => {
      console.log("ERROR:", JSON.stringify(e));
      return []
    })

  return {
    statusCode: 200,
    body: JSON.stringify(items)
  }
};