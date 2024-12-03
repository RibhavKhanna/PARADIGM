const express = require('express');
const { DBConnection } = require('./database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./models/Users');
const Contest = require('./models/Contest');
const bodyParser = require('body-parser');
const executeCpp = require("./src/executeCpp.js")
const cors = require('cors')
const path = require('path');
const generateFile = require("./src/generateFile");
const executeCppForRun = require("./src/executeCppForRun.js")
const executePythonForRun = require("./src/executePythonForRun.js");
const executePython = require("./src/executePython");
const executeJavaForRun = require("./src/executeJavaForRun");
const executeJava = require("./src/executeJava");
const { log } = require('console');
const fs = require("fs");
// const AWS = require('aws-sdk');
const multer = require('multer');
// const multerS3 = require('multer-s3');
const { promisify } = require('util');
const { console } = require('inspector');
const { stdout } = require('process');

// Load environment variables from .env file
require('dotenv').config();

// Create express app
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
    origin: ' http://127.0.0.1:5173', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true  // Allow credentials (cookies)
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // Configure AWS SDK with your credentials and region
// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION
// });

// // Multer configuration for S3 storage
// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.AWS_BUCKET_NAME,
//         acl: 'public-read',
//         key: function (req, file, cb) {
//             let folder = 'uploads/';
//             if (file.fieldname === 'profilePhoto') {
//                 folder += 'images/profiles/';
//             } else if (file.fieldname === 'contestImage') {
//                 folder += 'images/contests/';
//             } else if (file.fieldname.startsWith('images')) {
//                 folder += 'images/contests/problemImages/';
//             } else if (file.fieldname.startsWith('inputFile') || file.fieldname.startsWith('outputFile')) {
//                 folder += 'testcases/';
//             }
//             const filename = Date.now() + '-' + file.originalname;
//             cb(null, folder + filename);
//         }
//     })
// });


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'src/uploads/';
        if (file.fieldname === 'profilePhoto') {
            folder += 'images/profiles/';
        } else if (file.fieldname === 'contestImage') {
            folder += 'images/contests/';
        } else if (file.fieldname.startsWith('images')) {
            folder += 'images/contests/problemImages/';
        } else if (file.fieldname.startsWith('inputFile') || file.fieldname.startsWith('outputFile')) {
            folder += 'testcases/';
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + '-' + file.originalname;
        // const filename = file.originalname;
        cb(null, filename);
    }
});

const upload = multer({ storage });

// // Middleware to serve static files from S3
// app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Example route to handle submission
// Function to normalize newlines
const normalizeNewlines = (text) => {
    return text.replace(/\r\n/g, "\n"); // Convert Windows-style newlines to Unix-style newlines
};

// Function to normalize file paths for S3
const normalizeFilePath = (filePath) => {
    return filePath.replace(/\\/g, '/');
};
// API endpoint to handle code submission
// Write to a temporary file
const writeTempFile = async (data) => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const tempFilePath = path.join(tempDir, `${Date.now()}-input.txt`);
    await promisify(fs.writeFile)(tempFilePath, data);
    return tempFilePath;
};

// API endpoint to handle code submission
app.post("/submit", async (req, res) => {
    const { language = "cpp", code, ipath, opath, contestId, index, email } = req.body;

    if (code === "") {
        return res.status(400).json({ success: false, message: "Do write some code to submit!" });
    }

    try {
        // Generate file on the fly (if needed)
        const filePath = await generateFile(language, code);

        // Normalize input and output file paths
        const inputFilePath = normalizeFilePath(ipath);
        const outputFilePath = normalizeFilePath(opath);

        // // Read input file directly from S3
        // const inputParams = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: inputFilePath
        // };
        // const inputText = await s3.getObject(inputParams).promise()
        //     .then(data => data.Body.toString('utf-8'));

        // Write inputText to a temporary file
        const inputText = await fs.readFile(inputFilePath, 'utf-8');
        const tempInputFilePath = await writeTempFile(inputText);

        // Execute code based on language
        let output;
        if (language === "cpp") output = await executeCpp(filePath, tempInputFilePath);
        else if (language === "java") output = await executeJava(filePath, tempInputFilePath);
        else if (language === "python") output = await executePython(filePath, tempInputFilePath);
        else return res.status(500).json({ success: false, message: "Unexpected language selected" });

        // Read expected output file directly from S3
        // const outputParams = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: outputFilePath
        // };
        // const expectedOutput = await s3.getObject(outputParams).promise()
        //     .then(data => data.Body.toString('utf-8'));
        const expectedOutput = await fs.readFile(outputFilePath, 'utf-8');
        const normalizedOutput = normalizeNewlines(output.trim());

        let submissionResult, message;
        if (normalizedOutput === normalizeNewlines(expectedOutput.trim())) {
            submissionResult = "ACC";
            message = "Accepted";
        } else {
            submissionResult = "WA";
            message = "Wrong Answer";
        }

        // Update user's submissions
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.submissions.push({
            contestId,
            submissionType: language,
            problemIndex: index,
            code,
            result: submissionResult,
            message,
            receivedOutput: normalizedOutput,
            expectedOutput: normalizeNewlines(expectedOutput.trim())
        });
        await user.save();

        const currentTime = new Date();

        // Update contest rankings if submission is accepted
        const contest = await Contest.findById(contestId);
        if (submissionResult === "ACC" && currentTime < new Date(contest.endTime)) {
            if (!contest) {
                return res.status(404).json({ success: false, message: "Contest not found" });
            }

            if (contest.registrations.includes(email)) {
                let rankedUser = contest.rankings.find(user => user.userEmail === email);

                if (!rankedUser) {
                    rankedUser = {
                        solved: [],
                        userEmail: email,
                        score: 0,
                        submissions: 0,
                        lastSubmissionTime: null
                    };
                    rankedUser.solved.push(index);
                    rankedUser.score += ((index + 1) * 50);
                    rankedUser.lastSubmissionTime = new Date();
                    rankedUser.submissions += 1;
                    contest.rankings.push(rankedUser);
                }

                if (!rankedUser.solved.includes(index)) {
                    rankedUser.solved.push(index);
                    rankedUser.score += (index + 1) * 50;
                    rankedUser.lastSubmissionTime = new Date();
                    rankedUser.submissions += 1;
                }

                console.log(rankedUser);
                await contest.save();
            }
        }

        res.send({
            success: submissionResult === "ACC",
            message,
            receivedOutput: normalizedOutput,
            expectedOutput: normalizeNewlines(expectedOutput.trim())
        });

    } catch (err) {
        console.error("Error executing code:", err);
        res.status(500).json({ success: false, message: "Error executing code", error: err.message });
    }
});


