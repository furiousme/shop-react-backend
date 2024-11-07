import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { handler } from './catalog-batch-process';
import { SQSEvent } from "aws-lambda";

const dynamoDbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

const mockEvent = {
    Records: [
      {
        messageId: "1",
        body: JSON.stringify({
          title: "Test product title",
          description: "Test product description",
          price: 10,
          count: 15,
        }),
      },
    ],
  };

describe('catalogBatchProcess lambda', () => {
    const ORIG_ENV = process.env;

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    }) 

  beforeEach(() => {
    process.env.PRODUCTS_TABLE_NAME = 'ProductsTable';
    process.env.STOCKS_TABLE_NAME = 'StocksTable';
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:region:account-id:topic-name';
    dynamoDbMock.reset();
    snsMock.reset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
    process.env = ORIG_ENV
  })

  it('should process SQS event successfully', async () => {
    dynamoDbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const response = await handler(mockEvent as SQSEvent);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).batchItemFailures).toHaveLength(0);
  });

  it('should handle db error', async () => {
    dynamoDbMock.on(TransactWriteCommand).rejects(new Error());

    const response = await handler(mockEvent as SQSEvent);
    const batchItemFailures = JSON.parse(response.body).batchItemFailures;

    expect(response.statusCode).toBe(200);
    expect(batchItemFailures).toHaveLength(1);
    expect(batchItemFailures[0].itemIdentifier).toBe(mockEvent.Records[0].messageId);
  });

  it('should return error if environment variables are missing', async () => {
    delete process.env.PRODUCTS_TABLE_NAME;
    delete process.env.STOCKS_TABLE_NAME;

    const response = await handler(mockEvent as SQSEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).success).toBe(false);
    expect(JSON.parse(response.body).body).toBe("Internal server error");
  });
});
