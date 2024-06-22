import mockProducts from "../mocks/mock-products";
import mockStocks from '../mocks/mock-stocks';
import { DynamoDBClient, ListTablesCommand, CreateTableCommand} from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME} from "../constants"
import { mapProductsToPutRequests, mapStocksToPutRequests } from "../utils/mappers";

import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation" // ES Modules import
import { productsTableInput, stocksTableInput } from "../mocks/db-inputs";

type ErrorWithMessage = {
  message: string;
  name?: string;
}

const isProd = process.env.NODE_ENV === "PRODUCTION";

const dbClientParams = isProd ? {} : {
    endpoint: 'http://localhost:8000'
}

const dbClient = new DynamoDBClient(dbClientParams);
const docClient = DynamoDBDocumentClient.from(dbClient);
const cfClient = new CloudFormationClient();

const fillTables = async (productsTableName: string, stocksTableName: string) => {
  const productsRequests = mapProductsToPutRequests(mockProducts);
  const stocksRequests = mapStocksToPutRequests(mockStocks);

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
}

const populateDynamoDBProd = async () => {
  let outputs;
  let productsTableName: string | undefined;
  let stocksTableName: string | undefined;

  try {
    const describeStacksResponse = await cfClient.send(new DescribeStacksCommand({ 
      StackName: "ProductServiceStack",
    }));
  
    outputs = describeStacksResponse.Stacks?.[0].Outputs;

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

  fillTables(productsTableName, stocksTableName);
};

const populateDynamoDBLocally = async () => {
    const existingTablesResponse = await docClient.send(new ListTablesCommand());
    const existingTables = existingTablesResponse.TableNames;

    const productsTableMissing = !existingTables?.includes(PRODUCTS_TABLE_NAME);
    const stocksTableMissing = !existingTables?.includes(STOCKS_TABLE_NAME);

    if (productsTableMissing) {
        console.log(`>>> No ${PRODUCTS_TABLE_NAME} found. Going to create it...\n`);
        const command = new CreateTableCommand(productsTableInput);

        await dbClient.send(command);
        console.log(`>>> ${PRODUCTS_TABLE_NAME} was created \n`);
    }

    if (stocksTableMissing) {
        console.log(`>>> No ${STOCKS_TABLE_NAME} found. Going to create it...\n`);
        const command = new CreateTableCommand(stocksTableInput);

        await dbClient.send(command);
        console.log(`>>> ${STOCKS_TABLE_NAME} was created \n`);
    }

    fillTables(PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME);
}

const populateDB = () => {
  console.log(`>>> Current environment is: ${process.env.NODE_ENV} \n `);

  if (isProd) {
    populateDynamoDBProd();
  } else {
    populateDynamoDBLocally();
  }
}

populateDB();