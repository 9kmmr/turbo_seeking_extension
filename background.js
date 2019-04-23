
siteurl = "http://localhost/turbo_seeking/";

var uid, email, access_token, old_url;
maxTries = 3;
chrome.storage.sync.get(['uid','email','access_token'], function(items){
    if (items) {
        uid = items.uid;
        email = items.email;
        access_token = items.access_token;
        console.log(uid, email, access_token)
    }
    chrome.storage.sync.get('cannedmessage', function(item){
        if (!item) {
            chrome.storage.sync.set({'cannedmessage':'{"message1":"Hey","message2":"Hey","message3":"Hey","message41":"Hey","message5":"Hey"}'});
        }
    })
    chrome.storage.sync.get('delaymode', function(item){
        if (!item) {
            chrome.storage.sync.set({'delaymode':0});
        }
    })

})


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.getidentity) {
        chrome.storage.sync.get(['uid','email','access_token'], function(items){
            uid = items.uid;
            email = items.email;
            access_token = items.access_token;            
            if (uid&&email&&access_token) {
                sendResponse(true)
            } else 
                sendResponse(null)

        })
        return true;
    }
    if (request.getsettings) {
        chrome.storage.sync.get('delaymode', function(res) {
            sendResponse(res.delaymode);
        })
        return true;
    }

    if (request.state) {
        user = JSON.parse(request.detail);
        access_token = user.authToken.token
        uid = user.user.user_uid;
        email = user.user.email;
        
        chrome.storage.sync.get('access_token', function(item) {
            if (!item.access_token) {
                chrome.storage.sync.set({'access_token': access_token});
            }
        })
        chrome.storage.sync.get('uid', function(item) {
            if (!item.uid) {
                chrome.storage.sync.set({'uid': uid});
            }
        })
        chrome.storage.sync.get('email', function(item) {
            if (!item.email) {
                chrome.storage.sync.set({'email': email});
            }
        })  
        return true;    
       
    }
    if (request.savecannedmessages) {
        if (request.cannedmessage) {
            // save to storage
            chrome.storage.sync.set({'cannedmessage':request.cannedmessage});
            // save to server
        }
        return true;
    }
    if (request.getcannedmessages) {
        chrome.storage.sync.get('cannedmessage',function(item) {
            sendResponse(item.cannedmessage)
        });
        return true;
    }

    if (request.startsearch) {
        
        _theUrl = "https://api.seeking.com/v3/users/"+uid+"/search?"+request.startsearch.split("search?")[1]
        console.log(_theUrl)
        if (old_url!=_theUrl) {
            requestGetLive(_theUrl, 5).then(function(response) {
                console.log(response)
                if (response) {
                    combineProfileData(response.response.profiles.data, function(returned_users) {
                        combineUserPhotos(returned_users).then(users_data =>{
                            console.log(users_data)
                            sendResponse({"currentpage":response.response.profiles.current_page,"next_page":response.response.profiles.next_page_url,"profiles":users_data});        
                        })
                        
                    })
                    
                } else 
                    sendResponse(null)
            });
            old_url=_theUrl;
        }
        return true;
    }
    return true;

});

const requestGetLive = (url,  n) => {
    options={
        method:"GET",
        headers: {
            "Authorization": "Bearer "+access_token
        }
    }
    fetchedData = fetch(url, options).then(
       function(response) {
            status = response.status;
            if (status==200)
                return response.json();
            if (status==403) {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestGetLive(url,  n - 1);
            } else {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestGetLive(url,  n - 1);
            }
            
        }
    ).catch(function(error) {
        if (n === 1) {           
            return null;
        };
        return requestGetLive(url, n - 1);
    });
    return fetchedData;
}

