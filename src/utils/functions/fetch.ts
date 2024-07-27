export async function fetchWrapper<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/${input}`,
    init
  );

  if (!data.ok) {
    const errorText = await data.text();
    let errorResult;
    if (errorText.length) {
      errorResult = JSON.parse(errorText);
    } else {
      errorResult = {};
    }
    throw new Error(errorResult.message || "Erro na requisição");
  }

  const text = await data.text();
  let result;
  if (text.length) {
    result = JSON.parse(text);
  } else {
    result = {};
  }

  return result as T;
}
