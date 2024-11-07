import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { createReadStream } from 'node:fs';
import {sdkStreamMixin} from '@smithy/util-stream';

import {handler} from "./import-file-parser";
import { GetQueueUrlCommand, SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';

const mockS3Client = mockClient(S3Client);
const mockSQSClient = mockClient(SQSClient);

const mockEvent = {
  Records: [
    {
      s3: {
        bucket: {
          name: 'source-bucket',
        },
        object: {
          key: 'uploaded/test-data.csv',
        },
      },
    },
  ],
};

describe('importFileParser lambda', () => {
  const ORIG_ENV = process.env;

  beforeAll(() => {
    process.env.DESTINATION_BUCKET_NAME = 'destination-bucket';
    process.env.SQS_QUEUE_NAME = 'sqs queue name';
  });

  beforeEach(() => {
      mockS3Client.reset();
  })
  
  afterAll(() => {
    jest.restoreAllMocks();
    process.env = ORIG_ENV
  })

  it('should correctly process the S3 event and return success', async () => {
      const stream = sdkStreamMixin(createReadStream('./test/test-data.csv'))
      mockS3Client.on(GetObjectCommand).resolves({Body: stream});
      mockS3Client.on(PutObjectCommand).resolves({});
      mockS3Client.on(DeleteObjectCommand).resolves({});
      mockSQSClient.on(GetQueueUrlCommand).resolves({});
      mockSQSClient.on(SendMessageBatchCommand).resolves({});

      jest.spyOn(console, "log").mockImplementation();
      const response = await handler(mockEvent);    
  
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).success).toBe(true);
  });

  it('should handle errors and return failure', async () => {
    mockS3Client.onAnyCommand().rejectsOnce();

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).success).toBe(false);
  });
    
})