import { unmarshall } from "@aws-sdk/util-dynamodb";

import { AttributeValue } from "@aws-sdk/client-dynamodb";

export const unmarshallItems = <T>(items: AttributeValue[] | Record<string, AttributeValue>[]): T[] =>  {
    return items.map(item =>  unmarshall(item)) as T[];
}

