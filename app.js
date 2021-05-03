/**/
var mysql = require('mysql2');
var express = require("express");
var cors = require("cors");
var app = express();
var dotenv = require('dotenv');
var path = require('path');
const bodyParser = require("body-parser");
var AWS = require('aws-sdk');
var uuid = require('uuid');
var fs = require('fs');
const upload = require('express-fileupload');

const ID = 'AKIAZGVSJ2E4INVLFOWF';
const SECRET = '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';
const BUCKET_NAME = 'owlmed-test';

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

app.use(cors());
app.use(express.json());

app.set('views', path.join(__dirname, '/public/views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.use(upload());
dotenv.config({path: './.env'});
var port = process.env.PORT;

var pool = mysql.createPool({
    database: process.env.DATABASE,
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get("/", (req, res) => {
    res.render('login');
});

app.post("/authenticate", (req, res) => {
    let email = req.body.Email;
    let password = req.body.Password;

    let indexOfAt = email.indexOf("@");
    let indexOfDot = email.indexOf(".", indexOfAt);
    let extension = String(email.substring(indexOfAt + 1, indexOfDot));
    //console.log(req);
    if (!email || !password) {
        res.json({error: "Please provide an email or password"});
    } else {
        pool.query("SELECT * FROM credentials WHERE Email = ? AND Password = ?", [email, password], (err, rowDataResult) => {
            if (err) {
                res.json({error: err + "Unable to connect to the database. Please try again later."});
            }
            if (rowDataResult.length === 0) {
                res.json({
                    message: "invalid",
                    ext: extension
                });
            } else {
                if (extension === 'provider') {
                    res.json({message: "valid-" + rowDataResult[0].Extension + "-" + rowDataResult[0].LastName});
                } else {
                    res.json({message: "valid-" + rowDataResult[0].Extension + "-" + rowDataResult[0].FirstName});
                }

            }
        });
    }
});


app.post("/register", (req, res) => {
    let email = req.body.Email;
    let password = req.body.Password;
    let password2 = req.body.Password2;
    let phone = req.body.Phone;
    let fname = req.body.FirstName;
    let lname = req.body.LastName;
    let dob = req.body.DoB;
    let address = req.body.Address;
    let insurance = req.body.Insurance;
    let policyNum = req.body.PolicyNum;
    let gender = req.body.Gender;

    var reg_phone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    var reg_name = /^[A-Za-z]+$/;


    if (!email || !password || !phone || !fname || !lname || !dob || !password2 || !address || !gender) {
        res.json({error: "Please fill in all values below"});
    } else if (password !== password2) {
        res.json({error: "Passwords do not match"});
    } else if (!reg_phone.test(phone)) {
        res.json({error: "Invalid phone number"});
    } else if (!reg_name.test(fname) || !reg_name.test(lname)) {
        res.json({error: "Invalid first or last name"});
    } else {
        let indexOfAt = email.indexOf("@");
        let indexOfDot = email.indexOf(".", indexOfAt);
        let emailExtension = email.substring(indexOfAt + 1, indexOfDot);
        let extension = "patient";

        if (indexOfAt === -1 || indexOfAt === 0 || indexOfDot <= indexOfAt ||
            emailExtension.length === 0 || (emailExtension === "provider")) {
            res.json({error: "Invalid email address"});
        } else {
            pool.query("INSERT INTO credentials (Email, Password, Extension, Phone, FirstName, LastName, DateOfBirth, Address, Insurance, PolicyNumber, Gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [email, password, extension, phone, fname, lname, dob, address, insurance, policyNum, gender], (err, result) => {
                if (err) {
                    res.json({error: "Unable to register user"});
                } else {
                    res.json({message: "successfully added user"});
                }
            });
        }
    }
});

app.post("/patient/contacts", (req, res) => {
    let email = req.body.Email;
    if (!email) {
        res.json({error: "Missing email"});
    }
    pool.query("SELECT personal_ID FROM credentials WHERE Email = ?", [email], (err, result1) => {
        if (err) {
            res.json({error: err});
        } else {
            let pid = result1[0].personal_ID;
            pool.query("SELECT DISTINCT personal_ID, c.FirstName, c.LastName, c.Extension FROM appointments a INNER JOIN credentials c on a.doctor_id = c.personal_id AND a.patient_id = ? AND a.Status = 'accepted'", [pid], (err, result2) => {
                if (err) {
                    res.json({error: err});
                } else {

                    res.json({PID: pid, providers: result2});
                }
            });
        }
    });
});

app.post("/provider/contacts", (req, res) => {
    let email = req.body.Email;
    if (!email) {
        res.json({error: "Missing email"});
    }
    pool.query("SELECT personal_ID FROM credentials WHERE Email = ?", [email], (err, result1) => {
        if (err) {
            res.json({error: err});
        } else {
            let pid = result1[0].personal_ID;
            pool.query("SELECT DISTINCT personal_ID, c.FirstName, c.LastName, c.DateOfBirth, c.Email, c.Extension FROM appointments a INNER JOIN credentials c on a.patient_id = c.personal_id AND a.doctor_id = ? AND a.Status = 'accepted'", [pid], (err, result2) => {
                if (err) {
                    res.json({error: err});
                } else {

                    res.json({PID: pid, patients: result2});
                }
            });
        }
    });
});

app.post("/get/messages", (req, res) => {
    let receiverID = req.body.receiverID;
    let senderID = req.body.senderID;
    if (!receiverID || !senderID) {
        res.json({error: "Missing one or more fields"});
    }
    pool.query("SELECT * FROM messages WHERE (sender = ? AND receiver = ?) or (sender = ? AND receiver = ?) ORDER BY sent_at ASC", [senderID, receiverID, receiverID, senderID], (err, result) => {
        if (err) {
            res.json({error: err});
        } else {
            res.json({messages: result});
        }
    });
});

app.post("/send/messages", (req, res) => {
    let receiverID = req.body.Receiver;
    let senderID = req.body.Sender;
    let message = req.body.Message;

    if (!receiverID || !senderID || !message) {
        res.json({error: "Missing one or more fields"});
    }

    pool.query("INSERT INTO messages (receiver, sender, message) VALUES (?, ?, ?)", [receiverID, senderID, message], (err, result) => {
        if (err) {
            res.json({error: err + ": Unable to send message."});
        } else {
            res.json({message: "Sent message!"});
        }
    });

});

app.post("/notification", (req, res) => {
    let senderID = req.body.Sender;
    let receiverID = req.body.Receiver;

    if (!receiverID || !senderID) {
        res.json({error: "Missing"});
    }
    pool.query("UPDATE messages SET has_read = 'true' WHERE (receiver = ? and sender = ?)", [receiverID, senderID], (err, result) => {
        if (err) {
            res.json({error: err});

        } else {
            res.json({message: result});
        }
    })


})

app.get("/videos", (req, res) => {
    pool.query('SELECT video_name, video_description, videoURL FROM videos', (err, rowDataResult) => {
        if (err) {
            res.json({error: err + "Unable to connect to the database. Please try again later."});
        }
        res.json(rowDataResult);
    })
})

app.post("/patient/appointments", (req, res) => {

    let email = req.body.Email;
    if (!email) {
        res.json({error: "Missing email"});
    }
    pool.query("SELECT personal_ID FROM credentials WHERE Email = ?", [email], (err, result1) => {
        if (err) {
            res.json({error: err});
        } else {
            let pid = result1[0].personal_ID;
            pool.query("select * from appointments where patient_id = ? ORDER BY Date,Time", [pid], (err, result) => {
                res.json({patient_appointments: result})

            })
        }
    });

})
app.post("/provider/appointments", (req, res) => {

    let email = req.body.Email;
    if (!email) {
        res.json({error: "Missing email"});
    }
    pool.query("SELECT personal_ID FROM credentials WHERE Email = ?", [email], (err, result1) => {
        if (err) {
            res.json({error: err});
        } else {
            let pid = result1[0].personal_ID;
            pool.query("select * from appointments where doctor_id = ? ORDER BY Date,Time", [pid], (err, result) => {
                res.json({provider_appointments: result})
            })
        }
    });
})
app.post("/provider/getAppointment", (req, res) => {
    let id = req.body.Appointment_id;
    if (!id) {
        res.json({error: "Missing appointment Id"});
    }
    pool.query("select * from appointments where appointment_id = ? ORDER BY Date,Time", [id], (err, result) => {
        if (err) {
            res.json({error: err});
        } else {
            res.json({provider_getAppointment: result})
        }
    });
})
app.post("/provider/getAppointmentEmail", (req, res) => {
    let id = req.body.Patient_ID;
    if (!id) {
        res.json({error: "Missing appointment Id"});
    }
    pool.query("select Email from credentials where personal_ID = ?", [id], (err, result) => {
        if (err) {
            res.json({error: err});
        } else {
            res.json({get_Email: result})
        }
    });
})

app.post("/patient/reports", (req, res) => {
    let email = req.body.Email;
    if (!email) {
        res.json({error: "Missing email"});
    }
    pool.query("SELECT personal_ID FROM credentials WHERE Email = ?", [email], (err, result1) => {
        if (err) {
            res.json({error: err});
        } else {
            let pid = result1[0].personal_ID;
            pool.query('SELECT report_id, report_date, provider_lname, provider_id FROM reports where patient_id = ?', [pid], (err, rowDataResult) => {
                if (err) {
                    res.json({error: err});
                } else {
                    res.json({reports: rowDataResult});
                }
            })
        }
    })
});

app.post("/provider/reports", (req, res) => {
    let email = req.body.Email;
    if (!email) {
        res.json({error: "Missing email"});
    }
    pool.query("SELECT personal_ID FROM credentials WHERE Email = ?", [email], (err, result1) => {
        if (err) {
            res.json({error: err});
        } else {
            let pid = result1[0].personal_ID;
            pool.query('SELECT report_id, report_date, first_name, last_name, patient_ID FROM reports where provider_id = ?', [pid], (err, rowDataResult) => {
                if (err) {
                    res.json({error: err});
                } else {
                    res.json({reports: rowDataResult});
                }
            })
        }
    })
});

app.post("/patient/view_report", (req, res) => {
    let report_id = req.body.Report_id;
    pool.query("SELECT * FROM reports where report_id = ?", [report_id], (err, result) => {
        if (err) {
            res.json({error: err});
        } else {

            res.json({report_info: result});
        }

    })

})


app.post("/createReport", (req, res) => {

    let pid = req.body.Pid;
    let fname = req.body.Fname;
    let lname = req.body.Lname;
    let dob = req.body.Dob;
    let age = req.body.Age;
    let gender = req.body.Gender;
    let height_ft = req.body.Height_ft;
    let height_in = req.body.Height_in;
    let weight = req.body.Weight;
    let race = req.body.Race;
    let int_travel = req.body.Int_travel;
    let notes = req.body.Notes;
    let provider_email = req.body.Provider_email;
    let Phone = req.body.Phone;
    let Insurance = req.body.InsProvider;
    let PolicyNumber = req.body.PolNumber;
    let report_date = req.body.ReportDate;

    var reg_name = /^[A-Za-z]+$/;
    var date_regex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!pid || !fname || !lname || !dob || !age || !gender || !height_ft || !height_in || !weight || !race || !int_travel || !notes || !Phone || !report_date) {
        res.json({error: "Please fill in all mandatory values below"});
    } else if (age < 0 || age > 200) {
        res.json({error: "Please enter a valid age"});
    } else {
        pool.query("select personal_ID, LastName from credentials where Email = ?", [provider_email], (err, provider_results) => {
            if (err) {
                res.json({error: err})
            } else {

                const provider_pid = provider_results[0].personal_ID;
                const provider_lname = provider_results[0].LastName;

                pool.query("insert into reports (patient_id, first_name, last_name, birthdate, age, gender, height_ft, height_in, weight, race, int_travel, report_date, provider_lname, notes, provider_id, Phone, Insurance, PolicyNumber) values (?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [pid, fname, lname, dob, age, gender, height_ft, height_in, weight, race, int_travel, report_date, provider_lname, notes, provider_pid, Phone, Insurance, PolicyNumber], (err, result) => {
                    if (err) {
                        res.json({error: err});
                    } else {
                        res.json({message: "success"});
                    }
                })
            }
        });
    }
})

app.post("/updatePersonal", (req, res) => {
    let email = req.body.Email;
    let phone = req.body.Phone;

    let address = req.body.Address;
    let insurance = req.body.Insurance;
    let policyNum = req.body.PolicyNum;
    let gender = req.body.Gender;

    var reg_phone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    var reg_name = /^[A-Za-z]+$/;


    pool.query("UPDATE credentials set Phone = ?, Address = ?, Insurance = ?, PolicyNumber = ?, Gender = ? WHERE (Email = ?)", [phone, address, insurance, policyNum, gender, email], (err, result) => {
        if (err) {
            res.json({error: "Unable to register user"});
        } else {
            res.json({message: "successfully updated information"});
        }
    });

});

app.post("/updatePwd", (req, res) => {
    let email = req.body.Email;
    let currentPwd = req.body.CurrentPwd;
    let password = req.body.Password;
    let password2 = req.body.Password2;

    if (!currentPwd || !password || !password2) {
        res.json({error: "Please fill in all values below"});
    } else {
        pool.query("Select Password from credentials where Email = ?", [email], (err, result1) => {
            let old_pw = result1[0].Password;
            if (currentPwd !== old_pw) {
                res.json({error: "Current Password is incorrect"});
            } else if (password !== password2) {
                res.json({error: "Passwords do not match"});
            } else {
                pool.query("update credentials set Password = ? WHERE (email = ?)", [password, email], (err, result) => {
                    if (err) {
                        res.json({error: "Unable to register user"});
                    } else {
                        res.json({message: "successfully added user"});
                    }
                });
            }
        })


    }
});

app.post("/updateEmail", (req, res) => {
    let currentEmail = req.body.CurrentEmail;
    let email = req.body.Email;

    if (!email) {
        res.json({error: "Please fill in all values below"});
    } else {
        let indexOfAt = email.indexOf("@");
        let indexOfDot = email.indexOf(".", indexOfAt);
        let extension = email.substring(indexOfAt + 1, indexOfDot);

        if (indexOfAt === -1 || indexOfAt === 0 || indexOfDot <= indexOfAt ||
            extension.length === 0 || (extension === "provider") || currentEmail.substring(indexOfAt + 1, indexOfDot)) {
            if (currentEmail.substring(indexOfAt + 1, indexOfDot)) res.json({error: "Please speak to a system Administrator to change your email."})
            res.json({error: "Invalid email address"});
        } else {
            pool.query("UPDATE credentials SET Email = ? WHERE (email = ?)", [email, currentEmail], (err, result) => {
                if (err) {
                    res.json({error: "Unable to update email"});
                } else {
                    res.json({message: "successfully updated email"});
                }
            });
        }
    }
});

app.post("/populateAccount", (req, res) => {
    let email = req.body.Email;

    pool.query("select personal_ID, DateOfBirth, Address, Phone, FirstName, LastName, Gender, Insurance, PolicyNumber from credentials where Email = ?", [email], (err, results) => {
        if (err) {
            res.json({error: err});
        } else {
            res.json({Result: results});
        }
    });
});

app.get("/providers", (req, res) => {
    pool.query(`SELECT personal_ID as doctor_ID, LastName
                FROM credentials
                where Extension = 'provider'`, (err, rowDataResult) => {
        if (err) {
            res.json({error: err + "Unable to connect to the database. Please try again later."});
        } else {
            res.json({providers: rowDataResult});
        }
    })
})

app.post("/get/info", (req, res) => {
    let email = req.body.Email;
    if (!email) {
        res.json({error: "missing email"});
    } else {
        pool.query("select personal_ID, FirstName, LastName from credentials where Email = ?", [email], (err, results) => {
            if (err) {
                res.json({error: err});
            } else {
                res.json({info: results});
            }
        });
    }
})

app.post("/get/appointments", (req, res) => {

    let doctor_id = req.body.doctor_id;
    let date = new Date(req.body.date);
    if (!doctor_id || !date) {
        res.json({error: "Missing one or more fields"});
    } else {
        let dateString = date.toISOString().split('T')[0];
        pool.query("SELECT * FROM appointments WHERE doctor_id = ? AND Date = ? ORDER BY Time", [doctor_id, dateString], (err, result1) => {
            if (err) {
                res.json({error: err});
            } else {
                res.json({appointments: result1});
            }
        });
    }
})

app.post("/add/appointment", (req, res) => {
    let FirstName = req.body.FirstName;
    let LastName = req.body.LastName;
    let Reason = req.body.Reason;
    let Comments = req.body.Comments;
    let patient_id = req.body.patient_id;
    let doctor_id = req.body.doctor_id;
    let Time = req.body.Time;
    let apptDate = req.body.apptDate;
    let physician = req.body.physician;
    if (!FirstName || !LastName || !Reason || (!Comments && Comments !== "") || !patient_id || !doctor_id || !Time || !apptDate || !physician) {
        res.json({error: "Missing one or more fields"});
    } else {
        pool.query("INSERT INTO appointments (FirstName, LastName, Reason, Comments, patient_id, doctor_id, Time, Date, Physician) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [FirstName, LastName, Reason, Comments, patient_id, doctor_id, Time, apptDate, physician], (err, result) => {
            if (err) {
                res.json({error: err + ": Unable to submit appointment."});
            } else {
                res.json({message: "Appointment submitted!"});
            }
        });
    }
});

