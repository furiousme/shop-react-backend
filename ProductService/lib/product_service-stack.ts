import {CfnOutput, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime} from 'aws-cdk-lib/aws-lambda'
import { join } from 'node:path';

import {HttpApi, HttpStage, HttpMethod, CorsHttpMethod} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../constants';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';


export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const getProductsList = new NodejsFunction(this, "getProductsListHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/get-products-list/get-products-list.ts"),
    });

    const getProductsById = new NodejsFunction(this, "getProductsByIdHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/get-products-by-id/get-products-by-id.ts"),
    });

    const httpApi = new HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      }});

    new HttpStage(this, 'Stage', {
      httpApi,
      stageName: 'dev',
      autoDeploy: true
    });

    const getProductsListIntegration = new HttpLambdaIntegration('GetProductsListIntegration', getProductsList);
    const getProductsByIdIntegration = new HttpLambdaIntegration('GetProductsByIdIntegration', getProductsById);

    httpApi.addRoutes({
      path: '/products',
      methods: [ HttpMethod.GET ],
      integration: getProductsListIntegration,
    });

    httpApi.addRoutes({
      path: '/products/{productId}',
      methods: [ HttpMethod.GET ],
      integration: getProductsByIdIntegration,
    });

    const tables = [PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME];

    tables.forEach((item) => {
      const table = new Table(this, item, {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING,
          
        },
        removalPolicy: RemovalPolicy.DESTROY
      });

      table.grantReadData(getProductsList);
      table.grantReadData(getProductsById);

      new CfnOutput(this, `${item}--Output`, {
        value: table.tableName
      });
    })

    new CfnOutput(this, "HttpApiUrl", {
      value: httpApi.url || "",
    });
  }
}
