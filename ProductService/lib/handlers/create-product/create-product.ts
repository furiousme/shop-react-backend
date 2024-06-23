import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { FIXME} from "../../../models";
import {APIGatewayProxyEvent} from "aws-lambda";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import {randomUUID} from "node:crypto"; 

const defaultHeaders = {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
    "X-Requested-With": "*"
}

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log("EVENT:", event );
    const parsedBody = JSON.parse(event.body || "{}");
    const { count, description, price, title } = parsedBody;
    const newProductId = randomUUID();

    try {
        const newProduct = {description, price, title, id: newProductId};

        const savedProduct = await docClient.send(new PutCommand({
            TableName: process.env.PRODUCTS_TABLE_NAME,
            Item: newProduct
          }));
        
        const savedStock = await docClient.send(new PutCommand({
            TableName: process.env.STOCKS_TABLE_NAME,
            Item: { count, id: randomUUID(), product_id:  newProduct.id}
          }));

        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({success: true, productId: newProduct.id  })
        }
    } catch (e) {
        console.log("ERROR:", e);
        
        return {
            statusCode: 422,
            headers: defaultHeaders,
            body: JSON.stringify({success: false, error: {
                message: "Failed to save product"
            }})
        }
    }
};