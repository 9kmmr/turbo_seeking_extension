
siteurl = "http://botvisions.com:8080/";

var uid, email, access_token, old_url;
var maxTries = 3, delaymode="off", favoritemode = "off";
cannedmessages=[];
lastresultsSearched = [];
PageIndex="";NextPage="";
chrome.storage.sync.get(['uid','email','access_token'], function(items){
    if (items) {
        uid = items.uid;
        email = items.email;
        access_token = items.access_token;
        
        authServerSide(function(){})
    }
    chrome.storage.sync.get('cannedmessage', function(item){
        if (item.cannedmessage) {
            ms = JSON.parse(item.cannedmessage);
            cannedmessages = [ms.message1,ms.message2,ms.message3,ms.message4,ms.message5];
        }
        if (!item.cannedmessage) {
            chrome.storage.sync.set({'cannedmessage':'{"message1":"Hey","message2":"Hey","message3":"Hey","message4":"Hey","message5":"Hey"}'});
        }
    })
    chrome.storage.sync.get('delaymode', function(item){
        if (!item.delaymode) {
            chrome.storage.sync.set({'delaymode':"off"});
        } else if (item.delaymode) {
            delaymode = item.delaymode;
        }
    })
    chrome.storage.sync.get('favoritemode', function(item){
        if (!item.favoritemode) {
            chrome.storage.sync.set({'favoritemode':"off"});
        } else if (item.favoritemode) {
            favoritemode = item.favoritemode;
        }
    })

})

/**  ****************************** LISTENER SECTION ************************************** */

chrome.runtime.onConnect.addListener(function (externalPort) {
    externalPort.onDisconnect.addListener(function() {
        console.log(lastresultsSearched)
        console.log(PageIndex)
        console.log(NextPage)
        chrome.storage.local.set({'historySearched': JSON.stringify(lastresultsSearched)}, function(){});
        chrome.storage.sync.set({'pageindex': PageIndex}, function(){});
        chrome.storage.sync.set({'nextpage': NextPage}, function(){});
    })
})
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.savelastsearch) {
        chrome.storage.sync.set({'lastsearch':request.savelastsearch}, function(){

        })
        return true;
    }

    if (request.getlastsearch) {
        chrome.storage.sync.get('lastsearch', function(res) {
            sendResponse(res.lastsearch);
        })
        return true;
    }
    if (request.firstsearch) {
        lastresultsSearched=[];
        return true;
    }
    if (request.getHistory) {
        chrome.storage.local.get('historySearched', function(res) {
            
            if (res.historySearched) {
                datahistory = JSON.parse(res.historySearched);
                if (datahistory.length) {
                    
                    lastresultsSearched = datahistory;
                }
                sendResponse(datahistory);
            }
            else sendResponse("");
        })
        return true;
    }
    if (request.getPageIndex) {
        chrome.storage.sync.get('pageindex', function(res) {
            console.log(res.pageindex)
            if (res.pageindex) {
                PageIndex = res.pageindex;
                sendResponse(res.pageindex);
            }
            else sendResponse("");
        })
        return true;
    }
    if (request.getNextPage){
        chrome.storage.sync.get('nextpage', function(res) {
            if (res.nextpage){
                NextPage = res.nextpage;
                sendResponse(res.nextpage);
            }
            else sendResponse("");
        })
        return true;
    }
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
        chrome.storage.sync.get(['delaymode', 'favoritemode'], function(res) {
            sendResponse(res);
        })
        return true;
    }
    
    if (request.savefavoritemode) {
        
        chrome.storage.sync.set({'favoritemode':request.savefavoritemode}, function(){
            favoritemode = request.savefavoritemode;
            authServerSide(res => {
                if (res) {
                    saveServerSettingfavorite(request.savefavoritemode)
                } else {
                    console.log('cannot auth to the server');
                }
            })
            sendResponse(true);
        });

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
        if (request.savecannedmessages) {
            // save to storage
            chrome.storage.sync.set({'cannedmessage':request.savecannedmessages});
            let cannedms = JSON.parse(request.savecannedmessages);
            cannedmessages = [cannedms.message1,cannedms.message2,cannedms.message3,cannedms.message4,cannedms.message5]
            // save to server
            authServerSide(res => {
                if (res) {
                    saveServerCannedMessage(request.savecannedmessages);
                } else {
                    console.log('cannot auth to the server');
                }
            })
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
        
        //if (old_url!=_theUrl) {
            requestGetLive(_theUrl, 5).then(function(response) {
                
                if (response) {
                    combineProfileData(response.response.profiles.data, function(returned_users) {
                        combineUserPhotos(returned_users).then(users_data =>{
                            console.log(users_data)

                            lastresultsSearched.push(users_data);
                            console.log(lastresultsSearched)
                            console.log(response.response.profiles)
                            PageIndex = response.response.profiles.current_page;
                            NextPage = response.response.profiles.next_page_url;
                            sendResponse({"currentpage":response.response.profiles.current_page,"next_page":response.response.profiles.next_page_url,"profiles":users_data});        
                        })
                        
                    })
                    
                } else 
                    sendResponse(null)
            });
            //old_url=_theUrl;
        //}
        return true;
    }

    if (request.favorite) {
        if (favoritemode=="off") {
            _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+request.favorite;
            
            requestFavorite(_theUrl, 5).then(response => {
                if (response) {
    
                    console.log("favorite message:",response)
                    if (response.status=="OK") {
                        sendResponse(true);
                    } else 
                        sendResponse(null);
                } else 
                    sendResponse(null);
            })
           
        } else if (favoritemode=="on") {
            _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+request.favorite;
            
            requestFavorite(_theUrl, 5).then(response => {
                if (response) {    
                    console.log("favorite message:",response)
                    if (response.status=="OK") {
                        sendResponse(true);
                        
                        
                    } else 
                        sendResponse(null);
                } else 
                    sendResponse(null);
            })
        }
        return true;
    }
    if (request.unfavorite) {
        _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+request.unfavorite;
        
        requestUnFavorite(_theUrl, 5).then(response => {
            if (response) {
                console.log("unfavorite message:",response)
                if (response.status=="OK") {
                    sendResponse(true);
                } else 
                    sendResponse(null);
            } else sendResponse(null);
        })
        // remove favorite in the server
        authServerSide(res => {
            if (res) {
                saveUnFavorites(request.unfavorite)
            } else {
                console.log('cannot auth to the server');
            }
        })

        return true;
    }

    if (request.sendmessage) {
        if (request.message) {
            if (request.mode=="delay") {
                authServerSide(res => {
                    if (res) {
                        saveSendMessage(request.sendmessage, request.message)
                    } else {
                        console.log('cannot auth to the server');
                    }
                })
                sendResponse('delaymode on')
            } else {
                _theUrl = "https://api.seeking.com/v3/users/"+uid+"/conversations";
                data = {"body":request.message, "member_uid":request.sendmessage};
                
                requestSendMessage(_theUrl, data, 5).then(response => {
                    console.log(response)
                    if (response) {
                        if (response.status=="OK") {
                            sendResponse(true);
                        } else 
                            sendResponse(null);
                    } else  
                        sendResponse(null);
                })
            }
            
        } else {            
            sendResponse('no message')
            //
        }
        return true;
    }
    

    return true;

});
/**
 * 
 * @param {*} url 
 * @param {*} n 
 */
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
/**
 * 
 * @param {*} data 
 * @param {*} callback 
 */
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
/**
 * 
 * @param {*} datauser 
 */
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
/**
 * 
 * @param {*} url 
 * @param {*} n 
 */
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


