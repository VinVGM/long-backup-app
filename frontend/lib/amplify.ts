import { Amplify } from "aws-amplify"

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
    },
  },
  API: {
    REST: {
      PathramaUp: {
        endpoint: process.env.NEXT_PUBLIC_API_URL || "",
        region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      },
    },
  },
})
