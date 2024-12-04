import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./auth/AuthContext";
import CodeModal from "./CodeModal";
// import "./Dashboard.css"; // Import CSS for animations (if needed)
import BackgroundAnimation from "./BackgroundAnimation";
const Dashboard = () => {
  const { auth } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME;
  const AWS_REGION = import.meta.env.VITE_AWS_REGION;
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = auth.userEmail;
        const response = await axios.get(`${BASE_URL}/user?email=${email}`);
        setUser(response.data);
        setProfilePhoto(response.data.profilePicture);
        fetchUserSubmissions(response.data.submissions);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [auth]);

  // Fetch user submissions
  const fetchUserSubmissions = async (userSubmissions) => {
    try {
      const submissionDetails = await Promise.all(
        userSubmissions.map(async (submission) => {
          const response = await axios.get(
            `${BASE_URL}/submissions/${submission.contestId}/${submission.problemIndex}?email=${auth.userEmail}`
          );

          // Fetch problem details to get problem name
          const problemResponse = await axios.get(
            `${BASE_URL}/${submission.contestId}/${submission.problemIndex}`
          );

          return {
            ...submission,
            submissionMessage: response.data.message,
            problemName: problemResponse.data.name,
            // Assuming code is in response.data.code
          };
        })
      );
      setSubmissions(submissionDetails);
      console.log("Submissions fetched");
    } catch (error) {
      console.error("Error fetching user submissions:", error);
    }
  };

  // Function to handle file upload for profile photo change
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setNewPhoto(file);
  };

  // Function to submit new profile photo
  const handleSubmitPhoto = async () => {
    if (!newPhoto) return;

    try {
      const formData = new FormData();
      formData.append("profilePhoto", newPhoto);
      formData.append("userEmail", auth.userEmail);

      const response = await axios.post(
        `${BASE_URL}/uploadProfilePic`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfilePhoto(response.data.imagePath); // Update profile photo state with new URL
    } catch (error) {
      console.error("Error uploading profile photo:", error);
    }
  };

  // Function to close the code modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubmission(null);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="flex flex-wrap">
      <BackgroundAnimation />
      {/* User Data and Profile Photo */}
      <div className="w-full lg:w-1/3 px-10 py-4">
        {" "}
        {/* Larger size for user details */}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden text-white terminal-style">
          <div className="bg-blue-600 p-4">
            <h3 className="text-lg font-mono font-semibold">Me🧐</h3>
          </div>
          <div className="p-4 flex items-center">
            <div className="mr-4 profile-picture">
              {profilePhoto ? (
                <>
                  <img
                    src={`https://e7.pngegg.com/pngimages/592/884/png-clipart-programmer-computer-programming-computer-software-computer-icons-programming-language-avatar-heroes-computer.png`}
                    alt="Profile"
                    className="w-36 h-36 rounded-3xl border-2 border-gray-600"
                  />
                  <span class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </>
              ) : (
                <div className="w-32 h-32 bg-gray-600 rounded-3xl"></div>
              )}
            </div>
            <div className="user-details">
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Total Submissions:</strong> {user.submissions.length}
              </p>
              {user.adminRole && (
                <p className="text-green-500 font-semibold">
                  Contest Organizer Access
                </p>
              )}
              {user.adminRole && (
                <p>
                  <strong>Number of Contests Created:</strong>{" "}
                  {user.contests.length}
                </p>
              )}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Upload Photo
            </label>
            <button
              onClick={handleSubmitPhoto}
              className="ml-2 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {/* Submissions Table and Code Modal */}
      <div className="w-full lg:w-2/3 px-4 py-4">
        {" "}
        {/* Smaller size for submissions */}
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="bg-blue-600 p-4">
            <h3 className="text-lg font-mono font-semibold text-white">
              Submissions
            </h3>
          </div>
          <div className="p-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <table className="w-full table-auto">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Problem Name</th>
                  <th className="border px-4 py-2">Submission Message</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">
                      {submission.problemName}
                    </td>
                    <td className="border px-4 py-2">{submission.message}</td>
                    <td className="border px-4 py-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded"
                        onClick={() => {
                          setSelectedSubmission(submission.code);
                          setModalOpen(true);
                        }}
                      >
                        View Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalOpen && (
        <CodeModal code={selectedSubmission} closeModal={closeModal} />
      )}
    </div>
  );
};

export default Dashboard;