/**
 * 
 * @param {*} url 
 * @param {*} n 
 */
const requestFavorite = (url,  n) => {
    options={
        method:"POST",
        headers: {
            "Authorization": "Bearer "+access_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({})
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
                return requestFavorite(url,  n - 1);
            } else {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestFavorite(url,  n - 1);
            }
            
        }
    ).catch(function(error) {
        if (n === 1) {   
            console.log('error can not favorite');        
            return null;
        };
        return requestFavorite(url, n - 1);
    });
    return fetchedData;
}
/**
 * 
 * @param {*} url 
 * @param {*} n 
 */
const requestUnFavorite = (url,  n) => {
    options={
        method:"DELETE",
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
                return requestUnFavorite(url,  n - 1);
            } else {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestUnFavorite(url,  n - 1);
            }
            
        }
    ).catch(function(error) {
        if (n === 1) {   
            console.log('error can not favorite');        
            return null;
        };
        return requestUnFavorite(url, n - 1);
    });
    return fetchedData;
}


const requestSendMessage = (url, data,  n) => {
    options={
        method:"POST",
        headers: {
            "Authorization": "Bearer "+access_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(data)
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
                return requestSendMessage(url, data,  n - 1);
            } else {
                if (n === 1) {
                    return null
                };
                requestGetAccessToken(function(){})
                return requestSendMessage(url, data,  n - 1);
            }
            
        }
    ).catch(function(error) {
        if (n === 1) {   
            console.log('error can not send message');        
            return null;
        };
        return requestSendMessage(url, data, n - 1);
    });
    return fetchedData;
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


/*********************************** CONTACT TO THE SERVER SIDE ******************************* */
/**
 * 
 * @param {*} callback 
 */
function authServerSide( callback) {
    const _theUrl = siteurl + "auth?getauth=1&uid="+uid+"&email="+email+"&access_token="+access_token;    
    
    httpGetAsync(_theUrl, res => {
        console.log(res)
        if (res) {
            callback(true)
        } else {
            callback(false)
        }
    })
}
/**
 * 
 * @param {*} messages 
 */
function saveServerCannedMessage(messages) {
    const _theUrl = siteurl + "savecannedmessage";  
    const _data = JSON.stringify({"uid":uid, "email":email,"cannedmessages":messages})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
}
/**
 * 
 * @param {*} mode 
 */
function saveServerSettingdelay(mode) {
    const _theUrl = siteurl + "settingdelay";  
    const _data = JSON.stringify({"uid":uid, "email":email,"delay":mode})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
}
/**
 * 
 * @param {*} mode 
 */
function saveServerSettingfavorite(mode) {
    const _theUrl = siteurl + "settingfavorite";  
    const _data = JSON.stringify({"uid":uid, "email":email,"favorite":mode})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
}
/* this function cause conflict with watch favorite on server side, douplicate possible

function saveFavorites(f_uid) {
    const _theUrl = siteurl + "auth";  
    const _data = JSON.stringify({"uid":uid, "email":email,"f_uid":f_uid,"favorite_user":1})
    httpPostAsync(_theUrl, _data, res => {

    })
} */
/**
 * 
 * @param {*} f_uid 
 */
function saveUnFavorites(f_uid) {
    const _theUrl = siteurl + "unfavoriteuser";  
    const _data = JSON.stringify({"uid":uid, "email":email,"f_uid":f_uid,"unfavorite_user":1})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
}
/**
 * 
 * @param {*} s_uid 
 * @param {*} message 
 */
function saveSendMessage(s_uid, message) {
    const _theUrl = siteurl + "delaycannedmessage";  
    _data = JSON.stringify({"uid":uid, "email":email,"s_uid":s_uid,"message":message})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
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
    xmlHttp.open("POST", _theUrl); 
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(_data);


}