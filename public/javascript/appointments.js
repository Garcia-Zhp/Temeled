let time_slot = null;

function setAppointmentMenu() {
	setMenu();
	renderProviders();
	renderAppointmentPage();
}

async function appointmentGetProviders(){
    const response = await fetch(`http://localhost:${port}/providers`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
	return await response.json();
}

async function appointmentGetInfo(){
	let email = getUserEmail();
    const data_email = {
        Email: email,
    };
	const response = await fetch(`http://localhost:${port}/get/info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
		body: JSON.stringify(data_email)
    });
	return await response.json();
}

function renderProviders() {
	appointmentGetProviders().then(data => {
		let providers = data.providers;
		let x = document.getElementById("physician");
		for(var i = 0;i < providers.length; i++){
			let opt = document.createElement('option');
			opt.value = i;
			opt.innerHTML = `Dr. ${providers[i].LastName}`;
			x.appendChild(opt);
		}
	});
}


function countChars(obj){
	    var maxLength = 100;
	    var strLength = obj.value.length;
	    var charRemain = (maxLength - strLength);

	    if(charRemain < 0){
	        document.getElementById("charNum").innerHTML = '<span style="color: red;">You have exceeded the limit of '+maxLength+' characters</span>';
	    }else{
	        document.getElementById("charNum").innerHTML = charRemain+' characters remaining';
	    }
}

function convert24to12(timeString){
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

function convert12to24(timeString){
	let time1 = timeString.split(":")
    let hours = Number.parseInt(time1[0]);
	let time2 = time1[1].split(" ");
	let minutes = time2[0];
	let meridiem = time2[1];

    if(meridiem === "AM" || hours === 12){
        return `${hours}:${minutes}:00`;
    }
    else{
        return `${hours+12}:${minutes}:00`;
    }
}

async function renderAppointmentPage(){
	if(time_slot !== null){
		time_slot.style = {
			width: "150px",
			margin: "15px",
			boxShadow: "var(--box-shadow-negY)",
			backgroundColor: "var(--yellow)",
			transition: "0.3s"
		}
		time_slot = null;
	}
	let selectProvider = document.getElementById("physician");
	let datePicker = document.getElementById("date");
	let data = await appointmentGetProviders();
	let providers = data.providers;
	if(selectProvider.value && datePicker.value){
		document.getElementById("time-slots-header").style.display = "";
		document.getElementsByClassName("time-slots-container")[0].style.display = "";
		document.getElementsByClassName("reason")[0].style.display = "";
		document.getElementsByClassName("comments")[0].style.display = "";
		document.getElementById("submit-appointment").style.display = "";
		let did = providers[selectProvider.value].doctor_ID;
		let selectedDate = new Date(datePicker.value);
		let minDate = new Date(minTime);
		let maxDate = new Date(maxTime);
		if(selectedDate >= minDate && selectedDate <= maxDate){
			const data_app = {
				doctor_id: did,
				date: selectedDate
			};
			const response = await fetch(`http://localhost:${port}/get/appointments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data_app)
			});
			const data = await response.json();
			let appointments = data.appointments;
			let timeSlots = document.getElementsByClassName("time-slot");
			let appCounter = 0;
			for(let i = 0; i < 12; i++){
				let timeString = i + 7 < 10 ? `0${i+7}:00:00` : `${i+7}:00:00`;
				if(appCounter < appointments.length && appointments[appCounter].Time === timeString){
					timeSlots[i].style.display = "none";
					appCounter++;
				}
				else{
					timeSlots[i].style.display = "";
				}
			}
		}
		else{
			document.getElementById("time-slots-header").style.display = "none";
			document.getElementsByClassName("time-slots-container")[0].style.display = "none";
			document.getElementsByClassName("reason")[0].style.display = "none";
			document.getElementsByClassName("comments")[0].style.display = "none";
			document.getElementById("submit-appointment").style.display = "none";
			document.getElementsByClassName("reason")[0].value = "checkup";
			document.getElementById("floatingTextarea2").value = "";
			alert("Select a valid date for your appointment");
		}
	}
	else{
		document.getElementById("time-slots-header").style.display = "none";
		document.getElementsByClassName("time-slots-container")[0].style.display = "none";
		document.getElementsByClassName("reason")[0].style.display = "none";
		document.getElementsByClassName("comments")[0].style.display = "none";
		document.getElementById("submit-appointment").style.display = "none";
		document.getElementsByClassName("reason")[0].value = "checkup";
		document.getElementById("floatingTextarea2").value = "";
	}
}

