# Product Service created with AWS CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Populate DB with data

To populate DynamoDB tables run the following scripts. If tables don't exist yet, they will be created.

- for production (remote DynamoDB):

```bash
npm run prod:db:populate
```

<!--
- for local development (running DynamoDB locally on `http://localhost:8000`):

```bash
npm run loc:db:populate http://localhost:8000
``` -->

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
