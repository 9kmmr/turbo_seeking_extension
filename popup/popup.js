



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.linksLeft) {
            uid = window.localStorage.getItem('uid');
            email = window.localStorage.getItem('email');
            access_token = window.localStorage.getItem('access_token');
        }
    }
);

/* chrome.extension.sendMessage({ getidentity: 1 }, function (response) {
    if (response) {
        uid = response.uid;
        email = response.email;
        access_token = response.access_token;
        document.getElementById("authenticated").style.display = "block";


    } else {
        document.getElementById("not-auth").style.display = "block";
    }
}) */


function httpGetAsync(_theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", _theUrl, true); // true for asynchronous 
    xmlHttp.send();
}

function httpPostAsync(_theUrl, _data, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", _theUrl, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    let data = JSON.stringify(_data)
    xhr.send(data);
}