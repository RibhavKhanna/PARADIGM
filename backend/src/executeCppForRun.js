const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const executeCppForRun = (filePath, pretestInput) => {
    const exePath = filePath.replace(".cpp", ".exe");
    fs.copyFile(filePath, exePath, (err) => {
        if (err) {
            console.error('Error copying file:', err);
            return;
        }
        console.log('File copied successfully!');
    });
    const tempInputFilePath = `${filePath}_input.txt`;

    return new Promise((resolve, reject) => {
        fs.writeFile(tempInputFilePath, pretestInput, (writeError) => {
            if (writeError) {
                return reject(writeError);
            }

            const compileCommand = `g++ "${filePath}" -o "${exePath}"`;
            exec(compileCommand, (compileError, stdout, stderr) => {
                if (compileError) {
                    cleanupFiles([filePath, exePath, tempInputFilePath]);
                    return reject(compileError);
                }
                if (stderr) {
                    cleanupFiles([filePath, exePath, tempInputFilePath]);
                    return reject(stderr);
                }

                const command = `"${exePath}" < "${tempInputFilePath}"`;
                exec(command, (runError, runStdout, runStderr) => {
                    cleanupFiles([filePath, exePath, tempInputFilePath]);

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
};

const cleanupFiles = (files) => {
    files.forEach(file => {
        fs.unlink(file, (err) => {
            if (err) console.error(`Error deleting file ${file}:`, err);
        });
    });
};

module.exports = executeCppForRun;
