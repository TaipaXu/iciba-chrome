import axios, { AxiosInstance, AxiosResponse } from 'axios';

const request: AxiosInstance = axios.create({
    timeout: 5000,
});

request.interceptors.response.use(
    (response: AxiosResponse) => {
        const data = response.data;
        return data;
    },
    (error) => {

    }
);

export default request;
