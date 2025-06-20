import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import Api from "./api";

const key = "";

let axiosIns: AxiosInstance | null = null;

const getAxiosInstance = (clientSecret?: string) => {
  if (axiosIns && !clientSecret) {
    return axiosIns;
  }

  const apiRequestConfig: AxiosRequestConfig = {
    baseURL: "https://emailverifier.reoon.com/api/v1/verify",
  };

  axiosIns = axios.create(apiRequestConfig);
  return axiosIns;
};

export class EmailVerifyApi extends Api {
  static quickVerification(email: string): AxiosPromise<any> {
    const requestConfig: AxiosRequestConfig = {
      method: "GET",
      withCredentials: false,
      params: {
        email,
        key,
        mode: 'quick',
      },
    };

    return getAxiosInstance().request(requestConfig);
  }
}
