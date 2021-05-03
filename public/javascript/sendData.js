let port = 3607;

function sendLogin() {
    let uname = document.getElementById("uname").value;
    let pwd = document.getElementById("psw").value;
    log(uname, pwd);
}

function log(uname, pwd) {
    let indexOfAt = uname.indexOf("@");
    let indexOfDot = uname.indexOf(".", indexOfAt);
    let extension = String(uname.substring(indexOfAt + 1, indexOfDot));
    const data_login = {Email: uname, Password: pwd};
    fetch(`http://localhost:${port}/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_login),
    })
        .then(response => response.json())
        .then(data => {

            if (data.message.split("-")[0] === "valid") {
                if (data.message.split("-")[1] === "patient") {
                    patientLogin(uname + "-" + data.message.split("-")[2]);
                }
                if (data.message.split("-")[1] === "provider") {
                    providerLogin(uname + "-" + data.message.split("-")[2]);
                }
            } else if (data.message === "invalid") {
                window.alert("Invalid username or password");
            } else {
                window.alert(data.error);
            }
        })
}

 	function sendRegister() {

	    let uname_reg = document.getElementById("email").value;
	    let pwd_reg = document.getElementById("password").value;
	    let pwd2_reg = document.getElementById("confirmPwd").value;
	    let phone_reg = document.getElementById("phone").value;
	    let fname = document.getElementById("fname").value;
	    let lname = document.getElementById("lname").value;
	    let dob = document.getElementById("dob").value;
	    let address = document.getElementById("address").value;
	    let insurance = document.getElementById("insurance").value;
	    let policyNum = document.getElementById("policyNum").value;
	    let gender = document.getElementById("gender").value;

	    const data_reg = {
	        Email: uname_reg,
	        Password: pwd_reg,
	        Password2: pwd2_reg,
	        Phone: phone_reg,
	        FirstName: fname,
	        LastName: lname,
	        DoB: dob,
	        Address: address,
	        Insurance: insurance,
	        PolicyNum: policyNum,
	        Gender: gender

	    };
	    console.log(data_reg);
	    fetch(`http://localhost:${port}/register`, {
	        method: 'POST',
	        headers: {
	            'Content-Type': 'application/json',
	        },
	        body: JSON.stringify(data_reg),
	    })
	        .then(response => response.json())
	        .then(data => {
	            if (data.message) {
	                log(uname_reg, pwd_reg)
	                // window.location = `http://localhost:${port}/views/Login.html`;

	            } else {
	                document.getElementById("errorbox").innerHTML = data.error;
	                //window.alert(data.error);
	            }
	        })
	}

function getProviders() {
    fetch(`http://localhost:${port}/admin`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            console.log(data[0].Address)
        })
}


function logOut() {
    deleteCookie("OwlMedLoginSession");
    window.location.href = "Login.html";
}


//creates the cookie with the tag Provider-'userID' and goes to the main menu
function providerLogin(userID) {
    let value = "provider-" + userID;
    setCookie("OwlMedLoginSession", value);
    window.location = `http://localhost:${port}/views/activityMenu.html`;

}


//creates the cookie with the tag Patient-'userID' and goes to the main menu
function patientLogin(userID) {
    let value = "patient-" + userID;
    setCookie("OwlMedLoginSession", value)
    window.location = `http://localhost:${port}/views/activityMenu.html`;
}

function registerPage(){
    window.location = `http://localhost:${port}/views/Register.html`;
}


//todo, set it so that the cookie is done by domain instead of generic path if this is going to be a webapp
//sets the cookie when given a name and value, name in this case is always OwlMedLoginSession


//returns the value of the cookie with the given name
function getCookie(name) {
    let nameVal = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let s = ca[i];
        s.trim(); //removes any possible weird spaces at front/back
        if (s.indexOf(nameVal) === 0) return s.substring(nameVal.length, s.length); //returns the content of the cookie
    }
    return null; //returns null if cookie not found
}


//deletes the cookie for the login session
function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}


function setCookie(name, value) {
    document.cookie = name + "=" + (value || "") + "; path=/";
}


function getUserType() {
    return (getCookie("OwlMedLoginSession").split("-")[0]);
}

function getUserEmail() {
    return (getCookie("OwlMedLoginSession").split("-")[1]);
}


function setMenu() {
    try {
        let name = getCookie("OwlMedLoginSession").split('-')[2];

        if (getUserType() === "provider") {
            document.getElementById("helloNameElement").innerHTML = `Hello<br>Dr. ${name}`;
            document.getElementById("reportsButton").setAttribute("onclick",
                "location.href='provider_patient_list.html'");
        } else if (getUserType() === "patient") {
            document.getElementById("helloNameElement").innerHTML = "Hello " + name;
            document.getElementById("reportsButton").setAttribute("onclick",
                "location.href='patient_reports.html'");
        }
    } catch (e) { //if it fails to find a login cookie, it kicks the user to the login page
        window.location.href = "Login.html";
    }
}
