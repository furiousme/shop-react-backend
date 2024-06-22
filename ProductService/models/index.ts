import { ScanCommandOutput } from "@aws-sdk/lib-dynamodb";

export type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
}

export type Stock = {
    id: string;
    product_id: string;
    count: number;
}

export type ProductWithStock = Product & Pick<Stock, 'count'>;

export type TypedScanCommandOutput<T> = Omit<ScanCommandOutput, "Items"> & {
    Items?: T,
};
export type FIXME = any;