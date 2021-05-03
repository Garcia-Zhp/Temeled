function setDashboard() {
    setMenu();
    getAppointments();
}

function getAppointments(){
    document.getElementById("feedbox").style.display = "none";
    document.getElementById("spinner").style.display = "";
    setTimeout(() => {
        let email = getUserEmail();
        let extension = getUserType();
        if (extension === "provider") {
            document.getElementById("dash-date").style.display = "";
            document.getElementById("upcoming-header").innerHTML = "Scheduled Appointments";
            document.getElementById("past-header").innerHTML = "Pending Appointments";

            let futureVisits = document.getElementById("future-visits");
            let pastVisits = document.getElementById("past-visits");
            while(futureVisits.firstChild){
                futureVisits.removeChild(futureVisits.firstChild);
            }
            while(pastVisits.firstChild){
                pastVisits.removeChild(pastVisits.firstChild);
            }

            const data_email = {
                Email: email
            };
            fetch(`http://localhost:${port}/get/info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data_email),
            })
                .then(response => response.json())
                .then(data => {
                    let doctor_id = data.info[0].personal_ID;
                    let date = document.getElementById("date").value;
                    if(date === ""){
                        date = new Date();
                        date.setHours(0, 0, 0, 0);
                        document.getElementById("date").value = date.toISOString().split('T')[0];
                    }
                    else{
                        date = new Date(date);
                    }
                    let dateString = date.toISOString().split('T')[0];
                    let appt_data = {
                        doctor_id: doctor_id,
                        date: dateString
                    }
                    fetch(`http://localhost:${port}/get/appointments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(appt_data),
                    })
                        .then(response => response.json())
                        .then(data => {

                            if (data.appointments) {
                                renderAppointments(data.appointments, extension);
                            } else {
                                renderAppointments(null, extension);
                            }

                        })
                })
        } else if (extension === "patient") {
            const data_email = {
                Email: email,

            };
            fetch(`http://localhost:${port}/patient/appointments`, {
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
    }, 250);
}

function convertTime(timeString){
    let time = timeString.split(":")
    let hours = Number.parseInt(time[0]);
    if(hours > 12){
        return `${hours - 12}:${time[1]} PM`;
    }
    else if(hours === 12){
        return `${hours}:${time[1]} PM`;
    }
    else{
        return `${hours}:${time[1]} AM`;
    }
}
function renderAppointments(list, extension){

    if(list !== null){
        let pastVisits = document.getElementById("past-visits");
        let futureVisits = document.getElementById("future-visits");
        let today = new Date();
        for(let i = 0; i < list.length; i++){
            if(extension === "patient" || (extension === "provider" && list[i].Status !== "denied")){
                let tempDate = new Date(list[i].Date);
                tempDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds(), today.getMilliseconds());
                let dateString = "";
                if(today.getTime() === tempDate.getTime()){
                    dateString = `Today at ${convertTime(list[i].Time)}`;
                }
                else if(today.getTime() - 86400000 === tempDate.getTime()){
                    dateString = `Yesterday at ${convertTime(list[i].Time)}`;
                }
                else{
                    dateString = `${tempDate.toDateString()} at ${convertTime(list[i].Time)}`
                }

                let newAppt = document.createElement("div");
                newAppt.className = "appointment-card card";
                newAppt.style.width = "18rem";

                newAppt.addEventListener("click", event =>{
                    sessionStorage.setItem('appointment_id', list[i].appointment_id);
                    openAppointment();
                });

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
                if(extension === "provider"){
                    if(list[i].Status === "accepted"){
                        futureVisits.appendChild(newAppt);
                    }
                    else{
                        pastVisits.appendChild(newAppt);
                    }
                }
                else{
                    if(Date.parse(list[i].Date) < today){
                        pastVisits.appendChild(newAppt);
                    }
                    else{
                        futureVisits.appendChild(newAppt);
                    }
                }
            }
        }
    }
    document.getElementById("feedbox").style.display = "";
    document.getElementById("spinner").style.display = "none";
}

function openAppointment() {
    window.location = `http://localhost:${port}/views/appointment_view.html`;
}

document.getElementById("date").addEventListener('change', () => {
    getAppointments();
});