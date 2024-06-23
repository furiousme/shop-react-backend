import { PRODUCTS_TABLE_NAME, STOCKS_BY_PRODUCT_INDEX_NAME, STOCKS_TABLE_NAME } from './../constants';
import {CfnOutput, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime} from 'aws-cdk-lib/aws-lambda'
import { join } from 'node:path';

import {HttpApi, HttpStage, HttpMethod, CorsHttpMethod} from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';


const tablesList = [PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME];

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tableNamePairs: Record<string, TableV2> = tablesList.reduce((acc, item) => {
      const table = new TableV2(this, item, {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING,
        },
        removalPolicy: RemovalPolicy.DESTROY
      });

      if (item === STOCKS_TABLE_NAME) {
        table.addGlobalSecondaryIndex({
          indexName: STOCKS_BY_PRODUCT_INDEX_NAME,
          partitionKey: {
            name: 'product_id',
            type: AttributeType.STRING
          },
        })
      }

      new CfnOutput(this, `${item}Output`, {
        value: table.tableName
      });

      return {...acc, [item]: table}
    }, {} as Record<string, TableV2>)

    const tableNamesAsEnvs = {
      "PRODUCTS_TABLE_NAME": tableNamePairs[PRODUCTS_TABLE_NAME].tableName,
      "STOCKS_TABLE_NAME": tableNamePairs[STOCKS_TABLE_NAME].tableName,
    }

    const getProductsList = new NodejsFunction(this, "getProductsListHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/get-products-list/get-products-list.ts"),
      environment: tableNamesAsEnvs,
    });

    const createProduct = new NodejsFunction(this, "createProductHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/create-product/create-product.ts"),
      environment: tableNamesAsEnvs,
    });

    const getProductsById = new NodejsFunction(this, "getProductsByIdHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/get-products-by-id/get-products-by-id.ts"),
      environment: tableNamesAsEnvs,
    });

    Object.values(tableNamePairs).forEach(table => {
      table.grantReadData(getProductsList);
      table.grantReadData(getProductsById);
      table.grantReadWriteData(createProduct);
    })

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
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'X-Amz-Security-Token', 'Authorization', 'X-Api-Key', 'X-Requested-With', 'Accept', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers'],
        allowOrigins: ["*"],
    }});

    new HttpStage(this, 'Stage', {
      httpApi,
      stageName: 'dev',
      autoDeploy: true
    });

    httpApi.addRoutes({
      path: '/products',
      methods: [ HttpMethod.GET ],
      integration: new HttpLambdaIntegration('GetProductsListIntegration', getProductsList),
    });

    httpApi.addRoutes({
      path: '/products',
      methods: [ HttpMethod.POST ],
      integration: new HttpLambdaIntegration('CreateProductIntegration', createProduct),
    });

    httpApi.addRoutes({
      path: '/products/{productId}',
      methods: [ HttpMethod.GET ],
      integration: new HttpLambdaIntegration('GetProductsByIdIntegration', getProductsById),
    });

    new CfnOutput(this, "HttpApiUrl", {
      value: httpApi.url || "",
    });
  }
}
