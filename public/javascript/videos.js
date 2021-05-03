// select file input
let intervalRef = null
let loadCount = 0

function setVideoMenu() {
    let extension = getUserType();
    setMenu()

    if (extension === "provider") {
        let upload = document.getElementById('upload-container');
        upload.innerHTML =
            `
            <div class="row m-3">
                <div class="upload-header-container">
                    
                    <p class="upload-header">Upload Video</p>
                </div>
                              
                <form id="form" enctype="multipart/form-data">
                    <label> Select a file:</label>
                    <input type="file" id="video">
                </form>
                
                <button type="button" class="btn upload-btn" value="Submit" onclick="buttonPress()" name="SUBMIT">Submit</button>
                
            </div>        
            `
    } else if (extension === "patient") {

    }
    renderVideoList()

}

function renderVideoList() {

    fetch(`http://localhost:${port}/videos/list`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {


            let x = document.getElementById("video-feed");
            for (let i = 0; i < data.videos.length; i++) {

                // console.log(data.Contents[video].Key);
                // let keyValue = "" + data.Contents[video].Key.split(" ").join("+");
                let objectURL = "https://owlmed-test.s3.amazonaws.com/" + data.videos[i].Key.split(" ").join("+") //replaces space with +
                objectURL = objectURL.split("'").join("%27"); //replaces ' with url equivalent


                let new_video = document.createElement('div');
                new_video.className = "video-card card";
                new_video.addEventListener("click", event => {
                    sessionStorage.setItem('url', objectURL);
                    sessionStorage.setItem('title', data.videos[i].Key.split("/")[1])
                    openVideo();
                });

                new_video.innerHTML = `
                        <div class="card-header">
                     
                            ${data.videos[i].Key.split("/")[1].replace('.mp4','')}
                        </div>
                        <ul class="list-group list-group-flush">
                        <li class="list-group-item"> Last Modified: ${convertVideoTime(data.videos[i].LastModified)}</li>
                        <li class="list-group-item">Size: ${bytesToSize(data.videos[i].Size)}</li>
                        
                        </ul>`;

                x.appendChild(new_video);
            }
        })
}

function openVideo() {
    window.location = `http://localhost:${port}/views/videoPlayer.html`;
}

function convertVideoTime(timeString) {
    return timeString.split("T")[0];
}

// add event listener
function buttonPress() {
    document.getElementById("video-content").style.display = "none";
    document.getElementById("spinner").style.display = "";
    if(intervalRef !== null){
        clearInterval(intervalRef);
    }
    intervalRef = setInterval(function() {
        let numOfDots = loadCount;
        let dotString = "";
        while(numOfDots !== 0){
            dotString += ".";
            numOfDots--;
        }
        document.getElementById("upload-text").innerHTML = "Uploading" + dotString;
        loadCount = loadCount / 3 === 1 ? 0 : loadCount + 1;
    }, 500);
    const input = document.getElementById('video');
    uploadFile(input.files[0]);
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

const uploadFile = (file) => {
    /*if(!['video/mp4', 'image/gif', 'image/png', 'image/svg+xml'].includes(file.type)) {
        console.log('Only images are allowed.');
        document.getElementById("errorbox").innerHTML = 'Only images are allowed.'
        return;
    }

    // check file size (< 2MB)
    if(file.size > 2 * 1024 * 1024) {
        document.getElementById("errorbox").innerHTML = 'File must be less than 2MB.';
        console.log('File must be less than 2MB.');
        return;
    }*/
    // add file to FormData object
    const fd = new FormData();
    fd.append('video', file);
    //console.log(fd)
    // send `POST` request
    fetch('/upload/video', {
        method: 'POST',
        body: fd
    })
        .then(res => res.json())
        .then(data => {
            clearInterval(intervalRef);
            loadCount = 0;
            document.getElementById("video-content").style.display = "";
            document.getElementById("spinner").style.display = "none";
            if (data) {
                //console.log(data.name);
                //uploadToS3(data.name);
                window.alert(data.message);
                window.location.reload();
            } else {

                document.getElementById("errorbox").innerHTML = 'error'
            }
        })
}

function uploadToS3(name) {


    const data_account = {
        file_name: name,
    };

    fetch(`http://localhost:${port}/video/upload/s3`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_account),
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                window.alert(data.message);
                window.location.reload();

            } else {

            }
        })

}


function playVideo() {
    setMenu();
    let extension = getUserType();

    let videoTitle = document.createElement("p");
    videoTitle.innerHTML = sessionStorage.getItem('title');
    document.getElementById("titleDiv").appendChild(videoTitle);

    console.log(sessionStorage.getItem('url'));
    document.getElementById("video").setAttribute("src", sessionStorage.getItem('url'));


    if (extension === "provider") {
        let container = document.getElementById('del-vid-container');
        let del_btn = document.createElement('button');
        del_btn.setAttribute('class', 'btn btn-danger delete-vid' );
        del_btn.type = 'button';
        del_btn.innerHTML = 'DELETE VIDEO';
        del_btn.setAttribute('id', 'deleteButton');
        //del_btn.onclick = deleteVideo(sessionStorage.getItem('title'))
        container.appendChild(del_btn);

        document.getElementById('deleteButton').onclick = function() {
            alert(sessionStorage.getItem('title'))
            deleteVideo(sessionStorage.getItem('title'));

        };

    }

}
/*
<button type= 'button' class = "btn btn-danger delete-vid" onclick = deleteVideo(${})> </button>
*<button type= 'button' class = "btn btn-danger delete-vid" onclick = deleteVideo(${sessionStorage.getItem('title')})> DELETE VIDEO </button>
* */
function deleteVideo(filename) {
    const fn = {
        FN: filename
    }
    fetch(`http://localhost:${port}/video/delete/s3`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(fn),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                window.alert(data.message)
                 window.location = `http://localhost:${port}/views/videos.html`;

            } else {
                window.alert(data.error)
            }
        })
}
