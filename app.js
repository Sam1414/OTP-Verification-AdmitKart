const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
var axios = require('axios');
var FormData = require('form-data');
// var alert = require('alert');
var JSAlert = require("js-alert");

// Using Body Parse
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var phoneNo;
var otp_id;
// Getting User Mobile Number
app.post("/enterPN", async function (req, res) {
    phoneNo = req.body.number;
    console.log('Phone No.: ', phoneNo);
    if (phoneNo.length === 13 && phoneNo.charAt(0) === '+') {
        otp_id = await send_otp(phoneNo);
        console.log('Otp ID: ' + otp_id);
        res.redirect('/enterOtp');
    }
    else {
        console.log('Invalid Phone No.');
        // window.alert('Invalid Phone Number');
        // alert("Invalid Phone Number", "Re-Enter", "GOT IT");
        res.redirect('/ReEnterPN');
    }
});

app.get('/ReEnterPN', function (req, res) {
    res.send('<script>window.alert(\'Invalid Phone Number\');</script><h2>Re-Enter Your Phone Number</h2><form action = "/enterPN" method = "POST"><input name="number" id="num" type="tel"><br><br></input><input type="Submit"></input></form>');
});

app.get('/enterOtp', function (req, res) {
    res.send('<h1>Enter Otp:</h1><form action="/otpVerify" method="POST"><input name = "number" id = "num" type = "tel" ></input><br><br><input type="Submit"></input></form >');
});

app.post("/otpVerify", async function (req, res) {
    var user_otp = req.body.number;
    console.log('user_otp: ', user_otp);
    if (user_otp.length === 6 && !isNaN(user_otp)) {
        var result = await verify_otp(otp_id, user_otp);
        console.log('result:', result);
        // console.log('result.data: ', result.data);
        if (result === "success") {
            res.send('Correct Otp Entered, Verification Successful');
        }
        else if (result === "failed") {
            res.redirect('/reEnterOtp');
        }
    }
    else {
        console.log("Otp Format is Invalid!: " + user_otp);
        res.redirect('/reEnterOtp');
    }
});

app.get('/reEnterOtp', function (req, res) {
    res.send('<h1>Re Enter Otp:</h1><h2>Your Otp is invalid. It should be a 6 digit numric value</h2><form action="/otpReverify" method="POST"><input name = "number" id = "num" type = "tel" ></input><br><br><input type="Submit"></input></form >');
});

app.post('/otpReverify', async function (req, res) {
    var user_otp = req.body.number;
    console.log('user_otp: ', user_otp);
    if (user_otp.length === 6 && !isNaN(user_otp)) {
        var result = await verify_otp(otp_id, user_otp);
        console.log('result:', result);
        if (result === "success") {
            res.send('Correct Otp Entered, Verification Successful');
        }
        else if (result === "failed") {
            res.redirect('/reEnterOtp');
        }
    }
    else {
        res.redirect('/reEnterOtp');
    }
});

async function send_otp(phoneNum) {
    // Data to send to the D7 API
    var data = new FormData();
    data.append('mobile', String(phoneNum));
    data.append('message', 'Your otp is {code}');
    data.append('expiry', '900');

    var config = {
        method: 'post',
        url: 'https://d7networks.com/api/verifier/send',
        headers: {
            'Authorization': 'Token ed23282e37833c016bd6a82aa0919bf7dcb1e3fb',
            ...data.getHeaders()
        },
        data: data
    };

    await axios(config).then(function (response) {
        console.log(JSON.stringify(response.data));
        otp_id = response.data.otp_id;
        // console.log(response.data.otp_id);
    }).catch(function (error) {
        console.log(error);
    });

    return otp_id;
}


async function verify_otp(otpId, user_otp) {

    var result;
    // Verification
    var data = new FormData();
    data.append('otp_id', String(otpId));
    data.append('otp_code', String(user_otp));

    var config = {
        method: 'post',
        url: 'https://d7networks.com/api/verifier/verify',
        headers: {
            'Authorization': 'Token ed23282e37833c016bd6a82aa0919bf7dcb1e3fb',
            ...data.getHeaders()
        },
        data: data
    };

    await axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            result = response.data.status;
            console.log(result);
        })
        .catch(function (error) {
            console.log(error);
        });
    return result;
}


// To give Time and Date of runtime of server
app.use(function (req, res, next) {
    console.log(`${new Date()} = ${req.method} request for ${req.url}`);
    next();
});

// Display default HTML file
app.use(express.static("./static"));

// // Error Handling 1
// app.use((req, res, next) => {
//     const error = new Error('Not Found');
//     error.status = 404;
//     next(error);
// });
// // Error Handling 2
// app.use((error, req, res, next) => {
//     res.status(error.status || 500);
//     res.json({
//         error: {
//             message: error.message
//         }
//     });
// });

// function checkPhoneNo(phoneNo) {
//     if (phoneNo.length == 10) {
//         return true;
//     }
// }

// Function to generate OTP 
function generateOTP() {
    // Declare a digits variable  
    // which stores all digits 
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

module.exports = app;