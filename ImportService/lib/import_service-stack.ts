import { SQS_QUEUE_NAME } from './../../ProductService/constants';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';

import {Bucket, BlockPublicAccess, HttpMethods, EventType} from "aws-cdk-lib/aws-s3"
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'node:path';
import { Deployment, LambdaIntegration, LambdaRestApi, Stage } from 'aws-cdk-lib/aws-apigateway';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'ImportProductsFileBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [{
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        maxAge: 3600,
        allowedMethods: [HttpMethods.PUT, HttpMethods.POST]
      }]
    });

    const destinationBucket = new Bucket(this, 'ProductsFilesDestinationBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });


    const importProductsFile = new NodejsFunction(this, "importProductsFileHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/import-products-file/import-products-file.ts"),
      environment: {
        UPLOAD_BUCKET_NAME: bucket.bucketName
      }
    });

    const importFileParser = new NodejsFunction(this, "importFileParserHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/import-file-parser/import-file-parser.ts"),
      environment: {
        DESTINATION_BUCKET_NAME: destinationBucket.bucketName,
        SQS_QUEUE_NAME: SQS_QUEUE_NAME
      }
    });

    importFileParser.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'sqs:SendMessage',
          'sqs:GetQueueAttributes'
        ],
        resources: ['*'],
      })
    );

    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);
    destinationBucket.grantWrite(importFileParser);

    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(importFileParser), {
      prefix: 'uploaded/'
    });

    const restApi = new LambdaRestApi(this, 'ImportServiceRestApi', {
        handler: importProductsFile,
        proxy: false,
      defaultCorsPreflightOptions: {
        allowMethods: [CorsHttpMethod.GET],
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'X-Amz-Security-Token', 'Authorization', 'X-Api-Key', 'X-Requested-With', 'Accept', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers'],
        allowOrigins: ["*"],
    }
  });

  const apiDeployment = new Deployment(this, 'ImportServiceApiDeployment', {api: restApi});

  new Stage(this, 'importServiceDevStage', {deployment: apiDeployment, stageName: "dev"});

  const importResource = restApi.root.addResource('import');
  const importsIntegration = new LambdaIntegration(importProductsFile)

  importResource.addMethod("GET", importsIntegration,
      {
        requestParameters:  {
          "method.request.querystring.name": true
        }
      }
    );

    new CfnOutput(this, "ImportApiUrl", {
      value: restApi.url || "",
    });
  }
}
