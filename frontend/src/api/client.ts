import { ApiClient } from "./sdk/api-client";

export const apiClient = new ApiClient({
  baseURL: "http://localhost:8000",
  timeout: 10000,
});
