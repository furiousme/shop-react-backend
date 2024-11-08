import { AttributeValue, DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { FIXME, Product, Stock, TypedQueryCommandOutput } from "../../../models";
import { prepareProductsWithStock } from "../../../utils/prepare-products";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { STOCKS_BY_PRODUCT_INDEX_NAME } from "../../../constants";
import { unmarshallItems } from "../../../utils/unmarshall-items";

export const defaultHeaders = { "Content-Type": "application/json" };

// const client = new DynamoDBClient({endpoint: "http://localhost:8000"});

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: FIXME) => {
    console.log("EVENT:", event );
    
    const productId = event.pathParameters?.productId;
    // const productId = "cdf6b78c-caaf-417f-89f5-fa6976586ffd";
    
    if (!productId) {
        return {
            statusCode: 400,
            headers: defaultHeaders,
            body: JSON.stringify({
                error: {
                    message: "Product id is required"
                } 
            })
        }
    }

    const productsPromise = docClient.send(new QueryCommand({
        TableName: process.env.PRODUCTS_TABLE_NAME,
        "ExpressionAttributeValues": {
            ":id": { "S": productId }
          },
        KeyConditionExpression: "id = :id",
      })) as Promise<TypedQueryCommandOutput<Record<string, AttributeValue>[]>>;
    
    const stocksPromise = docClient.send(new QueryCommand({
        TableName: process.env.STOCKS_TABLE_NAME,
        IndexName: STOCKS_BY_PRODUCT_INDEX_NAME,
        ExpressionAttributeValues: {
            ":product_id": { "S": productId }
          },
        KeyConditionExpression: `product_id = :product_id`,
    })) as Promise<TypedQueryCommandOutput<Record<string, AttributeValue>[]>>;

    const response = await Promise
        .all([productsPromise, stocksPromise])
        .then(([productsResponse, stocksResponse]) => {
            const products = productsResponse.Items &&  unmarshallItems<Product>(productsResponse.Items);
            const stocks = stocksResponse.Items && unmarshallItems<Stock>(stocksResponse.Items);
            const preparedProducts = products && stocks ? prepareProductsWithStock(products, stocks) : []
            const item = preparedProducts[0];

            if (!item) {
                return {
                    statusCode: 404,
                    headers: defaultHeaders,
                    body: JSON.stringify({
                        error: { message: "Product not found" }              
                    }),
                }
            }

            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify(item)
            }
        })
        .catch((e) => {
            console.log("ERROR:", JSON.stringify(e));
            
            return {
                statusCode: 500,
                headers: defaultHeaders,
                body: JSON.stringify({
                    error: { message: "Internal error" }              
                }),
            }
        })

    return response;
};