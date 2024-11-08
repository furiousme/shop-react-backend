import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ProductWithStock} from "../../../models";
import {APIGatewayProxyEvent} from "aws-lambda";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv"


import {randomUUID} from "node:crypto"; 
import { ProductSchema } from "../../../schemas";

const defaultHeaders = {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
    "X-Requested-With": "*"
}

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const ajv = new Ajv();

export const handler = async (event: APIGatewayProxyEvent) => {
    const parsedBody = JSON.parse(event.body || "{}");

    console.log("BODY:", parsedBody);

    const validate = ajv.compile<Omit<ProductWithStock, "id">>(ProductSchema)
    const valid = validate(parsedBody);

    if (!valid) {
        console.log("VALIDATION ERRORS", validate.errors);

        const validationError = validate.errors?.[0];
        const field = validationError?.instancePath.replace("/", "");
        const message = validationError?.message && field ? `"${field}" ${validationError.message}` : "Provided data is incorrect";

        return {
            statusCode: 400,
            headers: defaultHeaders,
            body: JSON.stringify({success: false, error: { message }})
        }
    }

    console.log("DATA IS VALID");

    const { count, description, price, title } = parsedBody;
    const newProductId = randomUUID();

    try {
        const newProduct = {description, price, title, id: newProductId};
        const newStock = { count, id: randomUUID(), product_id:  newProduct.id}
      
        await docClient.send(new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: process.env.PRODUCTS_TABLE_NAME,
                  Item: newProduct,
                },
              },
              {
                Put: {
                  TableName: process.env.STOCKS_TABLE_NAME,
                  Item: newStock,
                },
              },
            ],
        }));

        console.log("ITEM WAS CREATED");

        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({success: true, productId: newProduct.id  })
        }
    } catch (e) {
        console.log("ERROR:", e);
        
        return {
            statusCode: 500,
            headers: defaultHeaders,
            body: JSON.stringify({success: false, error: {
                message: "Failed to save product. Please, try again."
            }})
        }
    }
};