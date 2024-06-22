import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { FIXME, Product, Stock, TypedScanCommandOutput } from "../../../models";
import { prepareProductsWithStock } from "../../../utils/prepare-products";
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from "../../../constants";

export const defaultHeaders = {
  headers: { "Content-Type": "application/json" },
}

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
      console.log("PRODUCTS_RESPONSE", productsResponse);
      console.log("STOCKS_RESPONSE", stocksResponse);

      const products = productsResponse.Items;
      const stocks = stocksResponse.Items;

      console.log("PRODUCTS:", products);
      console.log("STOCKS:", stocks);

      return products && stocks ? prepareProductsWithStock(products, stocks) : []
    })
    .catch((e) => {
      console.log("ERROR", JSON.stringify(e));
      return []
    })

    console.log("ITEMS", items);

  return {
    statusCode: 200,
    body: JSON.stringify(items)
  }
};