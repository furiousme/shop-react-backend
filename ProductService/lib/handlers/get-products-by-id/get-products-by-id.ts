import mockProducts from "../../../mocks/mock-products"
import { FIXME } from "../../../models";

export const defaultHeaders = {
    headers: { "Content-Type": "application/json" },
}

export const handler = async (event: FIXME) => {
    const productId = Number(event.pathParameters?.productId);

    if (isNaN(productId)) {
        return {
            statusCode: 400,
            headers: defaultHeaders,
            body: JSON.stringify({
                error: {
                    message: "Invalid product id"
                } 
            })
        }
    }

    const item = mockProducts.find(el => el.id === Number(productId));

    if (!item) {
        return {
            statusCode: 404,
            headers: defaultHeaders,
            body: JSON.stringify({
                error: {
                    message: "Product not found"
                }              
            }),
        }
    }

    return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(item)
    }
};