app.post("/update/appointment", (req, res) => {
    let apptID = req.body.appointment_id;
    let status = req.body.status;

    if (!status || !apptID) {
        res.json({error: "Missing one or more fields"});
    } else if (status === "accepted") {
        pool.query("UPDATE appointments set Status = 'accepted' WHERE (appointment_id = ?)", [apptID], (err, result) => {
            if (err) {
                res.json({error: "Unable to update appointment"});
            } else {
                res.json({message: "successfully updated appointment"});
            }
        });
    } else {
        pool.query("DELETE FROM appointments WHERE (appointment_id = ?)", [apptID], (err, result) => {
            if (err) {
                res.json({error: "Unable to delete appointment"});
            } else {
                res.json({message: "successfully deleted appointment"});
            }
        });
    }
});

const uploadFile = (fileName, fileContent) => {
    console.log(fileContent)

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
        if (err) {
            throw err
        }
        console.log(`File uploaded successfully. ${data.Location}`)
    });
};

app.post('/upload/video', async (req, res) => {

    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {

            let video = req.files.video;

            const params = {
                    Bucket: BUCKET_NAME,
                    Key: "uploads/" + video.name,
                    Body: video.data
            };

            // Uploading files to the bucket
            s3.upload(params, function (err, data) {
                if (err) {
                    throw err
                }
                console.log(video)
                res.json({
                    status: true,
                    message: 'File uploaded successfully!',
                    name: video.name,
                    mimetype: video.mimetype,
                    size: video.size

                });
                console.log(`File uploaded successfully. ${data.Location}`)
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});


app.post("/video/upload/s3", async (req, res) => {
    let fn = "uploads/" + req.body.file_name;
    if (fn == null) {
        res.json({error: 'File is null'})
    } else {
        uploadFile(fn);
        res.json({message: 'Upload Successful'})
    }


    fs.unlink(fn, (err) => {
        if (err) {
            console.error(err)

        }

    })
})

app.get("/videos/list", (req, res) => {
    const params = {
        Bucket: BUCKET_NAME// File name you want to save as in S3
    };

// Call S3 to list the buckets
    s3.listObjects(params, function (err, data) {
        if (err) {

        } else {

            res.json({
                videos: data.Contents
            })

        }
    });


})
app.post("/video/delete/s3", (req, res) => {
    let fn = req.body.FN;
    var params = {
        Bucket: BUCKET_NAME,
        Key: "uploads/" + fn

    };

    s3.deleteObject(params, function (err, data) {
        if (err) {
            res.json({error: err})
        } // an error occurred
        else {
            res.json({
                message: 'Successfully deleted video! You will be redirected to video page'
            })
        }              // successful response
    });


})

app.listen(port, () => console.log("Server listening on port " + port));
