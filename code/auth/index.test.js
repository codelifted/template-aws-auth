const { CognitoJwtVerifier } = require("aws-jwt-verify")
const { handler } = require("./index")

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

// Mock Cognito
jest.mock("aws-jwt-verify", function() {
  return {
    CognitoJwtVerifier: {
      create: jest.fn().mockReturnValue({
        verify: jest.fn().mockImplementation(token => {
          if (token === VALID_TOKEN) {
            return Promise.resolve({ sub: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" })
          } else {
            return Promise.reject(new Error("Invalid token!"))
          }
        })
      })
    }
  }
})

// Sample Requests
const mockCreateAppRequest = {
  type: "REQUEST",
  methodArn: "arn:aws:execute-api:us-east-1:123456789012:s4x3opwd6i/test/POST/app",
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`
  },
  path: "/app",
  httpMethod: "POST"
}

const mockListAppsRequest = {
  type: "REQUEST",
  methodArn: "arn:aws:execute-api:us-east-1:123456789012:s4x3opwd6i/test/GET/app",
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`
  },
  path: "/app",
  httpMethod: "GET"
}

const mockCreateResourceRequest = {
  type: "REQUEST",
  methodArn: "arn:aws:execute-api:us-east-1:123456789012:s4x3opwd6i/test/POST/app/resource",
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`
  },
  path: "/app/resource",
  httpMethod: "POST",
  queryStringParameters: {
    app_id: "123e4567-e89b-12d3-a456-426655440000"
  }
}

const mockListResourcesRequest = {
  type: "REQUEST",
  methodArn: "arn:aws:execute-api:us-east-1:123456789012:s4x3opwd6i/test/GET/app/resource",
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`
  },
  path: "/app/resource",
  httpMethod: "GET",
  queryStringParameters: {
    app_id: "123e4567-e89b-12d3-a456-426655440000"
  }
}

const mockDeleteResourceRequest = {
  type: "REQUEST",
  methodArn: "arn:aws:execute-api:us-east-1:123456789012:s4x3opwd6i/test/DELETE/app/resource/323e4567-e89b-12d3-a456-426655440002",
  headers: {
    Authorization: `Bearer ${VALID_TOKEN}`
  },
  path: "/app/resource/323e4567-e89b-12d3-a456-426655440002",
  httpMethod: "DELETE",
  queryStringParameters: {
    app_id: "123e4567-e89b-12d3-a456-426655440000"
  }
}

describe("handler function", () => {

  it('instance CognitoJwtVerifier', async () => {

    await handler(mockCreateAppRequest, {}, (err, result) => {
      expect(CognitoJwtVerifier.create).toHaveBeenCalledWith({
        userPoolId: process.env.USER_POOL_ID,
        tokenUse: "access",
        clientId: process.env.COGNITO_CLIENT_ID,
      })
    })
  })

  it("call verify function", async () => {
    handler(mockCreateAppRequest, {}, (err, result) => {
      expect(CognitoJwtVerifier.create().verify)
        .toHaveBeenCalledWith(mockCreateAppRequest.headers.Authorization.split(' ')[1])
    })
  })

  it("return ALLOW policy for app creation", async () => {
    await handler(mockCreateAppRequest, {}, (err, result) => {
      expect(result).toEqual({
        principalId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: mockCreateAppRequest.methodArn
            }
          ]
        },
        context: {
          app_id: '',
          user_role: '',
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
        }
      })
    })
  })

  it("return ALLOW policy for listing apps", async () => {
    await handler(mockListAppsRequest, {}, (err, result) => {
      expect(result).toEqual({
        principalId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: mockListAppsRequest.methodArn
            }
          ]
        },
        context: {
          app_id: '',
          user_role: '',
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
        }
      })
    })
  })

  it("return ALLOW policy for creating resource", async () => {
    await handler(mockCreateResourceRequest, {}, (err, result) => {
      expect(result).toEqual({
        principalId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: mockCreateResourceRequest.methodArn
            }
          ]
        },
        context: {
          app_id: '123e4567-e89b-12d3-a456-426655440000',
          user_role: 'owner',
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
        }
      })
    })
  })

  it("return ALLOW policy for listing resources", async () => {
    await handler(mockListResourcesRequest, {}, (err, result) => {
      expect(result).toEqual({
        principalId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: mockListResourcesRequest.methodArn
            }
          ]
        },
        context: {
          app_id: '123e4567-e89b-12d3-a456-426655440000',
          user_role: 'owner',
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
        }
      })
    })
  })

  it("return ALLOW policy for deleting resource", async () => {
    await handler(mockDeleteResourceRequest, {}, (err, result) => {
      expect(result).toEqual({
        principalId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: mockDeleteResourceRequest.methodArn
            }
          ]
        },
        context: {
          app_id: '123e4567-e89b-12d3-a456-426655440000',
          user_role: 'owner',
          user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
        }
      })
    })
  })

  it("invalid JWT token", async () => {
    const invalidTokenRequest = {
      ...mockCreateAppRequest,
      headers: {
        Authorization: "Bearer invalid-token"
      }
    }

    await handler(invalidTokenRequest, {}, (err, result) => {
      expect(result).toEqual({
        principalId: "",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Deny",
              Resource: invalidTokenRequest.methodArn
            }
          ]
        },
        context: {
          app_id: '',
          user_role: '',
          user_id: ''
        }
      })
    })
  })
})
