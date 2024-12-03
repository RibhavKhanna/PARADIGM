import React from "react";

const RunResultsModal = ({ results, onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center"
            onClick={onClose}
        >
            <div
                className="bg-white w-4/5 max-w-4xl p-6 rounded-lg shadow-lg text-black"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-4">Run Results</h2>
                <div className="overflow-y-auto max-h-96">
                    {results.map((result, idx) => (
                        <div
                            key={idx}
                            className={`p-4 mb-4 border ${
                                result.isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : "border-red-500 bg-red-50"
                            } rounded-lg`}
                        >
                            <p>
                                <strong>Test Case {idx + 1}:</strong>
                            </p>
                            <p>
                                <strong>Input:</strong>
                                <pre className="bg-gray-100 p-2">{result.input}</pre>
                            </p>
                            <p>
                                <strong>Expected Output:</strong>
                                <pre className="bg-gray-100 p-2">{result.expectedOutput}</pre>
                            </p>
                            <p>
                                <strong>Your Output:</strong>
                                <pre
                                    className={`p-2 ${
                                        result.isCorrect
                                            ? "bg-green-100"
                                            : "bg-red-100"
                                    }`}
                                >
                                    {result.actualOutput}
                                </pre>
                            </p>
                            <p>
                                <strong>Result:</strong>{" "}
                                {result.isCorrect ? "✅ Passed" : "❌ Failed"}
                            </p>
                        </div>
                    ))}
                </div>
                <button
                    className="mt-4 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default RunResultsModal;
