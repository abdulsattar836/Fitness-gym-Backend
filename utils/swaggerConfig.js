const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  explorer: false,
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce",
      version: "1.0.0",
      description: "API documentation for ecommerce",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./Route/*.js"], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
