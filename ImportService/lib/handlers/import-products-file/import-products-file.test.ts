import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {handler}  from "./import-products-file";
import { mockClient } from "aws-sdk-client-mock";
import { APIGatewayEvent } from "aws-lambda";

jest.mock("@aws-sdk/s3-request-presigner", () => {
    return {
      ...jest.requireActual("@aws-sdk/s3-request-presigner"),
      getSignedUrl: jest.fn().mockImplementation(() => mockSignedUrl)
    };
});

const mockS3Client = mockClient(S3Client);
const mockSignedUrl = "mock-signed-url";

describe("importFileParser lambda", () => {
    beforeAll(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    })

    beforeEach(() => {
        mockS3Client.reset();
    })
    
    afterAll(() => {
      jest.restoreAllMocks();
    })

    it("should successfully return signed url", async () => {  
        mockS3Client.on(PutObjectCommand).resolves({});

        const mockEvent = {
            queryStringParameters: {
              name: "file-with-data.csv",
            },
          };

          const result = await handler(mockEvent as unknown as APIGatewayEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).url).toBe(mockSignedUrl);  
    });

    it("should return error if file name was not provided", async () => {  
        const mockEvent = {
            queryStringParameters: {},
          };

        const result = await handler(mockEvent as unknown as APIGatewayEvent);

        console.log(result)

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error?.message).toBeDefined();  
    });
  })