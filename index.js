const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoClient = mongodb.MongoClient;
const objectID = mongodb.ObjectID;

const app = express();

const port = process.env.PORT || 3000;
const dburl = "mongodb://127.0.0.1:27017/" || process.env.DB_URL; // local db url

// app.use(cors())
app.use(express.json()); //middleware

app.post("/register-mentor", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("student_management");
        if (request.body.email && request.body.name && request.body.password) {
            let isPresent = await db
                .collection("mentors")
                .findOne({
                    email: request.body.email
                });
            let total = await db.collection("mentors").find().toArray();
            if (isPresent) {
                response.status(406).json({
                    msg: "User already registered"
                });
            } else {
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(request.body.password, salt);
                request.body.password = hash;
                request.body["students"] = [];
                request.body["ID"] = total.length + 1;
                request.body["accountStatus"] = "active";
                let result = await db.collection("mentors").insertOne(request.body);
                response
                    .status(202)
                    .json({
                        msg: "User registered successfully",
                        ID: request.body.ID
                    });
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.post("/register-student", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("student_management");
        requiredKeys = ["name", "email", "password", "contactNo", "standard"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let isPresent = await db
                .collection("students")
                .findOne({
                    email: request.body.email
                });
            let total = await db.collection("students").find().toArray();
            if (isPresent) {
                response.status(406).json({
                    msg: "User already registered"
                });
            } else {
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(request.body.password, salt);
                request.body.password = hash;
                request.body["mentorId"] = "unassigned";
                request.body["mentorName"] = "unassigned";
                request.body["ID"] = total.length + 1;
                request.body["accountStatus"] = "active";
                let result = await db.collection("students").insertOne(request.body);
                response
                    .status(202)
                    .json({
                        msg: "User registered successfully",
                        ID: request.body.ID
                    });
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.post("/login", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("student_management");
        requiredKeys = ["email", "password"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let isPresentStudents = await db
                .collection("students")
                .findOne({
                    email: request.body.email
                });
            let isMentorPresent = await db
                .collection("mentors")
                .findOne({
                    email: request.body.email
                });
            if (isMentorPresent && bcrypt.compareSync(request.body.password, isMentorPresent.password)) {
                response.status(202).json({
                    msg: "Login success"
                });
            } else if (isPresentStudents && bcrypt.compareSync(request.body.password, isPresentStudents.password)) {
                response.status(202).json({
                    msg: "Login success"
                });
            } else if ((isMentorPresent && !bcrypt.compareSync(request.body.password, isMentorPresent.password)) ||
                (isPresentStudents && !bcrypt.compareSync(request.body.password, isPresentStudents.password))) {
                response.status(401).json({
                    msg: "Wrong Password"
                });
            } else {
                response.status(404).json({
                    msg: "User Not Found"
                });
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }

});

app.post("/assign-mentor", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("student_management");
        requiredKeys = ["mentorId", "studentId", "mentorName"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let mentorId = request.body.mentorId
            let studentId = request.body.studentId
            let mentorName = request.body.mentorName
            let isMentorPresent = await db
                .collection("mentors")
                .findOne({
                    ID: mentorId
                });
            console.log(isMentorPresent)
            let isStudentPresent = await db
                .collection("students")
                .findOne({
                    ID: studentId
                });
            if (!isMentorPresent) { response.status(404).json({ "msg": "Mentor not found" }) }
            else if (!isStudentPresent) { response.status(404).json({ "msg": "Student not found" }) }
            else {
                let result = await db.collection("students").findOneAndUpdate({ ID: studentId }, { $set: { mentorId: mentorId, mentorName: mentorName } });
                if (result.lastErrorObject.updatedExisting) {
                    response.status(202).json({ "msg": "Student " + studentId + " assigned successfully to " + mentorName })
                } else {
                    response.status(406).json({ "msg": "Assignment failed" })
                }
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});


app.post("/update-mentor", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("student_management");
        requiredKeys = ["mentorId", "studentId", "mentorName"];
        Keys = Object.keys(request.body)
        if (requiredKeys.every((key) => Keys.includes(key)) && (Keys.length === requiredKeys.length)) {
            let mentorId = request.body.mentorId
            let studentId = request.body.studentId
            let mentorName = request.body.mentorName
            let isMentorPresent = await db
                .collection("mentors")
                .findOne({
                    ID: mentorId
                });
            console.log(isMentorPresent)
            let isStudentPresent = await db
                .collection("students")
                .findOne({
                    ID: studentId
                });
            if (!isMentorPresent) { response.status(404).json({ "msg": "Mentor not found" }) }
            else if (!isStudentPresent) { response.status(404).json({ "msg": "Student not found" }) }
            else {
                let result = await db.collection("students").findOneAndUpdate({ ID: studentId }, { $set: { mentorId: mentorId, mentorName: mentorName } });
                if (result.lastErrorObject.updatedExisting) {
                    response.status(202).json({ "msg": "Student " + studentId + " updated successfully to " + mentorName })
                } else {
                    response.status(406).json({ "msg": "Updation failed" })
                }
            }
        } else {
            response.status(406).json({
                msg: "Required details not found"
            });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});


app.listen(port, () => {
    console.log(`Your app is running with port ${port}`);
});