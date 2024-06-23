export const ProductSchema = {
    type: "object",
    properties: {
        title: {type: "string"},
        description: {type: "string"},
        count: {type: "integer"},
        price: {type: "number", "minimum": 0.01}
    },
    required: ["title", "description", "count", "price"],
}