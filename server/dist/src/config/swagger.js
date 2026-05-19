import swaggerJsdoc from "swagger-jsdoc";
const option = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "fluxChat API",
            version: "1.0.0",
            description: "API documentation for backend",
        },
        servers: [
            {
                url: process.env.BASE_URL || "http://localhost:3000",
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
                Conversation: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                        isGlobal: {
                            type: "boolean",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        participants: {
                            type: "array",
                            items: {
                                $ref: '#/components/schemas/ConversationParticipant',
                            },
                        },
                    },
                },
                ConversationParticipant: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                        userId: {
                            type: "string",
                        },
                        conversationId: {
                            type: "string",
                        },
                        joinedAt: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
                Message: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                        content: {
                            type: "string",
                        },
                        senderId: {
                            type: "string",
                        },
                        conversationId: {
                            type: "string",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                        },
                        sender: {
                            $ref: '#/components/schemas/User',
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"],
};
export const specs = swaggerJsdoc(option);
