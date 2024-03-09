export async function fetchWrapper<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/${input}`,
    init
  );

  const text = await data.text();
  let result;
  if (text.length) {
    result = JSON.parse(text);
  } else {
    result = {};
  }

  return result as T;
}
