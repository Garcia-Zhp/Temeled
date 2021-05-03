function setProviderPatientList() {
    setMenu();
}

function setCreateReport() {
    setMenu();

    const data_email = {
        Email: sessionStorage.getItem('email'),
    };
    fetch(`http://localhost:${port}/populateAccount`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_email),
    })
        .then(response => response.json())
        .then(data => {
            if(data) {
                console.log(data.Result[0]);
                document.getElementById('pID').value = data.Result[0].personal_ID;
                document.getElementById('fName').value = data.Result[0].FirstName;
                document.getElementById('lName').value = data.Result[0].LastName;
                document.getElementById('dob').value = data.Result[0].DateOfBirth;
                document.getElementById('gender').value = data.Result[0].Gender;
                document.getElementById('phone').value = data.Result[0].Phone;
                document.getElementById('insProvider').value = data.Result[0].Insurance;
                document.getElementById('policyNumber').value = data.Result[0].PolicyNumber;
                document.getElementById('age').value = calculateAge(data.Result[0].DateOfBirth);
            }
        })
}

function calculateAge(dob) {
    let year = Number(dob.substr(0, 4));
    let month = Number(dob.substr(5, 2)) - 1;
    let day = Number(dob.substr(8, 2));
    let today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) {
        age--;
    }
    return(age);
}

function sendReport() {
    let pid = document.getElementById("pID").value;
    let fname = document.getElementById("fName").value;
    let lname = document.getElementById("lName").value;
    let dob = document.getElementById("dob").value;
    let age = document.getElementById("age").value;
    let gender = document.getElementById("gender").value;
    let height_ft = document.getElementById("heightFT").value;
    let height_in = document.getElementById("heightIN").value;
    let weight = document.getElementById("weight").value;
    let race = document.getElementById("race").value;
    let int_travel = document.getElementById("intTravel").value;
    let notes = document.getElementById("notes").value;
    let phone = document.getElementById('phone').value;
    let insProvider = document.getElementById('insProvider').value;
    let policyNumber = document.getElementById('policyNumber').value;
    let email = getUserEmail();

    let date = (new Date()).toLocaleDateString() + " " + (new Date().toLocaleTimeString());


    const data_report = {
        Pid: pid,
        Fname: fname,
        Lname: lname,
        Dob: dob,
        Age: age,
        Gender: gender,
        Height_ft: height_ft,
        Height_in: height_in,
        Weight: weight,
        Race: race,
        Int_travel: int_travel,
        Notes: notes,
        Provider_email: email,
        Phone: phone,
        InsProvider: insProvider,
        PolNumber: policyNumber,
        ReportDate: date
    };

    JSON.stringify(data_report)
    fetch(`http://localhost:${port}/createReport`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_report),

    })
        .then(response => response.json())
        .then(data => {
            if(data.message){
                document.getElementById("errorbox").innerHTML = "Success";
                window.location.href = "provider_view_patient_reports.html";
            }else{
                document.getElementById("errorbox").innerHTML = data.error;
            }
        })

}