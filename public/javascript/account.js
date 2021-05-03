function setAccountPage() {
    setMenu();
    populatePersonalAccount();

}

function populatePersonalAccount() {
    let email = getUserEmail();

    const data_account = {
        Email: email,
    };

    fetch(`http://localhost:${port}/populateAccount`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_account),
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                let extension = getUserType();

                document.getElementById('fname').value = data.Result[0].FirstName;
                document.getElementById('lname').value = data.Result[0].LastName;
                document.getElementById('dob').value = data.Result[0].DateOfBirth;
                document.getElementById('gender').value = data.Result[0].Gender;
                document.getElementById('address').value = data.Result[0].Address;
                document.getElementById('phone').value = data.Result[0].Phone;
                document.getElementById('insurance').value = data.Result[0].Insurance;
                document.getElementById('policyNum').value = data.Result[0].PolicyNumber;
                document.getElementById('currentEmail').value = email;
                document.getElementById('currentEmail').disabled = true;

                if (extension === 'provider') {
                    document.getElementById('insurance').disabled = true;
                    document.getElementById('policyNum').disabled = true;
                }
            } else {
                window.alert(data.error);
            }
        })
}


function updatePersonal() {
    let email = getUserEmail()
    let phone_reg = document.getElementById("phone").value;
    let address = document.getElementById("address").value;
    let insurance = document.getElementById("insurance").value;
    let policyNum = document.getElementById("policyNum").value;
    let gender = document.getElementById("gender").value;

    const data_reg = {
        Email: email,
        Phone: phone_reg,
        Address: address,
        Insurance: insurance,
        PolicyNum: policyNum,
        Gender: gender
    };

    fetch(`http://localhost:${port}/updatePersonal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_reg),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log(data.message);

            } else {
                document.getElementById("errorbox").innerHTML = data.error;
                //window.alert(data.error);
            }
        })
}

function updatePwd() {
    let email = getUserEmail();
    let currentPwd = document.getElementById("psw").value;
    let password = document.getElementById("password").value;
    let password2 = document.getElementById("confirmPassword").value;

    const data_reg = {
        Email: email,
        CurrentPwd: currentPwd,
        Password: password,
        Password2: password2
    };
    console.log(data_reg);
    fetch(`http://localhost:${port}/updatePwd`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_reg),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                window.alert("Successfully changed password!");

            } else {

                console.log(data.error);
                //window.alert(data.error);
            }
        })
}

function updateEmail() {
    let currentEmail = getUserEmail();
    let email = document.getElementById("email").value;

    const data_reg = {
        CurrentEmail: currentEmail,
        Email: email
    };
    fetch(`http://localhost:${port}/updateEmail`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_reg),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                window.alert("Successfully changed email! \nYou will be redirected to the log in screen.");
                logOut()
            } else {
                //document.getElementById("errorbox").innerHTML = data.error;
                window.alert(data.error);
            }
        })
}