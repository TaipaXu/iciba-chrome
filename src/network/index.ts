const request = async ({ url, params, }: { url: string, params: URLSearchParams }) => {
    const data = await fetch(`${url}?${params.toString()}`);
    return await data.json();
};

export default request;
