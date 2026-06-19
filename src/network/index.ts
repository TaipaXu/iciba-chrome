const request = async <T>({
    url,
    params,
}: {
    url: string;
    params: URLSearchParams;
}): Promise<T> => {
    const data = await fetch(`${url}?${params.toString()}`);
    return data.json() as Promise<T>;
};

export default request;
