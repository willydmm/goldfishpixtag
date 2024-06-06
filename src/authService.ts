// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, AuthFlowType, ForgotPasswordCommand,  ConfirmForgotPasswordCommand} from "@aws-sdk/client-cognito-identity-provider";
import config from "./config.json";

export const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region,
});

export const signIn = async (username: string, password: string) => {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH" as AuthFlowType, // Ensure AuthFlowType is used
    ClientId: config.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };
  try {
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await cognitoClient.send(command);
    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
      sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
      return AuthenticationResult;
    }
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
  const params = {
    ClientId: config.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "given_name",
        Value: firstName,
      },
      {
        Name: "family_name",
        Value: lastName,
      },
    ],
  };
  try {
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    console.log("Sign up success: ", response);
    return response;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};

export const confirmSignUp = async (username: string, code: string) => {
  const params = {
    ClientId: config.clientId,
    Username: username,
    ConfirmationCode: code,
  };
  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    console.log("User confirmed successfully");
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const cognitoAuthUrl = `https://goldfishpixtag2.auth.${config.region}.amazoncognito.com/oauth2/authorize?response_type=token&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&identity_provider=Google&scope=openid+email+profile`;
  window.location.href = cognitoAuthUrl;
};

export const forgotPassword = async (username: string) => {
  const params = {
    ClientId: config.clientId,
    Username: username,
  };
  try {
    const command = new ForgotPasswordCommand(params);
    const response = await cognitoClient.send(command);
    console.log("Forgot password initiated: ", response);
    return response;
  } catch (error) {
    console.error("Error initiating forgot password: ", error);
    throw error;
  }
};

export const confirmForgotPassword = async (username: string, confirmationCode: string, newPassword: string) => {
  const params = {
    ClientId: config.clientId,
    Username: username,
    ConfirmationCode: confirmationCode,
    Password: newPassword,
  };
  try {
    const command = new ConfirmForgotPasswordCommand(params);
    const response = await cognitoClient.send(command);
    console.log("Password reset confirmed: ", response);
    return response;
  } catch (error) {
    console.error("Error confirming forgot password: ", error);
    throw error;
  }
};
