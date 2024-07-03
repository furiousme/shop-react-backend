const csv = require("csv-parser");

import { FIXME, Product, ProductWithStock } from './../../../../ProductService/models/index';

import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {GetQueueUrlCommand, SQS, SendMessageBatchCommand} from "@aws-sdk/client-sqs"
import { Readable } from 'stream';
import {randomUUID} from "node:crypto"; 

const s3client = new S3Client();
const sqsClient = new SQS();


export const handler = async (event: FIXME) => {
    console.log("EVENT:", JSON.stringify(event));

    const destinationBucket = process.env.DESTINATION_BUCKET_NAME;
    
    const processRecords = event.Records.map(async (record: FIXME) => {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;
      const destinationKey = key.replace("uploaded", "parsed");

      const copyParams = {
        Bucket: destinationBucket,
        CopySource: `${bucket}/${key}`,
        Key: destinationKey,
      };
      
      const objectParams = {
        Bucket: bucket,
        Key: key,
      };

      const copyCommand = new CopyObjectCommand(copyParams);
      const deleteCommand = new DeleteObjectCommand(objectParams);
      const getCommand = new GetObjectCommand(objectParams);
      const { Body } = await s3client.send(getCommand);

      if (!(Body instanceof Readable)) {
        throw new Error('Body is not a readable stream');
      }
      
      const parsedResult: ProductWithStock[] = [];

      return new Promise((resolve, reject) => {
        Body.pipe(csv())
          .on('data', (data: ProductWithStock) => parsedResult.push(data))
          .on('end', async () => {
            console.log("PARSED DATA:", JSON.stringify(parsedResult));

            try {
              await s3client.send(copyCommand);
              await s3client.send(deleteCommand);

              console.log("The file was successfully moved");
            } catch (e) {
              console.log("Error moving the file:", JSON.stringify(e));
            }

            try {
              const { QueueUrl } = await sqsClient.send( new GetQueueUrlCommand({
                QueueName: process.env.SQS_QUEUE_NAME,
              }));

              const records = parsedResult.map((product) => {
                return {
                  Id: randomUUID(),
                  MessageBody: JSON.stringify({
                    title: product?.title,
                    description: product?.description,
                    price: Number(product?.price),
                    count: Number(product?.count),
                  }),
                };
              });
                    
              await sqsClient.send(new SendMessageBatchCommand({
                QueueUrl,
                Entries: records,
              }));
            } catch (e) {
              console.log("Error sending messages to SQS")
              console.log(e)
            }

            resolve(parsedResult);
          })
          .on('error', (err: unknown) => reject(err));
      });
    });

    try {
      await Promise.all(processRecords);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
        }),
      };
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: { message: "Error processing csv file"}
        })
      }
    }
};