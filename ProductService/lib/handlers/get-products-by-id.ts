import mockProducts from "../../mocks/mock-products"
import { FIXME } from "../../models";

export const handler = async (event: FIXME) => {
    
    const productId = event.pathParameters?.productId;
    const item = mockProducts.find(el => el.id === Number(productId));

    if (!item) {
        return {
            statusCode: 404,
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                error: {
                    message: "Product not found"
                }              
            }),
        }
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(item)
    }
};