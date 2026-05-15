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
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                        firstname: {
                            type: "string",
                        },
                        lastname: {
                            type: "string",
                        },
                        username: {
                            type: "string",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(option);