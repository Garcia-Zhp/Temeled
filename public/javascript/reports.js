function setReportsPage(){
    setMenu();
    getReports_Patient();
}

function setPatientViewReport() {
    setMenu();
    renderReport();
}

function setProviderPatientList(){
    setMenu();
    renderPatients();
}


function renderPatients() {
    let email = getUserEmail()
    let extension = getUserType();
    let ext_handler = "";
    if (extension === "provider") {
        ext_handler = "provider";
    }
    const data_email = {
        Email: email,

    };
    fetch(`http://localhost:${port}/${ext_handler}/contacts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_email),
    })
        .then(response => response.json())
        .then(data => {
            if (data.patients) {
                renderPatientList(data.patients);
            } else {
                console.log(data.error);
                renderPatientList(data.PID, null);
            }
        })
}

function renderPatientList(contacts) {
    //sorts the patient list by last name
    function GetSortOrder(prop) {
        return function(a, b) {
            if (a[prop] > b[prop]) {
                return 1;
            } else if (a[prop] < b[prop]) {
                return -1;
            }
            return 0;
        }
    }

    contacts.sort(GetSortOrder("LastName"));

    let x = document.getElementById("reports-feed");
    for(let i = 0; i < contacts.length;i++){
        let new_report = document.createElement('div');
        new_report.className = "reports-card card";
        new_report.addEventListener("click", event =>{
            sessionStorage.setItem('email', contacts[i].Email);
            sessionStorage.setItem('patientName', contacts[i].LastName + ", " + contacts[i].FirstName);
            window.location.href = "provider_view_patient_reports.html";
        });

        new_report.innerHTML = `
        <div class="card-header">
            ${contacts[i].LastName + ", " + contacts[i].FirstName}
        </div>
        <ul class="list-group list-group-flush">
        <li class="list-group-item">Date Of Birth: ${contacts[i].DateOfBirth}</li>
        <li class="list-group-item">Patient ID:  ${contacts[i].personal_ID}</li>
        
        </ul>`;

        x.appendChild(new_report);
    }
}

function openPatient() {
    document.getElementById('patientName').innerHTML = sessionStorage.getItem('patientName');

    let email = sessionStorage.getItem('email');
    setMenu();

    const data_email = {
        Email: email,
    };

    fetch(`http://localhost:${port}/patient/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_email),
    })
        .then(response => response.json())
        .then(data => {
            renderReportsList(data.reports);
        })
}


function renderReportsList(list) {
    let x = document.getElementById("reports-feed");
    for(let i = list.length - 1; i >= 0; i--){
        let new_report = document.createElement('div');
        new_report.className = "reports-card card";
        new_report.addEventListener("click", event =>{
            sessionStorage.setItem('report_id', list[i].report_id);
            openReport();
        });

        new_report.innerHTML = `
        <div class="card-header">
            ${convertTime(list[i].report_date)}
        </div>
        <ul class="list-group list-group-flush">
        <li class="list-group-item"> Report ID: ${list[i].report_id}</li>
        <li class="list-group-item">Provider: Dr. ${list[i].provider_lname}</li>
        
        </ul>`;

        x.appendChild(new_report);

    }
}


function getReports_Patient() {
    let email = getUserEmail();

    const data_email = {
        Email: email,
    };

    fetch(`http://localhost:${port}/patient/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_email),
    })
        .then(response => response.json())
        .then(data => {
            renderReportsList(data.reports);
        })
}

function convertTime(timestamp){
    let today = new Date();
    let tempDate = new Date(timestamp);
    tempDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds(), today.getMilliseconds());
    let dateString = "";
    if(today.getTime() === tempDate.getTime()){
        dateString = "Today at ";
    }
    else if(today.getTime() - 86400000 === tempDate.getTime()){
        dateString = "Yesterday at ";
    }
    else{
        dateString = `${tempDate.toDateString()} at `
    }
    
    let actualDate = new Date(timestamp);
    let hours = actualDate.getHours();
    if(hours > 12){
        if(actualDate.getMinutes() < 10) dateString += `${hours - 12}:${"0" + actualDate.getMinutes()} PM`;
        else dateString += `${hours - 12}:${actualDate.getMinutes()} PM`;
    }
    else if(hours == 12){
        if(actualDate.getMinutes() < 10) dateString += `${hours}:${"0" + actualDate.getMinutes()} PM`;
        else dateString += `${hours}:${actualDate.getMinutes()} PM`;
    }
    else{
        if(actualDate.getMinutes() < 10) dateString += `${hours}:${"0" + actualDate.getMinutes()} AM`;
        else dateString += `${hours}:${actualDate.getMinutes()} AM`;
    }

    return dateString;
}


function openReport() {
    window.location = `http://localhost:${port}/views/patient_viewReport.html`;
}

function renderReport() {
    let report_id = sessionStorage.getItem('report_id');

    const data_report = {
        Report_id: report_id
    }
    fetch(`http://localhost:${port}/patient/view_report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_report),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let x = document.getElementById('main-header');
            let title = document.createElement('p');
            

            title.innerHTML = "Report: " + data.report_info[0].first_name + " " + data.report_info[0].last_name + " - " + convertTime(data.report_info[0].report_date);
            x.appendChild(title);

            document.getElementById('pID').value = data.report_info[0].patient_id;
            document.getElementById('fName').value = data.report_info[0].first_name;
            document.getElementById('lName').value = data.report_info[0].last_name;
            document.getElementById('dob').value = data.report_info[0].birthdate;
            document.getElementById('age').value = data.report_info[0].age;
            document.getElementById('gender').value = data.report_info[0].gender;
            document.getElementById('phone').value = data.report_info[0].Phone;
            document.getElementById('heightFT').value = data.report_info[0].height_ft;
            document.getElementById('heightIN').value = data.report_info[0].height_in;
            document.getElementById('weight').value = data.report_info[0].weight;
            document.getElementById('race').value = data.report_info[0].race;
            document.getElementById('intTravel').value = data.report_info[0].int_travel;
            document.getElementById('insProvider').value = data.report_info[0].Insurance;
            document.getElementById('policyNumber').value = data.report_info[0].PolicyNumber;
            document.getElementById('notes').value = data.report_info[0].notes;
        })
}

