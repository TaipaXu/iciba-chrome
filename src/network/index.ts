const request = async <T>({
    url,
    params,
    signal,
}: {
    url: string;
    params: URLSearchParams;
    signal?: AbortSignal;
}): Promise<T> => {
    const data = await fetch(`${url}?${params.toString()}`, { signal });
    return data.json() as Promise<T>;
};

export default request;
