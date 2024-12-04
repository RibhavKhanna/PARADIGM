import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import HtmlPage from "./HtmlPage";
import "./Home.css";
import BgAnimation from "./BackgroundAnimation";
const Home = () => {
  const [contests, setContests] = useState([]);
  const [showPreloader, setShowPreloader] = useState(true);
  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

  const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME;
  const AWS_REGION = import.meta.env.VITE_AWS_REGION;

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await axios.get(`${BACKEND_BASE}/getcontests`);
        const contestsData = response.data;

        const currentDate = new Date();
        const pastContests = [];
        const currentAndUpcomingContests = [];

        contestsData.forEach((contest) => {
          const endDate = new Date(contest.endTime);
          if (endDate < currentDate) {
            pastContests.push(contest);
          } else {
            currentAndUpcomingContests.push(contest);
          }
        });

        pastContests.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
        currentAndUpcomingContests.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        );

        setContests([...pastContests, ...currentAndUpcomingContests]);
        //preloader
        setTimeout(() => {
          setShowPreloader(false); // Hide the preloader after 1.3 seconds
        }, 1300);
      } catch (error) {
        console.error("Error fetching contests:", error);
      }
    };

    fetchContests();
  }, []);

  return (
    <>
      {/* <div class="overflow-x-hidden">
        <div class="py-12 animate-marquee whitespace-nowrap ">
          <span class="text-4xl mx-4">Marquee Item 1</span>
        </div>
      </div> */}
      <div className=" ">
        {/* Contest History */}

        {showPreloader && <HtmlPage src="/New.html" />}
        {!showPreloader && (
          <>
            <marquee className="text-gray-50 styl text-l pb-2 font-mono">
              To host a contest, register as a contest creator by turning ON the
              checkbox.
            </marquee>
            <BgAnimation />
            <div className="flex flex-wrap lg:flex-nowrap text-black relative">
              <div className="w-full  lg:w-2/5 px-2 py-4 lg:px-4 h-auto overflow-y-auto no-scrollbar">
                <div className=" bg-opacity-25 shadow-md rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-red-950 via-red-500 to-red-950 p-4">
                    <h3 className="text-lg font-semibold text-white">
                      Contest History
                    </h3>
                  </div>
                  <div className="p-4 rounded-3xl p-px bg-gradient-to-b from-transparent to-blue-950">
                    <div class=" p-10 child-container `rounded-[calc(1.5rem-1px)]`">
                      <div id="current-upcoming-contests">
                        <h4 className="text-md font-semibold mb-2 text-sky-500">
                          <span class="relative flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                          </span>
                          Current & Upcoming Contests
                        </h4>
                        <ul className="list-disc pl-4 ">
                          {contests
                            .filter(
                              (contest) =>
                                new Date(contest.endTime) >= new Date()
                            )
                            .map((contest) => (
                              <li key={contest._id} className="py-1">
                                <a className="text-red-500 hover:underline">
                                  {contest.contestName} -{" "}
                                  {new Date(
                                    contest.startTime
                                  ).toLocaleDateString()}
                                </a>
                              </li>
                            ))}
                        </ul>
                      </div>
                      <hr className="my-4" />
                      <div id="past-contests">
                        <h4 className="text-md font-semibold mb-2 text-white">
                          Past Contests
                        </h4>
                        <ul className="list-disc pl-4">
                          {contests
                            .filter(
                              (contest) =>
                                new Date(contest.endTime) < new Date()
                            )
                            .map((contest) => (
                              <li key={contest._id} className="py-1">
                                <Link
                                  to={`/view/${contest._id}`}
                                  className="text-red-500 hover:underline"
                                >
                                  {contest.contestName} -{" "}
                                  {new Date(
                                    contest.endTime
                                  ).toLocaleDateString()}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                      <br />

                      <p className="text-center">
                        <Link
                          to="/contest"
                          className="text-red-500 hover:underline"
                        >
                          View More
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recently Posted Contests */}
              <div className="w-full lg:w-3/5 px-2 py-4 lg:px-4 h-screen overflow-y-auto no-scrollbar text-sky-600 relative">
                <div className=" bg-gradient-to-b from-transparent to-blue-950 bg-opacity-25 shadow-md rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-red-950 via-red-500 to-red-600 p-4">
                    <h3 className="text-lg font-semibold text-white">
                      Recently Posted Contests
                    </h3>
                  </div>

                  <div className="p-4">
                    {contests.map((contest) => (
                      <div
                        key={contest._id}
                        className="mb-4 rounded-md shadow-none transition-shadow duration-300 cursor-pointer hover:shadow-lg hover:shadow-red-400 bg-transparent p-4 rounded-md shadow-sm transition duration-300 hover:shadow-lg floating"
                      >
                        <h4 className="text-md font-semibold mb-2 text-white ">
                          {contest.contestName}
                        </h4>
                        <img
                          src={`https://2022.codeavour.org/wp-content/uploads/2022/08/Codeavour-2022-MainInternal.png`}
                          alt={contest.contestName}
                          className="mb-2 rounded-md shadow-sm w-full h-auto max-h-64 object-fill"
                        />
                        <div className="flex">
                          <p>
                            <strong>Start Date:</strong>{" "}
                            {new Date(contest.startTime).toLocaleDateString()}{" "}
                            <br />
                            <strong>End Date:</strong>{" "}
                            {new Date(contest.endTime).toLocaleDateString()}{" "}
                            <br />
                            <strong>Number of Problems:</strong>{" "}
                            {contest.problems.length} <br />
                            <strong>Created By:</strong>{" "}
                            {contest.createdBy.username}
                          </p>
                          {new Date() > new Date(contest.startTime) && (
                            <button className="ml-auto">
                              <Link
                                to={`/view/${contest._id}`}
                                className="text-red-500 relative inline-flex items-center justify-start px-6 py-3 overflow-hidden font-medium transition-all bg-white rounded hover:bg-white group"
                              >
                                <span className="w-48 h-48 rounded rotate-[-40deg] bg-blue-700 absolute bottom-0 left-5 -translate-x-full ease-out duration-500 transition-all translate-y-full mb-9 ml-9 group-hover:ml-0 group-hover:mb-32 group-hover:translate-x-0"></span>
                                <span className="relative w-full text-left text-black transition-colors duration-300 ease-in-out group-hover:text-white">
                                  View Contest
                                </span>
                              </Link>
                            </button>
                          )}
                        </div>
                        <img
                          src="assets/down.png"
                          className="animate-bounce w-6 h-6"
                          style={{
                            position: "fixed",
                            bottom: "70px",
                            right: "20px",
                          }}
                          alt="Down Arrow"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* </BgAnimation> */}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
