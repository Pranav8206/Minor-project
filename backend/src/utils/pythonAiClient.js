import axios from "axios";

const getPythonAiClient = () => {
  if (!process.env.PYTHON_AI_API_URL) {
    throw new Error("PYTHON_AI_API_URL is not configured");
  }

  return axios.create({
    baseURL: process.env.PYTHON_AI_API_URL,
    timeout: Number(process.env.PYTHON_AI_TIMEOUT_MS || 30000),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const callPythonAiService = async (endpoint, payload) => {
  const pythonAiClient = getPythonAiClient();
  const response = await pythonAiClient.post(endpoint, payload);

  return response.data;
};

export const analyzeCaseDescription = async (description) => {
  return callPythonAiService("/analyze", { text: description });
};

export const searchSimilarCases = async ({ query, stored_embeddings = [] }) => {
  return callPythonAiService("/similar", {
    query,
    stored_embeddings,
  });
};
