export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SkillBridge Attendance API",
    version: "1.0.0",
    description:
      "REST API for SkillBridge attendance management. The API uses Clerk bearer tokens for authentication and database-backed roles for authorization.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    { name: "Auth", description: "Current user profile and onboarding sync" },
    { name: "Batches", description: "Batch creation, membership, invites, and summaries" },
    { name: "Sessions", description: "Training sessions and attendance views" },
    { name: "Attendance", description: "Student attendance marking" },
    { name: "Institutions", description: "Institution lists, trainers, and summaries" },
    { name: "Programme", description: "Programme-wide reporting" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Clerk session JWT",
      },
    },
    schemas: {
      Role: {
        type: "string",
        enum: ["STUDENT", "TRAINER", "INSTITUTION", "PROGRAMME_MANAGER", "MONITORING_OFFICER"],
      },
      AttendanceStatus: {
        type: "string",
        enum: ["PRESENT", "ABSENT", "LATE"],
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { nullable: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: { type: "object" },
        },
      },
      Institution: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx_inst_123" },
          name: { type: "string", example: "SkillBridge Demo Institution" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AppUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          clerkUserId: { type: "string" },
          name: { type: "string", example: "Demo Trainer" },
          email: { type: "string", format: "email", example: "trainer@test.com" },
          role: { $ref: "#/components/schemas/Role" },
          institutionId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          institution: {
            allOf: [{ $ref: "#/components/schemas/Institution" }],
            nullable: true,
          },
        },
      },
      SyncUserRequest: {
        type: "object",
        required: ["name", "email", "role"],
        properties: {
          name: { type: "string", minLength: 2, example: "Demo Trainer" },
          email: { type: "string", format: "email", example: "trainer@test.com" },
          role: { $ref: "#/components/schemas/Role" },
          institutionName: { type: "string", example: "SkillBridge Demo Institution" },
        },
      },
      Batch: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Web Development Batch A" },
          institutionId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          institution: { $ref: "#/components/schemas/Institution" },
          trainers: {
            type: "array",
            items: { type: "object" },
          },
          students: {
            type: "array",
            items: { type: "object" },
          },
          sessions: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
      CreateBatchRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 2, example: "Web Development Batch A" },
          institutionId: {
            type: "string",
            description: "Optional institution override accepted by the current MVP backend.",
          },
        },
      },
      CreateInviteRequest: {
        type: "object",
        properties: {
          expiresAt: {
            type: "string",
            format: "date-time",
            example: "2026-06-01T00:00:00.000Z",
          },
        },
      },
      Invite: {
        type: "object",
        properties: {
          id: { type: "string" },
          batchId: { type: "string" },
          token: { type: "string", example: "invite_token_value" },
          createdBy: { type: "string" },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          invitePath: {
            type: "string",
            example: "/join-batch?token=invite_token_value&batchId=batch_id",
          },
        },
      },
      JoinBatchRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", minLength: 8, example: "invite_token_value" },
        },
      },
      Session: {
        type: "object",
        properties: {
          id: { type: "string" },
          batchId: { type: "string" },
          trainerId: { type: "string" },
          title: { type: "string", example: "HTML and CSS Basics" },
          date: { type: "string", format: "date-time" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          batch: { $ref: "#/components/schemas/Batch" },
          trainer: { $ref: "#/components/schemas/AppUser" },
          attendance: {
            type: "array",
            items: { $ref: "#/components/schemas/Attendance" },
          },
        },
      },
      CreateSessionRequest: {
        type: "object",
        required: ["batchId", "title", "date", "startTime", "endTime"],
        properties: {
          batchId: { type: "string", example: "batch_id" },
          title: { type: "string", minLength: 2, example: "HTML and CSS Basics" },
          date: { type: "string", format: "date-time", example: "2026-05-07T10:00:00.000Z" },
          startTime: { type: "string", format: "date-time", example: "2026-05-07T10:00:00.000Z" },
          endTime: { type: "string", format: "date-time", example: "2026-05-07T11:30:00.000Z" },
        },
      },
      Attendance: {
        type: "object",
        properties: {
          id: { type: "string" },
          sessionId: { type: "string" },
          studentId: { type: "string" },
          status: { $ref: "#/components/schemas/AttendanceStatus" },
          markedAt: { type: "string", format: "date-time" },
          student: { $ref: "#/components/schemas/AppUser" },
        },
      },
      MarkAttendanceRequest: {
        type: "object",
        required: ["sessionId", "status"],
        properties: {
          sessionId: { type: "string", example: "session_id" },
          status: { $ref: "#/components/schemas/AttendanceStatus" },
        },
      },
      BatchSummary: {
        type: "object",
        properties: {
          batchId: { type: "string" },
          batchName: { type: "string" },
          institutionName: { type: "string" },
          totalStudents: { type: "integer", example: 30 },
          totalSessions: { type: "integer", example: 8 },
          totalMarks: { type: "integer", example: 120 },
          present: { type: "integer", example: 100 },
          late: { type: "integer", example: 12 },
          absent: { type: "integer", example: 8 },
          attendanceRate: { type: "number", example: 93.33 },
        },
      },
      InstitutionSummary: {
        type: "object",
        properties: {
          institutionId: { type: "string" },
          institutionName: { type: "string" },
          totalBatches: { type: "integer" },
          students: { type: "integer" },
          sessions: { type: "integer" },
          marks: { type: "integer" },
          present: { type: "integer" },
          late: { type: "integer" },
          absent: { type: "integer" },
          attendanceRate: { type: "number" },
          batches: {
            type: "array",
            items: { $ref: "#/components/schemas/BatchSummary" },
          },
        },
      },
      ProgrammeSummary: {
        type: "object",
        properties: {
          totalInstitutions: { type: "integer" },
          batches: { type: "integer" },
          students: { type: "integer" },
          sessions: { type: "integer" },
          marks: { type: "integer" },
          present: { type: "integer" },
          late: { type: "integer" },
          absent: { type: "integer" },
          attendanceRate: { type: "number" },
          institutions: {
            type: "array",
            items: { $ref: "#/components/schemas/InstitutionSummary" },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Validation or business-rule failure",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Missing or invalid authentication",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description: "Authenticated user does not have the required role",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        security: [],
        responses: {
          "200": {
            description: "API is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "SkillBridge API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current app user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user profile, or null when onboarding is incomplete",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      oneOf: [{ $ref: "#/components/schemas/AppUser" }, { type: "null" }],
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/sync": {
      post: {
        tags: ["Auth"],
        summary: "Create or update current app user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SyncUserRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Synced user profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/AppUser" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/batches": {
      post: {
        tags: ["Batches"],
        summary: "Create a batch",
        description: "Allowed roles: TRAINER, INSTITUTION.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBatchRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created batch",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Batch" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/batches/my": {
      get: {
        tags: ["Batches"],
        summary: "List current trainer or institution batches",
        description: "Allowed roles: TRAINER, INSTITUTION.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Batches for the current profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Batch" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/batches/student": {
      get: {
        tags: ["Batches"],
        summary: "List batches joined by the current student",
        description: "Allowed role: STUDENT.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Joined student batches",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Batch" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/batches/{id}/invite": {
      post: {
        tags: ["Batches"],
        summary: "Create invite link for a trainer-owned batch",
        description: "Allowed role: TRAINER.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateInviteRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created invite",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Invite" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/batches/{id}/join": {
      post: {
        tags: ["Batches"],
        summary: "Join a batch using invite token",
        description: "Allowed role: STUDENT.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/JoinBatchRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Batch membership",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/batches/{id}/summary": {
      get: {
        tags: ["Batches"],
        summary: "Get batch attendance summary",
        description: "Allowed role: INSTITUTION.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Batch summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/BatchSummary" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/sessions": {
      post: {
        tags: ["Sessions"],
        summary: "Create a session",
        description: "Allowed role: TRAINER.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSessionRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Session" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/sessions/my": {
      get: {
        tags: ["Sessions"],
        summary: "List sessions created by current trainer",
        description: "Allowed role: TRAINER.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Trainer sessions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Session" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/sessions/student-active": {
      get: {
        tags: ["Sessions"],
        summary: "List active sessions for current student",
        description: "Allowed role: STUDENT. Returns enrolled sessions whose end time has not passed.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Active student sessions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Session" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/sessions/{id}/attendance": {
      get: {
        tags: ["Sessions"],
        summary: "Get attendance for a trainer-owned session",
        description: "Allowed role: TRAINER.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Session with students and attendance",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Session" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/attendance/mark": {
      post: {
        tags: ["Attendance"],
        summary: "Mark attendance",
        description: "Allowed role: STUDENT.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MarkAttendanceRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created attendance mark",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Attendance" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": {
            description: "Attendance already marked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/institutions": {
      get: {
        tags: ["Institutions"],
        summary: "List institutions",
        description: "Allowed role: PROGRAMME_MANAGER.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Institutions with counts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        allOf: [
                          { $ref: "#/components/schemas/Institution" },
                          {
                            type: "object",
                            properties: {
                              _count: {
                                type: "object",
                                properties: {
                                  batches: { type: "integer" },
                                  users: { type: "integer" },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/institutions/my/trainers": {
      get: {
        tags: ["Institutions"],
        summary: "List trainers for current institution",
        description: "Allowed role: INSTITUTION.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Institution trainers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AppUser" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/institutions/{id}/summary": {
      get: {
        tags: ["Institutions"],
        summary: "Get institution summary",
        description: "Allowed role: PROGRAMME_MANAGER.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Institution summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/InstitutionSummary" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/programme/summary": {
      get: {
        tags: ["Programme"],
        summary: "Get programme-wide summary",
        description: "Allowed roles: PROGRAMME_MANAGER, MONITORING_OFFICER.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Programme summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/ProgrammeSummary" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
} as const;
