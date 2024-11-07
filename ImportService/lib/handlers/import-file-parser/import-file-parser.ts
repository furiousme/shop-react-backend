import { ProductSchema } from './../../../../ProductService/schemas/index';
const csv = require("csv-parser");

import { FIXME, ProductWithStock } from './../../../../ProductService/models/index';

import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {GetQueueUrlCommand, SQS, SendMessageBatchCommand} from "@aws-sdk/client-sqs"
import { Readable } from 'stream';
import {randomUUID} from "node:crypto"; 
import Ajv from "ajv";


const s3client = new S3Client();
const sqsClient = new SQS({region: "eu-west-1"});

const ajv = new Ajv();

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

      const validate = ajv.compile<Omit<ProductWithStock, "id">>(ProductSchema);

      const response = await sqsClient.send(new GetQueueUrlCommand({
        QueueName: process.env.SQS_QUEUE_NAME,
      }));
      
      return new Promise((resolve, reject) => {
        Body.pipe(csv())
          .on('data', (data: ProductWithStock) => {
            const newRecord = {
              id: randomUUID(),
              title: data.title,
              description: data.description,
              price: Number(data.price),
              count: Number(data.count),
            }
            
            console.log("PARSED ROW", newRecord);
            const isValid = validate(newRecord);

            if (isValid) {
                sqsClient.send(new SendMessageBatchCommand({
                  QueueUrl: response.QueueUrl,
                  Entries: [{
                    Id: randomUUID(),
                    MessageBody: JSON.stringify(newRecord),
                  }],
                }));                
                console.log("RECORD WAS SENT TO SQS")
              } else {
              console.log("Product data is not valid");
            }
          })
          .on('end', async () => {
              try {
                await s3client.send(copyCommand);
                await s3client.send(deleteCommand);

                console.log("The file was successfully moved");
              } catch (e) {
                console.log("Error moving the file:", JSON.stringify(e));
              }

              resolve(true);
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