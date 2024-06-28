import { APIGatewayEvent } from 'aws-lambda';
import { getSignedUrl} from "@aws-sdk/s3-request-presigner";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const defaultHeaders = {
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT",
    "X-Requested-With": "*"
}

const client = new S3Client();

export const handler = async (event: APIGatewayEvent) => {
    console.log("EVENT:", event);

    const key = event.queryStringParameters?.name;

    if (!key) {
        return {
            statusCode: 400,
            headers: defaultHeaders,
            body: JSON.stringify({
                success: false,
                message: "File name should be provided as a query parameter"
            })
        }
    }

    try {
        const command = new PutObjectCommand({ Bucket: process.env.UPLOAD_BUCKET_NAME, Key: `uploaded/${key}` });
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        
        console.log("URL:", url);
    
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({
                success: true,
                url
            })
        }
    } catch (e) {
        return {
            statusCode: 500,
            headers: defaultHeaders,
            body: JSON.stringify({
                success: false,
                error: { message: "Internal server"}
            })
        }
    }
};