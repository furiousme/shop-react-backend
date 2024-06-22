import { KeyType, ProjectionType, ScalarAttributeType, TableClass } from "@aws-sdk/client-dynamodb";
import { PRODUCTS_TABLE_NAME, STOCKS_BY_PRODUCT_INDEX_NAME, STOCKS_TABLE_NAME } from "../constants";

export const productsTableInput = { 
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
  
export const stocksTableInput = { 
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
      GlobalSecondaryIndexes: [ 
        {
          IndexName: STOCKS_BY_PRODUCT_INDEX_NAME, 
          KeySchema: [ 
            {
              AttributeName: "product_id", 
              KeyType: KeyType.HASH, 
            },
          ],
          ProvisionedThroughput: { 
            ReadCapacityUnits: 5, 
            WriteCapacityUnits: 5, 
          },
          Projection: { 
            ProjectionType: ProjectionType.ALL,
          },
        },
      ],
      TableClass: TableClass.STANDARD,
  };
  