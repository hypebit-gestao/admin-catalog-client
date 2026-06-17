import { fetchWrapper } from "../utils/functions/fetch";
import { Recipe } from "@/models/recipe";

export const useRecipeService = () => {
  const GETALL = async (token: string): Promise<Recipe[] | undefined> => {
    return fetchWrapper<Recipe[]>("recipe", {
      method: "GET",
      headers: { Authorization: token },
    });
  };

  const POST = async (data: Recipe, token: string): Promise<Recipe | undefined> => {
    return fetchWrapper<Recipe>("recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify(data),
    });
  };

  const PUT = async (data: Recipe, token: string): Promise<Recipe | undefined> => {
    return fetchWrapper<Recipe>("recipe", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify(data),
    });
  };

  const TOGGLE = async (id: string, token: string): Promise<Recipe | undefined> => {
    return fetchWrapper<Recipe>(`recipe/toggle/${id}`, {
      method: "PUT",
      headers: { Authorization: token },
    });
  };

  const DELETE = async (id: string, token: string): Promise<void> => {
    await fetchWrapper(`recipe/${id}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });
  };

  return { GETALL, POST, PUT, TOGGLE, DELETE };
};
