import { fetchWrapper } from "../utils/functions/fetch";
import { User } from "../models/user";

export const useAuthService = () => {
  const FORGOTPASSWORD = async (email: string): Promise<any> => {
    const response: any = await fetchWrapper<any>(`auth/password/forgot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: '{"email":"' + email + '"}',
    });

    if (response.error) {
      throw new Error(response.message);
    }
    return response;
  };

  const RESETPASSWORD = async (
    userId: string | string[],
    password: string
  ): Promise<any> => {
    const response: any = await fetchWrapper<any>(
      `auth/password/reset/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: '{"password":"' + password + '"}',
      }
    );

    if (response.error) {
      throw new Error(response.message);
    }
    return response;
  };

  return {
    FORGOTPASSWORD,
    RESETPASSWORD,
  };
};
