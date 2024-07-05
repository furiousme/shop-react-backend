import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {SQSBatchItemFailure, SQSEvent} from "aws-lambda";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";



const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

export const handler = async (event: SQSEvent) => {
    console.log(event)

    const records = event.Records;

    if (!process.env.PRODUCTS_TABLE_NAME || !process.env.STOCKS_TABLE_NAME) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, body: "Internal server error"}),
          };
    }

    if (!records) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, body: "No records present"}),
          };
    }

    const batchItemFailures: SQSBatchItemFailure[] = [];

    const promises = records.map(async (record) => {
        const jsonObject = JSON.parse(record.body);
        console.log("PARSED OBJECT", jsonObject);

        const newProductId = randomUUID();

        const newProduct = {
            id: newProductId,
            title: jsonObject.title,
            description: jsonObject.description,
            price: jsonObject.price
        }
        const newStock = {
            id: randomUUID(),
            product_id: newProductId,
            count: jsonObject.count
        }

        return docClient.send(new TransactWriteCommand({
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
            }))
            .then(() => {
                console.log("PRODUCT AND STOCK WERE SUCCESSFULLY SAVED");

                snsClient.send(new PublishCommand({
                    TopicArn: process.env.SNS_TOPIC_ARN,
                    Message: JSON.stringify({
                        newProduct,
                        newStock
                    }), 
                    Subject: "New Product Added",
                    MessageAttributes: {
                        count: {
                            DataType: "Number",
                            StringValue: `${newStock.count}`,
                        },
                    },
                }))
                .then(() => {
                    console.log("Message was successfully sent to SNS");
                })
                .catch((e) => {
                    console.log("Failed to send message to SNS", e);
                })
            })
            .catch(e => {
                console.log("Error sending items to db", e)
                batchItemFailures.push({ itemIdentifier: record.messageId })
            })
    })

    try {
        await Promise.all(promises);


        console.log("Not handled items:", JSON.stringify(batchItemFailures));

        return {
            statusCode: 200,
            body: JSON.stringify({ batchItemFailures }),
        };
    }catch (e) {
        console.log("ERROR saving items to db", e)
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, body: "Internal server error"}),
        };
    }

};