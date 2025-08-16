
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../shared/cors.ts"

// Serve OpenAPI specification
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Return the OpenAPI specification
    return new Response(JSON.stringify(generateOpenApiSpec(req.url)), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})

// Function to generate the OpenAPI specification
function generateOpenApiSpec(requestUrl: string) {
  // Get base URL from request URL for server configuration
  const url = new URL(requestUrl)
  const baseUrl = `${url.protocol}//${url.host}`
  
  return {
    openapi: "3.0.3",
    info: {
      title: "uppi.ai Platform API",
      description: "API documentation for the uppi.ai platform microservices",
      version: "1.0.0",
      contact: {
        name: "API Support",
        url: "https://uppi.ai/support",
        email: "support@uppi.ai"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: `${baseUrl}/functions/v1`,
        description: "Production API Server"
      },
      {
        url: "http://localhost:54321/functions/v1",
        description: "Local Development"
      }
    ],
    tags: [
      {
        name: "competitor-analysis",
        description: "Competitor analysis operations"
      },
      {
        name: "api-keys",
        description: "API key management operations"
      },
      {
        name: "microservices",
        description: "Microservices management operations"
      }
    ],
    paths: {
      "/analyze-competitor": {
        post: {
          tags: ["competitor-analysis"],
          summary: "Analyze a competitor",
          description: "Analyzes a competitor using AI providers",
          operationId: "analyzeCompetitor",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["competitor", "userId", "enabledApis"],
                  properties: {
                    competitor: {
                      type: "string",
                      description: "Name of the competitor to analyze"
                    },
                    userId: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the user requesting the analysis"
                    },
                    enabledApis: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["openai", "anthropic", "gemini", "perplexity"]
                      },
                      description: "List of enabled API providers"
                    },
                    mode: {
                      type: "string",
                      enum: ["full_analysis", "find_similar", "basic"],
                      description: "Analysis mode"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful analysis",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      data: {
                        $ref: "#/components/schemas/CompetitorAnalysis"
                      },
                      competitor_data: {
                        $ref: "#/components/schemas/CompetitorData"
                      },
                      cost: {
                        type: "number"
                      },
                      confidence_score: {
                        type: "number"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        }
      },
      "/validate-api-key": {
        post: {
          tags: ["api-keys"],
          summary: "Validate an API key",
          description: "Validates an API key for a specific provider",
          operationId: "validateApiKey",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["keyType"],
                  properties: {
                    keyType: {
                      type: "string",
                      enum: ["openai", "anthropic", "gemini", "perplexity"],
                      description: "Type of API key"
                    },
                    userId: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the user who owns the key"
                    },
                    apiKey: {
                      type: "string",
                      description: "API key to validate (if not provided, will use stored key)"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Validation result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      isValid: {
                        type: "boolean"
                      },
                      message: {
                        type: "string"
                      },
                      usage: {
                        type: "object",
                        properties: {
                          total: {
                            type: "number"
                          },
                          used: {
                            type: "number"
                          },
                          remaining: {
                            type: "number"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        }
      },
      "/microservices": {
        get: {
          tags: ["microservices"],
          summary: "Get all microservices",
          description: "Returns a list of registered microservices",
          operationId: "getMicroservices",
          responses: {
            "200": {
              description: "List of microservices",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Microservice"
                        }
                      }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        },
        post: {
          tags: ["microservices"],
          summary: "Register a microservice",
          description: "Registers a new microservice",
          operationId: "registerMicroservice",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MicroserviceRequest"
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Microservice registered",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      data: {
                        $ref: "#/components/schemas/Microservice"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        }
      },
      "/microservices/{id}": {
        get: {
          tags: ["microservices"],
          summary: "Get a microservice",
          description: "Returns a specific microservice by ID",
          operationId: "getMicroservice",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "string"
              },
              description: "Microservice ID"
            }
          ],
          responses: {
            "200": {
              description: "Microservice details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      data: {
                        $ref: "#/components/schemas/Microservice"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              description: "Microservice not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        },
        put: {
          tags: ["microservices"],
          summary: "Update a microservice",
          description: "Updates an existing microservice",
          operationId: "updateMicroservice",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "string"
              },
              description: "Microservice ID"
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MicroserviceRequest"
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Microservice updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      },
                      data: {
                        $ref: "#/components/schemas/Microservice"
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "404": {
              description: "Microservice not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        },
        delete: {
          tags: ["microservices"],
          summary: "Delete a microservice",
          description: "Deletes a microservice",
          operationId: "deleteMicroservice",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "string"
              },
              description: "Microservice ID"
            }
          ],
          responses: {
            "200": {
              description: "Microservice deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean"
                      }
                    }
                  }
                }
              }
            },
            "404": {
              description: "Microservice not found",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Error"
                  }
                }
              }
            }
          },
          security: [
            {
              "jwt": []
            }
          ]
        }
      }
    },
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              default: false
            },
            error: {
              type: "string"
            },
            details: {
              type: "object"
            }
          }
        },
        CompetitorData: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            name: {
              type: "string"
            },
            market_share: {
              type: "number"
            },
            strengths: {
              type: "array",
              items: {
                type: "string"
              }
            },
            weaknesses: {
              type: "array",
              items: {
                type: "string"
              }
            },
            company_overview: {
              type: "object"
            },
            market_position: {
              type: "object"
            },
            swot_analysis: {
              type: "object"
            },
            business_model: {
              type: "string"
            },
            industry_trends: {
              type: "array",
              items: {
                type: "object"
              }
            },
            market_trends: {
              type: "array",
              items: {
                type: "object"
              }
            },
            data_quality_score: {
              type: "number"
            }
          }
        },
        CompetitorAnalysis: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            user_id: {
              type: "string",
              format: "uuid"
            },
            competitor_name: {
              type: "string"
            },
            status: {
              type: "string",
              enum: ["pending", "analyzing", "completed", "failed"]
            },
            data: {
              $ref: "#/components/schemas/CompetitorData"
            },
            estimated_cost: {
              type: "number"
            },
            actual_cost: {
              type: "number"
            },
            created_at: {
              type: "string",
              format: "date-time"
            },
            updated_at: {
              type: "string",
              format: "date-time"
            },
            analysis_started_at: {
              type: "string",
              format: "date-time"
            },
            analysis_completed_at: {
              type: "string",
              format: "date-time"
            }
          }
        },
        Microservice: {
          type: "object",
          properties: {
            id: {
              type: "string"
            },
            name: {
              type: "string"
            },
            description: {
              type: "string"
            },
            version: {
              type: "string"
            },
            baseUrl: {
              type: "string",
              format: "uri"
            },
            isActive: {
              type: "boolean"
            },
            isExternal: {
              type: "boolean"
            },
            endpoints: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Endpoint"
              }
            },
            healthCheckPath: {
              type: "string"
            },
            documentation: {
              type: "object",
              properties: {
                swaggerUrl: {
                  type: "string",
                  format: "uri"
                },
                readmeUrl: {
                  type: "string",
                  format: "uri"
                }
              }
            }
          }
        },
        Endpoint: {
          type: "object",
          properties: {
            path: {
              type: "string"
            },
            method: {
              type: "string",
              enum: ["GET", "POST", "PUT", "DELETE", "PATCH"]
            },
            description: {
              type: "string"
            },
            requiresAuth: {
              type: "boolean"
            },
            isPublic: {
              type: "boolean"
            },
            parameters: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Parameter"
              }
            }
          }
        },
        Parameter: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            type: {
              type: "string",
              enum: ["string", "number", "boolean", "object", "array"]
            },
            required: {
              type: "boolean"
            },
            description: {
              type: "string"
            }
          }
        },
        MicroserviceRequest: {
          type: "object",
          required: ["name", "version", "baseUrl"],
          properties: {
            name: {
              type: "string"
            },
            description: {
              type: "string"
            },
            version: {
              type: "string"
            },
            baseUrl: {
              type: "string",
              format: "uri"
            },
            apiKey: {
              type: "string"
            },
            isExternal: {
              type: "boolean",
              default: true
            },
            endpoints: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Endpoint"
              }
            },
            healthCheckPath: {
              type: "string"
            },
            documentation: {
              type: "object",
              properties: {
                swaggerUrl: {
                  type: "string",
                  format: "uri"
                },
                readmeUrl: {
                  type: "string",
                  format: "uri"
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        jwt: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  }
}