// Example route to create contest with files
app.post('/create', upload.any(), async (req, res) => {
    const { useremail, contestName, duration, startTime, endTime } = req.body;
    try {
        let problems = req.body.problems;
        if (typeof problems === 'string') {
            problems = JSON.parse(problems);
        }

        problems = problems.map((problem, index) => {
            const images = req.files
                .filter(file => file.fieldname.startsWith(`images-${index}`))
                .map(file => path.join('uploads/images/contests/problemImages', file.filename));

                return {
                    ...problem,
                    inputFile: path.join('uploads', req.files.find(file => file.fieldname === `problems[${index}][inputFile]`)?.filename || ''),
                    outputFile: path.join('uploads', req.files.find(file => file.fieldname === `problems[${index}][outputFile]`)?.filename || ''),
                    images
                };
        });

        const contestImage = path.join('uploads/images/contests', path.basename(req.files.find(file => file.fieldname === 'contestImage')?.key || ''));
        // const contestImage = path.join('uploads/images/contests', req.file.filename);

        let user = await User.findOne({ email: useremail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newContest = new Contest({
            contestName,
            duration,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            problems,
            photo: contestImage,
            createdBy: user._id,
        });

        const savedContest = await newContest.save();

        user.contests.push(savedContest._id);
        await user.save();

        res.status(201).json({ message: 'Contest created successfully!', contest: savedContest });
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).json({ message: 'Internal Server Error' + error});
    }
});

// Example route to handle profile picture upload
app.post('/uploadProfilePic', upload.single('profilePhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userEmail = req.body.userEmail;
        const profileImagePath = path.join('uploads/images/profiles/', path.basename(req.file.key));

        let user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = profileImagePath;
        await user.save();

        res.status(200).json({ message: 'Profile picture updated successfully', imagePath: profileImagePath });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// routes
app.get('/', (req, res) => {
    res.send('Welcome to backend!');
});

app.post('/register', async (req, res) => {
    try {
        console.log("comming");
        // get data from request body
        const { username, email, password, adminRole } = req.body;

        // check all data received
        if (!(username && email && password)) {
            return res.status(400).send("Please enter all the required fields");
        }

        // check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(email);
            return res.status(400).send("User already exists. Enter a new email.");
        }

        // encrypt password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // save user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            adminRole: adminRole || false
        });

        // generate token for user
        const token = jwt.sign({ id: user._id, email }, process.env.SECRET_KEY, {
            expiresIn: '1h'
        });

        // send the response and object
        user.password = undefined;
        res.status(201).json({ message: "New user successfully created", user, token });

    } catch (err) {
        console.log("Error while registering", err);
        res.status(500).send("Internal Server Error");
    }
});

// Example of setting cookie in Node.js (Express.js)
app.post('/login', async (req, res) => {
    try {
        // get details
        const { email, password } = req.body;

        // find user
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).send("You are not registered. Please register to gain access.");
        }

        // compare passwords
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(400).send("Wrong password");
        }

        // generate token for user
        const token = jwt.sign({ userEmail: existingUser.email, role: existingUser.adminRole }, process.env.SECRET_KEY, { expiresIn: "1h" });
        res.cookie("token", token, { secure: true, sameSite: "None", maxAge: 3600000 });
        res.json({ userEmail: existingUser.email, token, adminRole: existingUser.adminRole }); // Return the user's role along with the token

    } catch (err) {
        console.log("Error while logging in", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/logout', (req, res) => {
    // Logic to handle logout, e.g., invalidating tokens, clearing session
    res.clearCookie("token"); // clear the cookie from the client
    res.clearCookie("role"); // clear the cookie from the client
    res.status(200).json({ message: "Logout successful" });
    res.status(200).send({ message: 'Logout successful' });
});