function timeSlotHandler(event){
	if(time_slot !== null){
		time_slot.style = {
			width: "150px",
			margin: "15px",
			boxShadow: "var(--box-shadow-negY)",
			backgroundColor: "var(--yellow)",
			transition: "0.3s"
		}
	}
	time_slot = event.target;
	time_slot.style.backgroundColor = "var(--greydark)";
	time_slot.style.color = "var(--yellow)";
}

async function submitHandler(){
	if(time_slot === null){
		alert("Please select a time slot for your appointment before submitting");
		return;
	}
	if(document.getElementById("floatingTextarea2").value.length > 100){
		alert("Comments box has exceeded the number of characters. Please enter a comment of 100 characters or less.");
		return;
	}
	let selectProvider = document.getElementById("physician");
	let datePicker = document.getElementById("date");
	let selectedDate = new Date(datePicker.value);
	let minDate = new Date(minTime);
	let maxDate = new Date(maxTime);
	if(selectedDate < minDate || selectedDate > maxDate){
		alert("Please select a valid date for your appointment");
		return;
	}
	const [prData, peData] = await Promise.all([
		appointmentGetProviders(),
		appointmentGetInfo()
	]);
	let providers = prData.providers;
	let info = peData.info[0];
	const appt_data = {
		FirstName: info.FirstName,
		LastName: info.LastName,
		Reason: document.getElementsByClassName("reason")[0].value,
		Comments: document.getElementById("floatingTextarea2").value,
		patient_id: info.personal_ID,
		doctor_id: providers[selectProvider.value].doctor_ID,
		Time: convert12to24(time_slot.firstChild.data.trim()),
		apptDate: selectedDate.toISOString().split('T')[0],
		physician: providers[selectProvider.value].LastName
	};
	const response = await fetch(`http://localhost:${port}/add/appointment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
		body: JSON.stringify(appt_data)
    });
	const data = await response.json();
	if(data.error){
		console.log(data.error);
		alert("Unable to submit appointment currently. Try again later");
	}
	else{
		window.location = `http://localhost:${port}/views/activityMenu.html`;
	}
}

function fillAppointment() {
	let appointment_id = sessionStorage.getItem('appointment_id');

	const data_appointment = {
		Appointment_id: appointment_id
	}
	fetch(`http://localhost:${port}/provider/getAppointment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data_appointment),
	})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			let x = document.getElementById('main-header');
			let title = document.createElement('p');

			title.innerHTML = "Appointment: " + data.provider_getAppointment[0].Time + " - " +
				data.provider_getAppointment[0].FirstName + " " + data.provider_getAppointment[0].LastName;
			x.appendChild(title);

			const data_appointment = {
				Patient_ID: data.provider_getAppointment[0].patient_id
			}
			fetch(`http://localhost:${port}/provider/getAppointmentEmail`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data_appointment),
			})
				.then(response => response.json())
				.then(data => {
					sessionStorage.setItem('email', data.get_Email[0].Email);
				})

			document.getElementById('pID').value = data.provider_getAppointment[0].patient_id;
			document.getElementById('fName').value = data.provider_getAppointment[0].FirstName;
			document.getElementById('lName').value = data.provider_getAppointment[0].LastName;
			document.getElementById('reason').value = data.provider_getAppointment[0].Reason;
			document.getElementById('comments').value = data.provider_getAppointment[0].Comments;
		})
}

function gotoCreateReport() {
	window.location=''
}

let dateElement = document.getElementById("date");
dateElement.addEventListener("change", renderAppointmentPage);
let providerElement = document.getElementById("physician");
providerElement.addEventListener("change", renderAppointmentPage);

let date = new Date();
date.setHours(0, 0, 0, 0);
date.setMilliseconds(date.getMilliseconds() + 86400000);
let dateString = date.toISOString().split('T')[0];
let minTime = dateString;
dateElement.setAttribute('min', dateString);
date.setFullYear(date.getFullYear() + 2);
dateString = date.toISOString().split('T')[0];
let maxTime = dateString;
dateElement.setAttribute('max', dateString);

document.querySelectorAll('.time-slot').forEach((btn) => {
  btn.addEventListener("click", timeSlotHandler);
});

document.getElementById("submit-appointment").addEventListener("click", submitHandler);