function combineProfileData(data, callback) {    
    users = [];
    
    if (data) {
        data.forEach((element, index) => {          
            users.push ({
                            'name' : element.profile_attributes.username[0].value || 'Seeking Username',
                            'age' :element.age || '',
                            'location' :element.primary_location.name || '',
                            'height' :element.height || '', 
                            'body' :element.profile_attributes.body_type[0].value || '',
                            'ethnicity' :element.profile_attributes.ethnicity[0].value || '',
                            'favorited': element.favorited_by[0]||0,
                            'user_uid': element.uid
                            //'photos' :photos 
            }); 
            /*  */
        });
    }
    callback(users);
}
async function combineUserPhotos(datauser) {
    newusers = [];
    if (datauser) {
        for (const element of datauser) {            
            element.photos = await requestGetProfile("https://api.seeking.com/v3/users/"+uid+"/views/"+element.user_uid+"?with=photos,isUserReportedAlready,isMemberHasPrivatePhotoPermission,memberNote&lang=en_US", 5).then(user_profile => {       
                if (user_profile.status=="OK") {
                    return user_profile.response.profile;                                                 
                }                 
            }).then(us=>{
                photos = [us.profile_pic.thumb];
                us.photos.public.approved.forEach(element => {
                    photos.push(element.url.thumb);
                });
                return photos;
            }) ;
              
            newusers.push(element)                   
        }
    }
    return await Promise.all(newusers);
    
}

async function requestGetProfile(url, n) {
    options={
        method:"GET",
        headers: {
            "Authorization": "Bearer "+access_token
        }
    }
    fetchedData =  await fetch(url, options).then(
       function(response) {
            status = response.status;
            if (status==200) {
                return response.json();
            }
            if (status==403) {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestGetProfile(url,  n - 1);
            } else {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestGetProfile(url,  n - 1);
            }
            
        }
    ).catch(function(error) {
        if (n === 1) {           
            return null;
        };
        return requestGetProfile(url, n - 1);
    });
    return fetchedData;
}



function requestFavorite(f_uid, callback) {
    
    _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+f_uid
    try {        
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
            else if (xmlHttp.readyState == 4 && xmlHttp.status == 430) {
                requestGetAccessToken(function(){})
                console.log('403')
                callback('fail')
            }
            else 
                callback(null);
    
        }
        xmlHttp.open("POST", _theUrl, true); // true for asynchronous 
        xmlHttp.setRequestHeader("Authorization", "Bearer "+access_token); 
        xmlHttp.setRequestHeader("Accept", "application/json");    
        xmlHttp.setRequestHeader("Content-Type", "application/json");    
        xmlHttp.setRequestHeader("Access-Control-Allow-Origin", "*");      
        let data = JSON.stringify({});
        xmlHttp.send(data);
    } catch (error) {
        console.log('error can not favorite');
    }
}
function requestSendMessage(s_uid, message, callback) {
    
    _theUrl = "https://api.seeking.com/v3/users/"+uid+"/conversations"
    try {        
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
            else if (xmlHttp.readyState == 4 && xmlHttp.status == 430) {
                console.log('403')
                
                callback('fail')
            }
            else 
                callback(null);    
        }
        xmlHttp.open("POST", _theUrl, true); // true for asynchronous 
        xmlHttp.setRequestHeader("Authorization", "Bearer "+access_token);    
        xmlHttp.setRequestHeader("Accept", "application/json");    
        xmlHttp.setRequestHeader("Content-Type", "application/json");    
        xmlHttp.setRequestHeader("Access-Control-Allow-Origin", "*");   
          
        let data = JSON.stringify({"body":message, "member_uid":s_uid});
        xmlHttp.send(data);
    } catch (error) {
        console.log('error can not favorite');
    }
}

function requestGetAccessToken(callback){
    _theUrl = "https://api.seeking.com/v3/users/"+uid+"/auth/token"
    try {        
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                if (xmlHttp.responseText){
                    data = JSON.parse(xmlHttp.responseText)
                    if (data.status=="OK") {
                        access_token = data.response;
                        chrome.storage.sync.set({'access_token': access_token});
                        callback();
                    }
                }
            }
            else if (xmlHttp.readyState == 4 && xmlHttp.status == 430) {
                console.log('403')
                callback('false')
            }
            else 
                callback(null);    
        }
        xmlHttp.open("PUT", _theUrl, true); // true for asynchronous 
        xmlHttp.setRequestHeader("Authorization", "Bearer "+access_token);    
        xmlHttp.setRequestHeader("Accept", "application/json");    
        xmlHttp.setRequestHeader("Content-Type", "application/json");    
        xmlHttp.setRequestHeader("Access-Control-Allow-Origin", "*");   
          
        let data = JSON.stringify({});
        xmlHttp.send(data);
    } catch (error) {
        console.log('error can not favorite');
    }
}

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