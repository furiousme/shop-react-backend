import { Product, Stock } from "../models";

export const mapProductsToPutRequests = (products: Product[]) => {
    return products.map(
        (product) => ({
          PutRequest: {
            Item: {
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
            },
          },
        })
      );
}

export const mapStocksToPutRequests = (stocks: Stock[]) => {
    return stocks.map(
        (stock) => ({
          PutRequest: {
            Item: {
              id: stock.id,
              product_id: stock.product_id,
              count: stock.count,
            },
          },
        })
      );
}