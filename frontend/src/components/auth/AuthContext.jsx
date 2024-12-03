import { createContext, useState, useEffect } from "react";
import axios from "axios";

// import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const BASE_URL = "http://localhost:3000";
// const navigate = useNavigate();

export const fetchProblemsFromExpiredContests = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/problemsFromExpiredContests`);
    return response.data; // Assuming response.data is an array of problems
  } catch (error) {
    console.error("Error fetching problems from expired contests:", error);
    throw error;
  }
};

export const fetchContests = async () => {
  try {
    console.log("fet frommauth");
    const response = await axios.get(`${BASE_URL}/getcontests`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contests:", error);
    throw error;
  }
};

export const fetchContestById = async (contestId) => {
  try {
    const response = await axios.get(`${BASE_URL}/contest/${contestId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contest:", error);
    throw error;
  }
};
const fetchSubmissionsByContestId = async (contestId) => {
  console.log("Fetching contest by ID:", contestId);
  const response = await fetch(`${BASE_URL}/contest/${contestId}`);
  const data = await response.json();
  // console.log(data);
  // cont daata2 = response.submissions;
  console.log("fetched contest");
  return data;
};

const calculateRankings = async (contestId) => {
  try {
    const response = await axios.post(`${BASE_URL}/calculateRankings`, {
      contestId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error calculating rankings"
    );
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");
    const role = localStorage.getItem("role");
    return token ? { loggedIn: true, token, userEmail, role } : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");
    const role = localStorage.getItem("role");

    if (token) {
      setAuth({ loggedIn: true, token, userEmail, role });
    } else {
      setAuth(null);
    }
  }, []);

  const register = async (formData) => {
    try {
      const response = await axios.post(`${BASE_URL}/register`, formData);
      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const login = async (formData) => {
    try {
      const response = await axios.post(`${BASE_URL}/login`, formData, {
        withCredentials: true,
      });
      console.log("login response: ", response.data);
      setAuth({
        loggedIn: true,
        token: response.data.token,
        role: response.data.adminRole,
        userEmail: response.data.userEmail,
      });
      localStorage.setItem("userEmail", response.data.userEmail);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.adminRole);
      return { data: response.data, status: response.status };
    } catch (err) {
      console.error("Error logging in:", err);
      return {
        error: err.response?.data || "Unknown error",
        status: err.response?.status || 500,
      };
    }
  };

  const logout = async () => {
    await axios.post(`${BASE_URL}/logout`, {}, { withCredentials: true });
    setAuth(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
  };

  const createPost = async (formData) => {
    try {
      // Log FormData entries
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      await axios.post(`${BASE_URL}/create`, formData, {
        withCredentials: true,
      });
      alert("Contest posted successfully.");
      // setPosts([...posts, response.data]);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        register,
        login,
        logout,
        createPost,
        fetchContests,
        fetchContestById,
        problemsFromExpiredContests: fetchProblemsFromExpiredContests,
        calculateRankings,
        fetchSubmissionsByContestId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
