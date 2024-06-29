const csv = require("csv-parser");

import { FIXME } from './../../../../ProductService/models/index';

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Product } from 'aws-cdk-lib/aws-servicecatalog';
import { Readable } from 'stream';

const client = new S3Client();

export const handler = async (event: FIXME) => {
    console.log("EVENT:", JSON.stringify(event));

    try {
        const processRecords = event.Records.map(async (record: FIXME) => {
          const bucket = record.s3.bucket.name;
          const key = record.s3.object.key;
          
          const getObjectParams = {
            Bucket: bucket,
            Key: key,
          };
    
          const command = new GetObjectCommand(getObjectParams);
          const { Body } = await client.send(command);
    
          if (!(Body instanceof Readable)) {
            throw new Error('Body is not a readable stream');
          }
          
          const parsedResult: Product[] = [];
    
          return new Promise((resolve, reject) => {
            Body.pipe(csv())
              .on('data', (data: Product) => parsedResult.push(data))
              .on('end', () => {
                console.log("PARSED DATA:", JSON.stringify(parsedResult));
                resolve(parsedResult);
              })
              .on('error', (err: unknown) => reject(err));
          });
        });
    
        await Promise.all(processRecords);
    
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
          }),
        };
      } catch (error) {
        console.error('Error processing S3 event:', error);
        
        return {
          statusCode: 500,
          body: JSON.stringify({
            success: false,
            error: { message: "Internal server"}
            })
        }
    }
};