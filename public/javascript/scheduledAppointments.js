function setScheduledAppts() {
    setMenu();
    getAppointments();
}

function getAppointments() {
    let email = getUserEmail();
    let extension = getUserType();

    if (extension === "provider") {
        ext_handler = "provider";
        let submitButton = document.getElementById("sched-appt-submit")
        if(submitButton){
            submitButton.remove();
        }
    } else if (extension === "patient") {
        ext_handler = "patient";
        document.getElementById("sched-appt-submit").style.display = "";
        let providerView = document.getElementById("provider-app-view").remove();
        if(providerView){
            providerView.remove();
        }
    }
    const data_email = {
        Email: email,

    };
    fetch(`http://localhost:${port}/${ext_handler}/appointments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_email),
    })
        .then(response => response.json())
        .then(data => {

            //console.log(data.patient_appointments);
            if (data.patient_appointments) {
                renderAppointments(data.patient_appointments, extension);
            } else if (data.provider_appointments) {
                renderAppointments(data.provider_appointments, extension);
            } else {
                renderAppointments(null, extension);
            }

        })

}

function dateLeft() {
    let selected_date = document.getElementById('date')
    let date = new Date(selected_date.value.replace(/-/g, '\/'));
    date.setDate(date.getDate() - 1);
    selected_date.value = date.toISOString().split('T')[0];
    getAppointments();
}

function dateRight() {
    let selected_date = document.getElementById('date')
    let date = new Date(selected_date.value.replace(/-/g, '\/'));
    date.setDate(date.getDate() + 1);
    selected_date.value = date.toISOString().split('T')[0];
    getAppointments();
}

function convertTime(timeString) {
    let time = timeString.split(":")
    let hours = Number.parseInt(time[0]);
    if (hours > 12) {
        return `${hours - 12}:${time[1]} PM`;
    } else if (hours === 12) {
        return `${hours}:${time[1]} PM`;
    } else {
        return `${hours}:${time[1]} AM`;
    }
}

function renderAppointments(list, extension) {
    let date = document.getElementById("date").value;
    if (date === "") {
        date = new Date();
        date.setHours(0, 0, 0, 0);
        document.getElementById("date").value = date.toISOString().split('T')[0];
    }
    if (list !== null) {
        if (extension === "patient") {
            let apptContainer = document.getElementById("appointment-container");
            let today = new Date();
            for (let i = 0; i < list.length; i++) {
                if (Date.parse(list[i].Date) >= today) {
                    let tempDate = new Date(list[i].Date);
                    tempDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds(), today.getMilliseconds());
                    let dateString = "";
                    if (today.getTime() === tempDate.getTime()) {
                        dateString = `Today at ${convertTime(list[i].Time)}`;
                    } else if (today.getTime() - 86400000 === tempDate.getTime()) {
                        dateString = `Yesterday at ${convertTime(list[i].Time)}`;
                    } else {
                        dateString = `${tempDate.toDateString()} at ${convertTime(list[i].Time)}`
                    }

                    let newAppt = document.createElement("div");
                    newAppt.className = "appointment card";
                    newAppt.style.width = "18rem";
                    newAppt.innerHTML = `
                    <div class="card-header">
                        Appointment w/ ${extension === "patient" ? `Dr. ${list[i].Physician}` : `${list[i].FirstName} ${list[i].LastName}`}
                    </div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">${dateString}</li>
                        ${list[i].Reason !== null && list[i].Reason !== "" ? `<li class="list-group-item">Reason: ${list[i].Reason}</li>` : ""}
                        <li class="list-group-item">Appointment Status: ${list[i].Status}</li>
                    </ul>
                    `;
                    apptContainer.appendChild(newAppt);
                }
            }
        } else {
            let tableBody = document.getElementById("table-body");
            let selected_date = document.getElementById('date')
            let date = new Date(selected_date.value.replace(/-/g, '\/'));
            list = list.filter(appointment => {
                let apptDate = new Date(appointment.Date);
                return apptDate.toDateString() === date.toDateString();
            }).sort(timeCompare);
            while (tableBody.lastChild) {
                tableBody.removeChild(tableBody.lastChild);
            }
            for (let i = 0; i < list.length; i++) {
                let tableRow = document.createElement("tr");
                tableRow.innerHTML = `
                        <th scope="row">${list[i].appointment_id}</th>
                        <td>${list[i].Status}</td>
                        <td>${list[i].FirstName}</td>
                        <td>${list[i].LastName}</td>
                        <td>${list[i].Reason}</td>
                        <td>${convertTime(list[i].Time)}</td>
                `;
                let tableData = document.createElement("td");
                if(list[i].Status === "pending"){
                    let image1 = document.createElement("i");
                    image1.className = "far fa-times-circle";
                    image1.addEventListener("click", () => {
                        let appt_data = {
                            appointment_id: list[i].appointment_id,
                            status: "deny"
                        }
                        fetch(`http://localhost:${port}/update/appointment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(appt_data),
                        })
                        .then(response => response.json())
                        .then(data => {
                            if(data.error){
                                alert("Unable to deny appointment at the moment. Try again later");
                            }
                            else{
                                getAppointments();
                            }
                        });
                    });
                    let image2 = document.createElement("i");
                    image2.className = "far fa-check-circle";
                    image2.addEventListener("click", () => {
                        let appt_data = {
                            appointment_id: list[i].appointment_id,
                            status: "accepted"
                        }
                        fetch(`http://localhost:${port}/update/appointment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(appt_data),
                        })
                        .then(response => response.json())
                        .then(data => {
                            if(data.error){
                                alert("Unable to accept appointment at the moment. Try again later");
                            }
                            else{
                                getAppointments();
                            }
                        });
                    });
                    tableData.appendChild(image1);
                    tableData.appendChild(image2);
                    tableRow.appendChild(tableData);
                    tableBody.appendChild(tableRow);
                }
                else{
                    tableRow.appendChild(tableData);
                    tableBody.appendChild(tableRow);
                }
            }
        }
    }
}

function timeCompare(firstAppt, secondAppt) {
    let firstTime = firstAppt.Time.split();
    let firstHours = Number.parseInt(firstTime[0]);
    let secondTime = secondAppt.Time.split();
    let secondHours = Number.parseInt(secondTime[0]);
    if (firstHours > secondHours) {
        return 1;
    } else {
        return -1;
    }
}