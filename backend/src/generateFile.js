const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const currDir = __dirname;
const codeDir = path.join(currDir, "codes");

if (!fs.existsSync(codeDir)) {
    fs.mkdirSync(codeDir, { recursive: true });
}

const generateFile = (language, code) => {
    const jobID = uuid();
    let fileName;
    if (language === "cpp") {
        fileName = `${jobID}.cpp`;
    } else if (language === "python") {
        fileName = `${jobID}.py`;
    } else if (language === "java") {
        fileName = `Main.java`; // Java file should always be named Main.java
        code = code.replace(/public\s+class\s+\w+/g, 'public class Main'); // Ensure class name is Main
    } else {
        throw new Error(`Unsupported language: ${language}`);
    }
    const filePath = path.join(codeDir, fileName);
    console.log(jobID);
    try {
        fs.writeFileSync(filePath, code);
        console.log("File written successfully");
        if(fs.existsSync(filePath)){
            console.log(filePath);
        }
    } catch (error) {
        console.error("Error writing file:", error);
    }
    console.log("written");
    return filePath;
};

module.exports = generateFile;
