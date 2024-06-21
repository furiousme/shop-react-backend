import mockProducts from "../mocks/mock-products";
import mockStocks from '../mocks/mock-stocks';
import { DynamoDBClient, ListTablesCommand, CreateTableCommand, ScalarAttributeType, KeyType, TableClass } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME} from "../constants"
import { mapProductsToPutRequests, mapStocksToPutRequests } from "../utils/mappers";

import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation" // ES Modules import

type ErrorWithMessage = {
  message: string;
  name?: string;
}

const dbClientParams = process.env.NODE_ENV === "PRODUCTION" ? {} : {
    endpoint: 'http://localhost:8000'
}

console.log(`>>> Current environment is: ${process.env.NODE_ENV} \n `);

const client = new DynamoDBClient(dbClientParams);
const docClient = DynamoDBDocumentClient.from(client);

const cfClient = new CloudFormationClient();


const productsTableInput = { 
  AttributeDefinitions: [ 
    {
      AttributeName: "id", 
      AttributeType: ScalarAttributeType.S,
    },
    {
        AttributeName: "title", 
        AttributeType: ScalarAttributeType.S,
    },   
  ],
  TableName: PRODUCTS_TABLE_NAME, 
  KeySchema: [ 
    {
      AttributeName: "id", 
      KeyType: KeyType.HASH,
    },
    {
      AttributeName: "title", 
      KeyType: KeyType.RANGE,
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5, 
  },
  TableClass: TableClass.STANDARD,
};

const stocksTableInput = { 
    AttributeDefinitions: [ 
      {
        AttributeName: "id", 
        AttributeType: ScalarAttributeType.S,
      },
      {
          AttributeName: "product_id", 
          AttributeType: ScalarAttributeType.S,
      },
    ],
    TableName: STOCKS_TABLE_NAME, 
    KeySchema: [ 
      {
        AttributeName: "id", 
        KeyType: KeyType.HASH,
      },
      {
        AttributeName: "product_id", 
        KeyType: KeyType.RANGE,
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5, 
    },
    TableClass: TableClass.STANDARD,
};

const populateDynamoDB = async () => {

  let outputs;
  let productsTableName: string | undefined;
  let stocksTableName: string | undefined;

  try {
    const describeStacksResponse = await cfClient.send(new DescribeStacksCommand({ 
      StackName: "ProductServiceStack",
    }));
  
    outputs = describeStacksResponse.Stacks?.[0].Outputs;

    console.log({outputs});
    console.log({describeStacksResponse});

    if (!outputs) throw new Error("No outputs");

    productsTableName = outputs.find((el) => el.OutputKey === `${PRODUCTS_TABLE_NAME}Output`)?.OutputValue;
    stocksTableName = outputs.find((el) => el.OutputKey === `${STOCKS_TABLE_NAME}Output`)?.OutputValue;

    if (!productsTableName || !stocksTableName) throw new Error("No tables");
  } catch (e) {
    if ((e as ErrorWithMessage).message === "No outputs" || ((e as ErrorWithMessage).name === "ValidationError")) {
      console.log(">>> No DynamoDB tables created! Please run 'cdk deploy' to create the stack first.\n");
    }

    if ((e as ErrorWithMessage).message === "No tables") {
      console.log(">>> No DynamoDB tables found! Please make sure the stack was properly created.\n");
    }
    process.exit(1);
  }

  console.log({outputs});

    // const existingTablesResponse = await docClient.send(new ListTablesCommand());
    // const existingTables = existingTablesResponse.TableNames;

    // const productsTableMissing = !existingTables?.includes(PRODUCTS_TABLE_NAME);
    // const stocksTableMissing = !existingTables?.includes(STOCKS_TABLE_NAME);

    // if (productsTableMissing) {
    //     console.log(`>>> No ${PRODUCTS_TABLE_NAME} found. Going to create it...\n`);
    //     const command = new CreateTableCommand(productsTableInput);

    //     await client.send(command);
    //     console.log(`>>> ${PRODUCTS_TABLE_NAME} was created \n`);
    // }

    // if (stocksTableMissing) {
    //     console.log(`>>> No ${STOCKS_TABLE_NAME} found. Going to create it...\n`);
    //     const command = new CreateTableCommand(stocksTableInput);

    //     await client.send(command);
    //     console.log(`>>> ${STOCKS_TABLE_NAME} was created \n`);
    // }

    const productsRequests = mapProductsToPutRequests(mockProducts);
    const stocksRequests = mapStocksToPutRequests(mockStocks);

    // wait until tables are created
    // const timeout = productsTableMissing || stocksTableMissing ? 10000 : 0;

    // if (timeout) console.log(">>> Need to wait until tables get 'active' status ... \n")

    // setTimeout(async () => {
      try {
        const productsPromise = docClient.send(new BatchWriteCommand({
          RequestItems: {
              [productsTableName]: productsRequests,
          },
      }));
  
      const stocksPromise = docClient.send(new BatchWriteCommand({
          RequestItems: {
              [stocksTableName]: stocksRequests,
          },
      }));

      await Promise.all([productsPromise, stocksPromise]);
      console.log(">>> Done. DB was populated! \n");
      } catch (e) {
        console.log(">>> Something went wrong while populating DB. Data might be not saved.", JSON.stringify(e));
      }
    // }, timeout)

};

populateDynamoDB();