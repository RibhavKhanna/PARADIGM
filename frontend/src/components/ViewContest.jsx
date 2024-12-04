import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "./auth/AuthContext";
import * as XLSX from "xlsx";
import "./ViewContest.css";

const ViewContest = () => {
  const [contest, setContest] = useState(null);
  const [error, setError] = useState(null);
  const { contestId } = useParams();
  const { fetchContestById } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "details";

  useEffect(() => {
    const getContest = async () => {
      try {
        const data = await fetchContestById(contestId);
        setContest(data);
      } catch (err) {
        setError(err.message);
      }
    };

    getContest();
  }, [contestId, fetchContestById]);

  const handleTabClick = (tab) => {
    setSearchParams({ tab });
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!contest) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 chinese-theme ">
      <nav className="mb-4 flex justify-center items-center text-2xl">
        <button
          onClick={() => handleTabClick("details")}
          className={`mr-4 ${
            activeTab === "details" ? "font-bold" : ""
          } btn p-2 shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] text-black bg-cyan-400 ease-in-out hover:translate-y-1 transition-all rounded`}
        >
          All Problems
        </button>
        <button
          onClick={() => handleTabClick("leaderboard")}
          className={`${
            activeTab === "leaderboard" ? "font-bold" : ""
          } btn p-2 shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] text-black bg-orange-500 ease-in-out hover:translate-y-1 transition-all rounded`}
        >
          Leaderboard
        </button>
      </nav>

      {activeTab === "details" && (
        <div className="text-white">
          <h2 className="text-dark text-3xl font-bold mb-4" style={{color: 'white'}}>{contest.contestName}</h2>
          <div className="pl-10">
            <p>
              <strong>Duration:</strong> {contest.duration}
            </p>
            <p>
              <strong>Start Time:</strong>{" "}
              {new Date(contest.startTime).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p>
              <strong>End Time:</strong>{" "}
              {new Date(contest.endTime).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p>
              <strong>Created by:</strong> {contest.createdBy.username}
            </p>
          </div>

          <div className="mt-4 pl-10 pr-10">
            <h2 className="text-xl font-semibold mb-2" style={{color: 'white'}}>Problems</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-b from-transparent to-blue-950 divide-y divide-gray-200 text-teal-50">
                {contest.problems.map((problem, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap hover:underline hover:text-blue-500">
                      <Link to={`/problem/${contestId}/${index}`}>
                        {problem.name}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "leaderboard" && <Leaderboard contest={contest} />}
    </div>
  );
};

const Leaderboard = ({ contest }) => {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    if (contest && contest.rankings) {
      const sortedRankings = [...contest.rankings].sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        return new Date(a.lastSubmissionTime) - new Date(b.lastSubmissionTime);
      });
      setRankings(sortedRankings);
    }
  }, [contest]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rankings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rankings");
    XLSX.writeFile(workbook, "rankings.xlsx");
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 styl">Leaderboard</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-orange-500 text-black">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              User Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Submissions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Last Submission Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-black">
          {rankings.map((user, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.userEmail}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.score}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.submissions}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(user.lastSubmissionTime).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={exportToExcel}
        className="mt-4 relative inline-flex items-center justify-center px-10 py-4 overflow-hidden font-mono font-medium tracking-tighter text-white bg-gray-800 rounded-lg group text-xl cursor-alias	"
      >
        <span class="absolute w-0 h-0 transition-all duration-500 ease-out bg-green-500 rounded-full group-hover:w-56 group-hover:h-56"></span>
        <span class="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-700"></span>
        <span class="relative">Export to Excel</span>
      </button>
    </div>
  );
};

export default ViewContest;

// <a
//   href="#_"
//   class="relative inline-flex items-center justify-center px-10 py-4 overflow-hidden font-mono font-medium tracking-tighter text-white bg-gray-800 rounded-lg group"
// >
//   <span class="absolute w-0 h-0 transition-all duration-500 ease-out bg-green-500 rounded-full group-hover:w-56 group-hover:h-56"></span>
//   <span class="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-700"></span>
//   <span class="relative">Button Text</span>
// </a>;
