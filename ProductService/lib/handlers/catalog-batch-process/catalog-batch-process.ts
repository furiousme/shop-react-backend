import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {SQSBatchItemFailure, SQSEvent} from "aws-lambda";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// const defaultHeaders = {
//     "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
//     "X-Requested-With": "*"
// }

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: SQSEvent) => {
    console.log(event)

    const records = event.Records;

    if (!records) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, body: "No records present"}),
          };
    }

    const batchItemFailures: SQSBatchItemFailure[] = [];
    const successJsonObjects = [];

    records.forEach((record )=> {
        try { 
            const jsonObject = JSON.parse(record.body);
            console.log("PARSED OBJECT", jsonObject);
            successJsonObjects.push(jsonObject);
        } catch (e) {
            console.log(e)

            batchItemFailures.push({ itemIdentifier: record.messageId })
        }
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify({ batchItemFailures }),
    };

    return response;
};