var interval_id = null;
var activeContact = false;

function setMessagingPage() {
    setMenu();
    renderContacts();
}

function renderContacts() {
    let email = getUserEmail()
    let extension = getUserType();
    let ext_handler = "";
    if (extension === "provider") {
        ext_handler = "provider";
    } else if (extension === "patient") {
        ext_handler = "patient";
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
            if (data.providers) {
                //console.log(data.providers);
                renderContactList(data.PID, data.providers);
            } else if (data.patients) {

                renderContactList(data.PID, data.patients);
            } else {

                renderContactList(data.PID, null);
            }
        })
}


function renderContactList(PID, contacts) {
    if(activeContact !== null){
        activeContact.style = {
            border: "1px solid black",
            backgroundColor: "white",
            height: "100px",
            padding: "6px 30px",
            transition: "0.3s"
        };
		activeContact = null;
    }
    let list = document.getElementById("msg-list");
    if (list !== null) {
        list.remove();
    }
    let box1 = document.getElementById("box1");
    let contact_list = document.createElement("div");
    contact_list.id = "contact-list";

    for (let i = 0; i < contacts.length; i++) {
        let contact_list_content = document.createElement("div");
        contact_list_content.className = "contact-list-content";
        contact_list_content.addEventListener("click", event => {
            if(activeContact !== null){
                activeContact.style = {
                    border: "1px solid black",
                    backgroundColor: "white",
                    height: "100px",
                    padding: "6px 30px",
                    transition: "0.3s"
                };
            }
            activeContact = event.currentTarget;
            console.log(activeContact);
            activeContact.style.backgroundColor = "var(--greydark)";
            activeContact.style.color = "var(--yellow)";
            activeContact.style.boxShadow = "0 1px 15px var(--black)";
            activeContact.style.zIndex = "2210";
            renderMessageBox(PID, contacts[i].Extension, contacts[i].personal_ID, contacts[i].FirstName, contacts[i].LastName)
            if (interval_id !== null) {
                clearInterval(interval_id);
            }
            interval_id = setInterval(function () {
                renderNewMessages(PID, contacts[i].Extension, contacts[i].personal_ID, contacts[i].FirstName, contacts[i].LastName);
            }, 500);
        });

        let contact_box = document.createElement("div");
        contact_box.className = "contact-box";
        if (contacts[i].Extension === "provider") {
            contact_box.innerHTML = `Dr. ${contacts[i].LastName}`;
        } else {
            contact_box.innerHTML = `${contacts[i].FirstName} ${contacts[i].LastName}`;
        }
        let ext = ''
        if (contacts[i].Extension === 'provider') {
            ext = 'Owl Med Provider';
        } else {
            ext = 'Owl Med Patient';
        }

        let contact_info = document.createElement("div");
        contact_info.className = "contact-info";
        contact_info.innerHTML = ext;

        contact_list_content.appendChild(contact_box);
        contact_list_content.appendChild(contact_info);

        contact_list.appendChild(contact_list_content);
        box1.appendChild(contact_list);

    }

}
function message_read(receiver_id, sender_id){
    data_noti  = {
        Sender: sender_id,
        Receiver: receiver_id
    }
    fetch(`http://localhost:${port}/notification`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_noti),
    })
        .then(response => response.json())
        .then(data => {

        })

}
function renderMessageBox(PID, extension, contact_ID, firstName, lastName) {


    setSend(PID, contact_ID);
    message_read(PID, contact_ID);
    let chatBox = document.getElementById('chat-box');
    while (chatBox.firstChild) {
        chatBox.removeChild(chatBox.firstChild);
    }
    const data_messages = {
        senderID: PID,
        receiverID: contact_ID
    };
    fetch(`http://localhost:${port}/get/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_messages),
    })
        .then(response => response.json())
        .then(data => {

            let messages = data.messages
            for (let i = 0; i < messages.length; i++) {
                if (Number(messages[i].sender) === PID) {
                    let youDiv = document.createElement("div");
                    youDiv.className = "you";
                    youDiv.innerHTML = "You";

                    let msgRow = document.createElement("div");
                    msgRow.className = "msg-row";
                    msgRow.innerHTML = `<div class="my-msg-box">${messages[i].message}</div>`;

                    chatBox.appendChild(youDiv);
                    chatBox.appendChild(msgRow);
                } else {
                    let theirDiv = document.createElement("div");
                    theirDiv.className = "their-name";
                    if (extension === "provider") {
                        theirDiv.innerHTML = "Dr. " + lastName;
                    } else {
                        theirDiv.innerHTML = firstName + " " + lastName;
                    }

                    let msgRow = document.createElement("div");
                    msgRow.className = "msg-row";
                    msgRow.innerHTML = `<div class="their-msg-box">${messages[i].message}</div>`;

                    chatBox.appendChild(theirDiv);
                    chatBox.appendChild(msgRow);
                }
            }
            var element = document.getElementById('chat-box');
            element.scrollTop = element.scrollHeight - element.clientHeight;

        });

}


function renderNewMessages(PID, extension, contact_ID, firstName, lastName) {
    let chatBox = document.getElementById('chat-box');
    const data_messages = {
        senderID: PID,
        receiverID: contact_ID
    };
    fetch(`http://localhost:${port}/get/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_messages),
    })
        .then(response => response.json())
        .then(data => {
            let elements = [...chatBox.childNodes].filter(elem => elem.className === "msg-row");
            let messages = data.messages
            let index = elements.length;
            if(index === messages.length){
                return;
            }
            for (let i = index; i < messages.length; i++) {
                if (Number(messages[i].sender) === PID) {
                    let youDiv = document.createElement("div");
                    youDiv.className = "you";
                    youDiv.innerHTML = "You";

                    let msgRow = document.createElement("div");
                    msgRow.className = "msg-row";
                    msgRow.innerHTML = `<div class="my-msg-box">${messages[i].message}</div>`;

                    chatBox.appendChild(youDiv);
                    chatBox.appendChild(msgRow);
                } else {
                    let theirDiv = document.createElement("div");
                    theirDiv.className = "their-name";
                    if (extension === "provider") {
                        theirDiv.innerHTML = "Dr. " + lastName;
                    } else {
                        theirDiv.innerHTML = firstName + " " + lastName;
                    }

                    let msgRow = document.createElement("div");
                    msgRow.className = "msg-row";
                    msgRow.innerHTML = `<div class="their-msg-box">${messages[i].message}</div>`;

                    chatBox.appendChild(theirDiv);
                    chatBox.appendChild(msgRow);
                }
            }
            var element = document.getElementById('chat-box');
            element.scrollTop = element.scrollHeight - element.clientHeight;
        })
}



function setSend(senderID, receiverID) {
    const chatForm = document.getElementById("msg-field");
    const input = document.getElementById("input-msg");

    chatForm.addEventListener("submit", event => {
        event.preventDefault();
        if(input.value !== ""){
            const data_send = {
                Receiver: receiverID,
                Sender: senderID,
                Message: input.value
            };
            input.value = "";
            fetch(`http://localhost:${port}/send/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data_send),
            })
                .then(response => response.json())
                .then(data => {
                    let chatBox = document.getElementById('chat-box');
                    let youDiv = document.createElement("div");
                    youDiv.className = "you";
                    youDiv.innerHTML = "You";
    
                    let msgRow = document.createElement("div");
                    msgRow.className = "msg-row";
                    msgRow.innerHTML = `<div class="my-msg-box">${data_send.Message}</div>`;
    
                    chatBox.appendChild(youDiv);
                    chatBox.appendChild(msgRow);
                    var element = document.getElementById('chat-box');
                    element.scrollTop = element.scrollHeight - element.clientHeight;
                })
        }
    })

}

