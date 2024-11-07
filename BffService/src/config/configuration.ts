export default () => ({
    PORT: parseInt(process.env.PORT, 10) || 3001,
    API: {
        IMPORT_SERVICE_URL: process.env.IMPORT_SERVICE_URL || '',
        PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || '',
        CART_SERVICE_URL: process.env.CART_SERVICE_URL || ''
    }
  });