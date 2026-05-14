import swaggerJsdoc from "swagger-jsdoc";

const option= {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "fluxChat API",
            version:"1.0.0",
            description:"API documentation for backend",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(option);