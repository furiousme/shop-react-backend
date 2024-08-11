export const SUPPORTED_PATHS = {
    CART: 'cart',
    PRODUCT: 'product'
} as const;

export const urlMap = {
    [SUPPORTED_PATHS.CART]: "CART_SERVICE_URL",
    [SUPPORTED_PATHS.PRODUCT]: "PRODUCT_SERVICE_URL"
}
