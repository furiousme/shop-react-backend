import { Effect } from 'aws-cdk-lib/aws-iam';
import { FIXME } from '../../../../ProductService/models/index';
import { APIGatewayAuthorizerResult } from 'aws-lambda/trigger/api-gateway-authorizer';

export const handler = async function (event: FIXME, ctx: FIXME, cb: FIXME): Promise<APIGatewayAuthorizerResult> {
  console.log(`event => ${JSON.stringify(event)}`);

  const authToken = event.authorizationToken || '';
  
  console.log("TOKEN:", authToken);

  if (!authToken) {
    cb("Unauthorized");
  }

  try {
    let effect = Effect.DENY;

    const encodedToken = authToken.split(" ")[1];
    const buff = Buffer.from(encodedToken, 'base64');
    const [login, password] = buff.toString('utf-8').split(":");

    console.log("Decoded creds", login, password);
    console.log("Value from envs", process.env[login]);

    if (process.env[login] && process.env[login] === password) {
      effect = Effect.ALLOW
    }

    const policyDocument = createPolicyDocument(effect, event.methodArn);

    const response: APIGatewayAuthorizerResult = {
      principalId: login,
      policyDocument,
    };

    console.log(`response => ${JSON.stringify(response)}`);

    return response;
  } catch (err) {
    console.error('Invalid auth token. err => ', err);
    throw new Error('Unauthorized');
  }
};  

const createPolicyDocument = (effect: Effect, methodArn: string) => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect, 
        Resource: methodArn,
      },
    ],
  };
}