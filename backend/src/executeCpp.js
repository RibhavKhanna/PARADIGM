const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const currDir = __dirname;
const outputPath = path.join(currDir, "outputs");

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

// Cleanup function
const cleanupFiles = (files) => {
    files.forEach(file => {
        fs.unlink(file, (err) => {
            if (err) console.error(`Error deleting file ${file}:`, err);
        });
    });
};

const executeCpp = (filePath, inputFilePath) => {
    console.log(filePath);
    const jobId = path.basename(filePath).split(".")[0];
    const fileName = `${jobId}.out`;
    const outFilePath = path.join(outputPath, fileName);
    const tempInputFilePath = path.join(outputPath, `${jobId}_input.txt`);

    return new Promise((resolve, reject) => {
        // Compile the code
        exec(`g++ ${filePath} -o ${outFilePath}`, (compileError, stdout, stderr) => {
            if (compileError) {
                return reject(compileError);
            }
            if (stderr) {
                return reject(stderr);
            }

            // Read the input file
            fs.readFile(inputFilePath, 'utf8', (readError, inputData) => {
                if (readError) {
                    return reject(readError);
                }

                // Write input data to a temporary file
                fs.writeFile(tempInputFilePath, inputData, (writeError) => {
                    if (writeError) {
                        return reject(writeError);
                    }

                    // Execute the compiled code with input
                    const command = `cd ${outputPath} && ${outputPath}/${fileName} < ${tempInputFilePath}`;
                    console.log("command: ", command);
                    exec(command, (runError, runStdout, runStderr) => {
                        // Cleanup temporary input file
                        cleanupFiles([tempInputFilePath, outFilePath]);

                        if (runError) {
                            return reject(runError);
                        }
                        if (runStderr) {
                            return reject(runStderr);
                        }
                        resolve(runStdout);
                    });
                });
            });
        });
    });
};

module.exports = executeCpp;
