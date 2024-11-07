import { ConfigProps } from './../../config';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'node:path';

type ProductServiceStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class AuthorizationServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ProductServiceStackProps) {
    super(scope, id, props);

    const basicAuthorizerLambda = new NodejsFunction(this, 'basicAuthorizerHandler', {
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname + "/handlers/basic-authorizer/basic-authorizer.ts"),
      environment: {
        FURIOUSME: props.config.FURIOUSME
      },
    });

    new CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: basicAuthorizerLambda.functionArn,
      exportName: "BasicAuthorizerLambdaArn"
    });
  }
}
