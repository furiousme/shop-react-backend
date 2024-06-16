import mockProducts from "../../../mocks/mock-products";

export const defaultHeaders = {
  headers: { "Content-Type": "application/json" },
}
export const handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(mockProducts)
  }
};