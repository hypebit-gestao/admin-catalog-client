import { Cep } from "../models/cep";

export const useCepService = () => {
  const GET = async (cep: string): Promise<Cep> => {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((data) => data);

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  };

  return {
    GET,
  };
};
