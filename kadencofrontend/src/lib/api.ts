export const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:8000/api" 
  : "https://kadencobusiness.onrender.com/api";

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  // Handle No Content responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
};
