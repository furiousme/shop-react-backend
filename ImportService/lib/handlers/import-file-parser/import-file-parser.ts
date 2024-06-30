const csv = require("csv-parser");

import { FIXME } from './../../../../ProductService/models/index';

import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Product } from 'aws-cdk-lib/aws-servicecatalog';
import { Readable } from 'stream';

const client = new S3Client();

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
      const { Body } = await client.send(getCommand);

      if (!(Body instanceof Readable)) {
        throw new Error('Body is not a readable stream');
      }
      
      const parsedResult: Product[] = [];

      return new Promise((resolve, reject) => {
        Body.pipe(csv())
          .on('data', (data: Product) => parsedResult.push(data))
          .on('end', async () => {
            console.log("PARSED DATA:", JSON.stringify(parsedResult));

            try {
              await client.send(copyCommand);
              await client.send(deleteCommand);

              console.log("The file was successfully moved");
            } catch (e) {
              console.log("Error moving the file:", JSON.stringify(e));
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