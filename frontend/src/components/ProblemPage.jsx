import React, { useEffect, useState, useContext } from "react";
import { Editor } from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext, fetchContestById } from "./auth/AuthContext";
import CodeModal from "./CodeModal";
import RunResultsModal from "./RunResultsModal";



const ProblemPage = () => {
  const { contestId, index } = useParams();
  const [activeTab, setActiveTab] = useState("description");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [results, setResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState(`#include <bits/stdc++.h>
using namespace std;
#define ll long long int

int main()
{

    int _;
    cin >> _;
    while (_--)
    {
      cout<<"Hello World";
    }
    return 0;
}
`);
  const [error, setError] = useState(null);
  const [prob, setProb] = useState("");
  const [ipath, setIpath] = useState("");
  const [opath, setOpath] = useState("");
  const [pretestIp, setPretestIp] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [images, setImages] = useState([]);
  const { auth } = useContext(AuthContext);
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME;
  const AWS_REGION = import.meta.env.VITE_AWS_REGION;

  useEffect(() => {
    const getProblem = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/${contestId}/${index}`);
        setProb(response.data);
        setPretestIp(response.data.testCases);
        setIpath(response.data.inputFile);
        setOpath(response.data.outputFile);
        setImages(response.data.images || []);
      } catch (err) {
        setError(err.message);
      }
    };
    getProblem();
  }, [contestId, index]);

  const handleRunCode = async () => {
    try {
      setOutput("Running code...");
      const response = await axios.post(`${BASE_URL}/run`, {
        language,
        code,
        pretestIp,
      });
      console.log(response.data);

      if (response.data.code) {
        setOutput(response.data.error);
      } else {
        setOutput(response.data.output);
        // Check if the output matches the expected output
        const expectedOutput = prob.expectedOutput;
        const isCorrect = actualOutput === expectedOutput;

        // Create an array with the single test case result
        const results = [
            {
                input: pretestIp,  // The input used for the test case
                expectedOutput,
                actualOutput,
                isCorrect,
            },
        ];
        setResults(results);
        setIsModalOpen(true);
      }
    } catch (error) {
      const parsedErr = JSON.parse(error.request.response);
      setOutput(`Error: ${parsedErr.error}`);
    }
  };

  const handleViewSubmission = async () => {
    try {
      const email = auth.userEmail;
      const response = await axios.get(
        `${BASE_URL}/submissions/${contestId}/${index}?email=${email}`
      );

      const sortedSubmissions = response.data.submissions.sort(
        (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
      );

      setSubmissions(sortedSubmissions);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  const handleSubmitCode = async () => {
    if (auth) {
      try {
        setOutput("Submitting code...");
        setIpath(prob.inputFile);
        setOpath(prob.outputFile);

        const email = auth.userEmail;
        const response = await axios.post(`${BASE_URL}/submit`, {
          language,
          code,
          ipath,
          opath,
          contestId,
          index,
          email,
        });

        if (response.data.message === "Accepted") {
          setOutput("Accepted");
        } else {
          setOutput(
            `Wrong Answer \nExpected Output:\n${response.data.expectedOutput} \nReceived Output:\n${response.data.receivedOutput}`
          );
        }
      } catch (err) {
        console.error("Submission error:", err);
        setOutput(err.response.data.error);
      }
    } else {
      alert("Please login to make submission.");
    }
  };

  const handleShowCode = (code) => {
    setSelectedCode(code);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCode("");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white ">
      {modalOpen && <CodeModal code={selectedCode} closeModal={closeModal} />}
      <div className="w-2/5 border-r border-gray-800 p-4 overflow-y-scroll">
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === "description" ? "border-b-2 border-blue-500" : ""
            }`}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>

          {auth && (
            <button
              className={`flex-1 py-2 text-center ${
                activeTab === "submissions" ? "border-b-2 border-blue-500" : ""
              }`}
              onClick={() => {
                setActiveTab("submissions");
                handleViewSubmission();
              }}
            >
              Submissions
            </button>
          )}
        </div>
        <div className={activeTab === "description" ? "block" : "hidden"}>
          <h2 className="text-xl font-bold mb-2">{prob.name}</h2>
          <h2 className="text-xl font-bold mb-2">Problem Description</h2>
          <p style={{ whiteSpace: "pre-line" }}>{prob.description}</p>

          {images.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Images</h3>
              {images.map((image, idx) => {
                return (
                  <img
                    key={idx}
                    src={`https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${image.replace(
                      /\\/g,
                      "/"
                    )}`}
                    alt={`Problem Image ${idx + 1}`}
                    className="mb-2"
                    style={{ maxWidth: "100%", maxHeight: "400px" }}
                  />
                );
              })}
            </div>
          )}

          <h3 className="text-xl font-bold mb-2">Test Cases</h3>
          <h4 className="text-xl font-bold mb-2">Sample Input</h4>
          <p style={{ whiteSpace: "pre-line" }}>{prob.testCases}</p>
          <h4 className="text-xl font-bold mb-2">Sample Output</h4>
          <p style={{ whiteSpace: "pre-line" }}>{prob.expectedOutputs}</p>
          <h3 className="text-xl font-bold mb-2">Constraints</h3>
          <p>Time limit : 1 second</p>
        </div>

        <div className={activeTab === "submissions" ? "block" : "hidden"}>
          <h2 className="text-xl font-bold mb-2">Submissions</h2>
          {submissions.length === 0 ? (
            <p>No submissions found.</p>
          ) : (
            submissions.map((submission, index) => (
              <div key={index} className="border border-gray-300 p-2 mb-4">
                <div>
                  <strong>Result:</strong> {submission.result}
                </div>
                <div>
                  <strong>Message:</strong> {submission.message}
                </div>
                <div>
                  <strong>Date & Time:</strong>{" "}
                  {new Date(submission.dateTime).toLocaleString()}
                </div>
                <div>
                  <strong>View Code:</strong>{" "}
                  <button
                    className="text-blue-500"
                    onClick={() => handleShowCode(submission.code)}
                  >
                    View
                  </button>
                </div>
                {submission.result !== "ACC" && (
                  <div>
                    <strong>Received Output:</strong>{" "}
                    {submission.receivedOutput}
                  </div>
                )}
                {submission.result !== "ACC" && (
                  <div>
                    <strong>Expected Output:</strong>{" "}
                    {submission.expectedOutput}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="w-3/5 flex flex-col p-4">
        <div className="mb-2">
          <select
            className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white"
            onChange={(e) => {
              setLanguage(e.target.value);
              if (e.target.value === "python") setCode(`print("hello World")`);
              else if (e.target.value === "java")
                setCode(`import java.util.Arrays;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        //code here
        System.out.println("Hello world");
    }
}
`);
              else {
                setCode(`#include <bits/stdc++.h>
using namespace std;
#define ll long long int

int main()
{

    int _;
    cin >> _;
    while (_--)
    {
        cout<<"Hello World";
    }
    return 0;
}
`);
              }
            }}
            value={language}
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
        </div>
        <Editor
          height="70vh"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
          }}
        />
        <div className="flex mt-2">
          <button
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600 transition duration-300"
            onClick={handleRunCode}
          >
            Run
          </button>
          <button
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            onClick={handleSubmitCode}
          >
            Submit
          </button>
          {/* {isModalOpen && (
                <RunResultsModal
                    results={results}
                    onClose={() => setIsModalOpen(false)}
                />
            )} */}
        </div>
        <div className="mt-2">
          <h3 className="text-lg font-bold">Output</h3>
          <pre className="p-2 border border-gray-300 rounded bg-gray-800 text-white max-h-40 overflow-y-auto">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
