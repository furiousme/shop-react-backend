import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime} from 'aws-cdk-lib/aws-lambda'
import { join } from 'node:path';

import {HttpApi, HttpStage, HttpMethod, CorsHttpMethod} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';


export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new NodejsFunction(this, "getProductsListHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/get-products-list.ts"),
    });

    const getProductsById = new NodejsFunction(this, "getProductsByIdHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/get-products-by-id.ts"),
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
  }
}
