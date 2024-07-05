const { CognitoJwtVerifier } = require("aws-jwt-verify")
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  user: process.env.RDS_USER,
  host: process.env.RDS_HOSTNAME,
  database: 'default_db',
  password: process.env.RDS_PW,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0
})

const generatePolicy = (principalId, effect, resource, app_id, user_role) => {
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    },
    context: {
      app_id,
      user_role,
      user_id: principalId
    }
  }
  console.log('policy:', policy)
  return policy
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
})

const getPayload = async (token) => {
  try {
    const payload = await verifier.verify(token)
    console.log("Cognito token is valid. Payload:", payload)
    return payload
  } catch (e) {
    if (e.message.includes('Token expired at')) {
      throw new Error(e)
    }
    return null
  }
}

exports.handler = async (request, context, callback) => {
  console.log('EventPayload', JSON.stringify(request))
  context.callbackWaitsForEmptyEventLoop = false

  console.log({
    userPoolId: process.env.USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
  })

  try {
    // Get Token
    const header = request.headers.Authorization
    const token = header.split(' ')[1]

    // Validate token
    const payload = await getPayload(token)
    const isCognitoToken = !!payload
    const isSystemToken = (token === process.env.API_KEY)

    // Get Pathname and HTTP method
    const { path, httpMethod } = request
    console.log('path:', path)
    console.log('httpMethod:', httpMethod)

    // Determine app ID based on path and method
    let app_id = ''
    const appIdFromPathRegex = /^\/app\/([^\/]+)$/
    if (appIdFromPathRegex.test(path) && (httpMethod === 'DELETE' || httpMethod === 'PUT')) {
      const match = path.match(appIdFromPathRegex)
      app_id = match[1]
    } else {
      app_id = request.queryStringParameters?.app_id || ''
    }
    console.log('app_id:', app_id)

    // Define User ID
    let userId
    let user_role

    // 1.1 Cognito token
    if (isCognitoToken) {
      userId = payload.sub
      console.log('Token is a valid Cognito token')
    }

    // 1.2. System
    else if (isSystemToken) {
      console.log('Token is a valid System token')
      callback(null, generatePolicy('', 'Allow', request.methodArn, '', ''))
      return
    }

    // 1.3. Invalid token
    else {
      throw new Error('Invalid token')
    }

    // 2.1. App ID not needed
    if (
      (path === '/app' && httpMethod === 'POST') ||
      (path === '/app' && httpMethod === 'GET')
    ) {
      console.log('app_id not needed')

      callback(null, generatePolicy(
        userId,
        'Allow',
        request.methodArn,
        '',
        ''
      ))
      return
    }

    // 2.2. App ID obligatory
    if (app_id) {
      console.log('app_id needed')

      // Get role
      const connection = await pool.getConnection()
      try {
        const [results] = await connection.query(
          'SELECT user_role FROM user_app WHERE user_id = ? AND app_id = ?',
          [userId, app_id]
        )

        if (results.length > 0) {
          user_role = results[0].user_role
          console.log('user_role', user_role)
        } else {
          throw new Error('User role not found')
        }
      } finally {
        connection.release()
      }

      callback(null, generatePolicy(
        userId,
        'Allow',
        request.methodArn,
        app_id,
        user_role
      ))
    } else {
      throw new Error('app_id is required')
    }
  } catch (e) {
    if (!e.message.includes('Token expired at') && !e.message.includes('User role not found')) {
      console.error(e)
    }
    callback(null, generatePolicy(
      '',
      'Deny',
      request.methodArn,
      '',
      ''
    ))
  }
}
