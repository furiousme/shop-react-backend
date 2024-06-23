import { Product, ProductWithStock, Stock } from "../models"

export const prepareProductsWithStock = (products: Product[], stocks: Stock[]): ProductWithStock[] => {
    return products.reduce((acc, product) => {
        const count = stocks.find(el => el.product_id === product.id)?.count;
        if (count !== undefined) {
            acc.push({ ...product, count })
        }

        return acc;
    }, [] as ProductWithStock[])
}