//get contests
app.get('/getcontests', async (req, res) => {
    try {
        // Find users with adminRole: true
        const adminUsers = await User.find({ adminRole: true }).select('_id');
        const adminUserIds = adminUsers.map(user => user._id);

        // Find contests created by admin users
        const contests = await Contest.find({ createdBy: { $in: adminUserIds } })
            .populate('createdBy', 'username')
            .exec();

        res.json(contests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to fetch contest by ID
app.get('/contest/:id', async (req, res) => {
    try {
        const contestId = req.params.id;
        const contest = await Contest.findById(contestId).populate('createdBy', 'username').exec();

        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        res.json(contest);
    } catch (error) {
        console.error('Error fetching contest by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to fetch problems from contests whose end date has passed
app.get('/problemsFromExpiredContests', async (req, res) => {
    try {
        // Get current date/time
        const currentDate = new Date();

        // Query contests where end time is less than current date
        const contests = await Contest.find({ endTime: { $lt: currentDate } })
            .populate('problems', 'name description testCases index') // Assuming problems have 'index' field
            .exec();

        // Extract problems with additional contest details
        let problems = [];
        contests.forEach(contest => {
            var idx = 0;
            contest.problems.forEach(problem => {
                problems.push({
                    idx: idx,
                    contestName: contest.contestName,
                    contestId: contest._id,
                    endTime: contest.endTime,
                    problemName: problem.name,
                    problemIndex: problem.index,
                    description: problem.description,
                    testCases: problem.testCases
                });
                idx++;
            });
        });

        res.json(problems);
    } catch (err) {
        console.error('Error fetching problems from expired contests:', err);
        res.status(500).json({ error: err.message });
    }
});


app.post("/run", async (req, res) => {
    const { language = "cpp", code, pretestIp } = req.body;
    if (code === "") {
        return res.status(400).json({ success: false, message: "Do write some code to submit!" });
    }
    try {
        console.log("pretests are: ", pretestIp);
        const filePath = await generateFile(language, code);
        console.log("before output ");

        let output;
        if (language === "cpp") {
            output = await executeCppForRun(filePath, pretestIp);
        } else if (language === "python") {
            output = await executePythonForRun(filePath, pretestIp);
        } else if (language === "java") {
            output = await executeJavaForRun(filePath, pretestIp);
        }

        console.log("after output ");
        res.send({ filePath, output });
    } catch (err) {
        console.error("Error executing code:", err);
        res.status(500).json({ success: false, message: "Error executing code", error: err.message });
    }
});


app.get('/submissions/:contestId/:index', async (req, res) => {
    const { contestId, index } = req.params;
    const userEmail = req.query.email; // Get userEmail from query params

    try {
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const submissions = user.submissions.filter(submission => (
            submission.contestId === contestId &&
            submission.problemIndex === index
        ));

        res.json({ submissions });
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ message: 'Failed to fetch submissions' });
    }
});

app.get('/:contestId/:index', async (req, res) => {
    try {
        const { contestId, index } = req.params;
        const contest = await Contest.findById(contestId);

        if (!contest) {
            return res.status(404).send('Contest not found');
        }

        const problem = contest.problems[index];

        if (!problem) {
            return res.status(404).send('Problem not found');
        }

        res.json(problem);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

//user profile
// Route to fetch user by email
app.get('/user', async (req, res) => {
    try {
        const email = req.query.email;
        const user = await User.findOne({ email }).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/contests/:contestId', async (req, res) => {
    const { contestId } = req.params;
    const updatedContest = req.body;

    try {
        const contest = await Contest.findByIdAndUpdate(contestId, updatedContest, { new: true }).exec();
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        res.status(200).json(contest);
    } catch (err) {
        console.error('Error updating contest:', err);
        res.status(500).json({ error: err.message });
    }
});


// Route to check user email in contest registrations and register if not present
app.post('/checksubmission', async (req, res) => {
    const { contestId, userEmail } = req.body;

    try {
        // Find contest by contestId
        const contest = await Contest.findById(contestId).exec();
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        // Check if userEmail exists in registrations array
        if (contest.registrations.includes(userEmail)) {
            return res.json({ message: 'User already registered for this contest' });
        }

        // If userEmail not found, append it to registrations array
        contest.registrations.push(userEmail);
        await contest.save();

        res.json({ message: 'User registered successfully for the contest' });
    } catch (err) {
        console.error('Error checking submission:', err);
        res.status(500).json({ error: err.message });
    }
});


app.listen(3000, async () => {
    console.log("Server is listening on port 3000");
    console.log("Connecting DB");
    await DBConnection();
});