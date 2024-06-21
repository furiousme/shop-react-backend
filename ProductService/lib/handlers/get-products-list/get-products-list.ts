import mockProducts from "../../../mocks/mock-products";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME} from './../../../constants'



export const defaultHeaders = {
  headers: { "Content-Type": "application/json" },
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async () => {
  const productsResponse = await docClient.send(new ScanCommand({
    TableName: PRODUCTS_TABLE_NAME,
  }));

  const stocksResponse = await docClient.send(new ScanCommand({
    TableName: STOCKS_TABLE_NAME,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      products: productsResponse,
      stocks: stocksResponse
    })
  }
};