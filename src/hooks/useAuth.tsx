import { makeRedirectUri, revokeAsync, startAsync } from "expo-auth-session";
import React, {
  useEffect,
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { generateRandom } from "expo-auth-session/build/PKCE";
import { makeUrlParamsFactory } from "../utils/makeUrlParams";

import { api } from "../services/api";
import { AuthError } from "expo-auth-session/src/Errors";
import { TokenResponse } from "expo-auth-session/src/TokenRequest";

type AuthResult = {
  type: "error" | "success";
  errorCode: string | null;
  error?: AuthError | null;
  params: { [key: string]: string };
  authentication: TokenResponse | null;
  url: string;
};

interface User {
  id: number;
  display_name: string;
  email: string;
  profile_image_url: string;
}

interface AuthContextData {
  user: User;
  isLoggingOut: boolean;
  isLoggingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderData {
  children: ReactNode;
}

const AuthContext = createContext({} as AuthContextData);

const twitchEndpoints = {
  authorization: "https://id.twitch.tv/oauth2/authorize",
  revocation: "https://id.twitch.tv/oauth2/revoke",
};

function AuthProvider({ children }: AuthProviderData) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState({} as User);
  const [userToken, setUserToken] = useState("");

  const envs = {
    state: generateRandom(30),
    client_id: "s8mq0e8rvenermwp7bj1sbnczqosdf",
    response_type: "token",
  };

  async function signIn() {
    try {
      setIsLoggingIn(true);

      const authUrl = makeUrlParamsFactory(twitchEndpoints.authorization, {
        client_id: "",
        redirect_uri: makeRedirectUri({ useProxy: true }),
        response_type: "token",
        scope: encodeURI("openid user:read:email user:read:follows"),
        force_verify: true,
        state: envs.state,
      });

      console.log("authUrl", authUrl);

      const { type, params } = (await startAsync({
        authUrl: authUrl,
        returnUrl: "https://auth.expo.io/@luminuszz/stream-data",
      })) as AuthResult;

      const isAproved = type === "success" && params.error !== "access_denied";

      if (isAproved) {
        if (params.state !== envs.state) {
          new Error("Invalid state value");
        }

        api.defaults.headers.authorization = `Bearer ${params.access_token}`;
      }

      const response = await api.get("/users");

      const user = response.data.data[0];

      setUser(user);

      setUserToken(params.access_token);
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function signOut() {
    try {
      // set isLoggingOut to true
      // call revokeAsync with access_token, client_id and twitchEndpoint revocation
    } catch (error) {
    } finally {
      // set user state to an empty User object
      // set userToken state to an empty string
      // remove "access_token" from request's authorization header
      // set isLoggingOut to false
    }
  }

  useEffect(() => {
    api.defaults.headers["Client-Id"] = "";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggingOut, isLoggingIn, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

export { AuthProvider, useAuth };
