
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
    
    chrome.storage.sync.get('favoritemode', function(item){
        if (!item.favoritemode) {
            chrome.storage.sync.set({'favoritemode':"off"});
        } else if (item.favoritemode) {
            favoritemode = item.favoritemode;
        }
    })

})

/**********************************************************************************************************
************************************** LISTENER SECTION ***************************************************
***********************************************************************************************************/

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
    
    if (request.getDelayedMessages) {
        authServerSide(res => {
            if (res) {
                getServerCannedMessage(messagesonserver => {
                    if (messagesonserver) {
                        sendResponse(messagesonserver)
                    } else 
                        sendResponse([])
                })
                
            } else {
                console.log('cannot auth to the server');
                sendResponse(false);
            }
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
        requestGetLives(_theUrl).then(response => {
            if (response) {
                if (response.status==200) {
                    console.time('combineuser')
                    combineProfileData(response.data.response.profiles.data, function(returned_users) {
                        console.timeEnd('combineuser');
                        lastresultsSearched.push(returned_users);
                        PageIndex = response.data.response.profiles.current_page;
                        NextPage = response.data.response.profiles.next_page_url;
                        sendResponse({"currentpage":response.data.response.profiles.current_page,"next_page":response.data.response.profiles.next_page_url,"profiles":returned_users});        
                           
                    })
                } else if (response.status==429) {
                    sendResponse("banned");
                } else 
                    sendResponse(null)
            }
        })
        
        return true;
    }
    if (request.usersentmessage) {
        recursiveFunc(1,[]).then(res => {
            console.log(res)
            sendResponse(res)       
        });
        
        
        return true;
    }

    if (request.getallphotos) {
        getAllUserPhotos(request.getallphotos).then(user_photos => {  

            sendResponse(user_photos);           
        })
        return true;
    }

    if (request.favorite) {
        if (favoritemode=="off") {

            _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+request.favorite;
            
            requestFavorite(_theUrl).then(response => {
                if (response) {   
                                    
                    if (response.status==200) {    
                        updateUserData(request.favorite, 'favorite', 1)                       
                        sendResponse(true);                        
                    } else if (response.status==429) 
                        sendResponse("banned");
                    else 
                        sendResponse(null)
                } else 
                    sendResponse(null);
            })
           
        } else if (favoritemode=="on") {
            _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+request.favorite;
            
            requestFavorite(_theUrl).then(response => {
                if (response) {                     
                    if (response.status==200) {  
                        updateUserData(request.favorite, 'favorite', 1)                      
                        sendResponse(true);                        
                    } else if (response.status==429) 
                        sendResponse("banned");
                    else 
                        sendResponse(null)
                } else 
                    sendResponse(null);
            })
        }
        return true;
    }
    if (request.unfavorite) {
        _theUrl = "https://api.seeking.com/v3/users/"+uid+"/favorites/"+request.unfavorite;
        
        requestUnFavorite(_theUrl).then(response => {
            if (response) {                     
                if (response.status==200) {  
                    updateUserData(request.unfavorite, 'favorite', 0)                        
                    sendResponse(true);                        
                } else if (response.status==429) 
                    sendResponse("banned");
                else 
                    sendResponse(null)
            } else 
                sendResponse(null);
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
                        saveSendMessage(request.sendmessage, request.age, request.address, request.message)
                    } else {
                        console.log('cannot auth to the server');
                    }
                })
                sendResponse('delaymode on')
            } else {
                _theUrl = "https://api.seeking.com/v3/users/"+uid+"/conversations";
                data = {"body":request.message, "member_uid":request.sendmessage};
                requestSendMessages(_theUrl, data).then(response => {
                    console.log(response);
                    if (response) {
                        if (response.status==200) {
                            updateUserData(request.sendmessage, 'sent', 1)   
                        }
                    }
                    sendResponse(response)
                })
                
            }
            
        } else {            
            sendResponse('no message')
            //
        }
        return true;
    }    

    if (request.deletecannedmessages) {
        authServerSide(res => {
            if (res) {
                deleteCannedMessage(request.deletecannedmessages, response => {
                    if (response)
                        sendResponse("done");
                    else sendResponse(null);
                })
            } else {
                console.log('cannot auth to the server');
                sendResponse(null);
            }
        })
    }

    return true;

});

/**********************************************************************************************************
 ************************************** FUNCTIONS SECTION ***************************************** 
 *********************************************************************************************************/



/**
 * do search with url
 * @param {string} url the url to search
 */
async function requestGetLives(url){
    config = {
        url: url,
        headers: {
            "Authorization": "Bearer "+access_token           
        },
        method: "GET"
    }  
    axios.interceptors.response.use(null, async (error) => {
        
        if (error.config && error.response && error.response.status === 403) {
            newaccess_token = await requestNewAuth();           
            error.config.headers.Authorization = "Bearer " + newaccess_token;
            return axios.request(error.config);                       
        }  
        return Promise.reject(error);
    });
    return axios(config);
       
}

/**
 * combine the searched users data to good format and send to popup
 * @param {array} data array of all searched users data
 * @param {function} callback callback function
 */
function combineProfileData(data, callback) {    
    users = [];
    
    if (data) {
        
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            users.push ({
                'name' : element.profile_attributes.username[0].value || 'Seeking Username',
                'age' :element.age || '',
                'location' :element.primary_location.name || '',
                'height' :element.height || '', 
                'body' :element.profile_attributes.body_type[0].value || '',
                'ethnicity' :element.profile_attributes.ethnicity[0].value || '',
                'favorited': element.favorited_by[0]||0,
                'user_uid': element.uid,
                'pic':element.profile_pic.thumb || '',
                'sent': 0
            });            
        }
    }
    callback(users);
}
function updateUserData(uid, type, data) {
    usfind = lastresultsSearched[0].findIndex(arr =>  arr['user_uid']==uid )
    console.log([uid, type, data])
    console.log(lastresultsSearched)
    console.log(usfind)
    if (usfind!==-1) {
        switch (type) {
            case 'favorite':
                updatedObj = { ...lastresultsSearched[0][usfind], favorited: data};
                // make final new array of objects by combining updated object.
                updatedUsers = [
                ...lastresultsSearched[0].slice(0, usfind),
                updatedObj,
                ...lastresultsSearched[0].slice(usfind + 1),
                ];
                lastresultsSearched[0] = updatedUsers;
                console.log(updatedObj)
                chrome.storage.local.set({'historySearched': JSON.stringify(lastresultsSearched)}, function(){});
                break;
            
            case 'sent':
                updatedObj = { ...lastresultsSearched[0][usfind], sent: data};
                // make final new array of objects by combining updated object.
                updatedUsers = [
                ...lastresultsSearched[0].slice(0, usfind),
                updatedObj,
                ...lastresultsSearched[0].slice(usfind + 1),
                ];
                lastresultsSearched[0] = updatedUsers;
                console.log(updatedObj)
                chrome.storage.local.set({'historySearched': JSON.stringify(lastresultsSearched)}, function(){});
                break;
            default:
                break;
        }
    } 
    
}
/**
 * get photos base on user id
 * @param {string} user_id user_id want to get photos
 */
async function getAllUserPhotos(user_id) {
    if (user_id) {
        return await requestGetProfile("https://api.seeking.com/v3/users/"+uid+"/views/"+user_id+"?with=photos,isUserReportedAlready,isMemberHasPrivatePhotoPermission,memberNote&lang=en_US")
        .then(user_profile => { 
            if (user_profile.status==200){
                if (user_profile.data.status=="OK") {
                    return user_profile.data.response.profile;                                                 
                }                 
            }  else return null
        }).then(us=>{
            photos = [];
            if (us) {
                if (user_id , us.photos.public.approved.length)
                    us.photos.public.approved.forEach(element => {
                        photos.push(element.url.thumb);
                    });
            }
            return photos;
        });
    }else 
        return null;
}
/**
 * get user profile details
 * @param {string} url url endpoint to get user profile
 * @param {int} n number of retry time
 */
async function requestGetProfile(url){
    config = {
        url: url,
        headers: {
            "Authorization": "Bearer "+access_token           
        },
        method: "GET"
    }  
    axios.interceptors.response.use(null, async (error) => {
        
        if (error.config && error.response && error.response.status === 403) {
            newaccess_token = await requestNewAuth();           
            error.config.headers.Authorization = "Bearer " + newaccess_token;
            return axios.request(error.config);                       
        }  
        return Promise.reject(error);
    });
    return axios(config);
       
}

/**
 * combine pages of users sent message
 * @param {function} callback callback function
 */

async function recursiveFunc(page, arr) {
    let datausersentmessage = arr;
    const res = await requestGetMessageSent('https://api.seeking.com/v3/users/' + uid + '/conversations?mailbox=sent&page=' + page);
    if (res) {
        if (res.status==200) {
            console.log(res.data)
            if (res.data.status == "OK") {
                if (res.data.response.conversations.data.length) {
                    for (let index = 0; index < res.data.response.conversations.data.length; index++) {
                        const element = res.data.response.conversations.data[index];
                        datausersentmessage.push(element.participants[0].uid);
                    }
                    
                    if (res.data.response.conversations.next_page_url)
                        return recursiveFunc(++page, datausersentmessage);
                    
                    else
                        return datausersentmessage;
                }
            }
        }
    }
   
  }

/**
 * get message user send
 * @param {string} url url end point to get send message
 * @param {int} n number of retry time
 */
async function requestGetMessageSent(url){
    config = {
        url: url,
        headers: {
            "Authorization": "Bearer "+access_token           
        },
        method: "GET"
    }  
    axios.interceptors.response.use(null, async (error) => {
        
        if (error.config && error.response && error.response.status === 403) {
            newaccess_token = await requestNewAuth();           
            error.config.headers.Authorization = "Bearer " + newaccess_token;
            return axios.request(error.config);                       
        }  
        return Promise.reject(error);
    });
    return axios(config);       
}


/**
 * favorite user
 * @param {string} url url endpoint to favorite
 * @param {int} n number of retry time
 */
async function requestFavorite (_url) {
    config = {
        url: _url,
        headers: {
            "Authorization": "Bearer "+access_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        data: { },
        method: "POST"
    }  
    axios.interceptors.response.use(null, async (error) => {
        console.log(error.response)
        if (error.config && error.response && error.response.status === 403) {
            const newaccess_token = await requestNewAuth(uid, email, access_token);
            updateUser(uid, email, "access_token", newaccess_token);
            error.config.headers.Authorization = "Bearer " + newaccess_token;
            return axios.request(error.config);
        }      
        return Promise.reject(error);
    });
    return axios(config);
}

/**
 * unfavorite user
 * @param {string} url url end point to unfavorite 
 * @param {int} n time try
 */
async function requestUnFavorite (_url) {
    config = {
        url: _url,
        headers: {
            "Authorization": "Bearer "+access_token           
        },
        data: { },
        method: "DELETE"
    }  
    axios.interceptors.response.use(null, async (error) => {
        console.log(error.response)
        if (error.config && error.response && error.response.status === 403) {
            const newaccess_token = await requestNewAuth(uid, email, access_token);
            updateUser(uid, email, "access_token", newaccess_token);
            error.config.headers.Authorization = "Bearer " + newaccess_token;
            return axios.request(error.config);
        }      
        return Promise.reject(error);
    });
    return axios(config);
}

/**
 * 
 * @param {string} url endpoint url to send messsage
 * @param {object} data message object to send
 * @param {int} n time retry send message
 */
async function requestSendMessages(url, _data){
    config = {
        url: url,
        headers: {
            "Authorization": "Bearer "+access_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        data: _data,
        method: "POST"
    }  
    axios.interceptors.response.use(null, async (error) => {
        
        if (error.config && error.response && error.response.status === 403) {
            newaccess_token = await requestNewAuth();
           
            error.config.headers.Authorization = "Bearer " + newaccess_token;
            return axios.request(error.config);                       
        }  else if (error.config && error.response && error.response.status === 400)    {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    });
    return axios(config);
       
}


/**
 * request new access token if token expired
 * @param {*} callback 
 */
async function requestNewAuth(){
    return await axios({
        url:  "https://api.seeking.com/v3/users/"+uid+"/auth/token",
        headers: {
            "Authorization": "Bearer "+access_token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        data: {
        },
        method: "PUT"
    }).then(res => {        
        chrome.storage.sync.set({'access_token': res.data.response});
        return res.data.response
    })
    .catch(error => {        
        // error try again one time
        console.log(error)
        return requestNewAuth() 
    })
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
                        callback(access_token);
                    }
                }
            }
            else if (xmlHttp.readyState == 4 && xmlHttp.status == 430) {
                console.log('403')
                callback('false')
            } else if (xmlHttp.readyState == 4 && xmlHttp.status == 429) {
                console.log('429')
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
 * authentication to the server
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

function getServerCannedMessage(callback) {
    const _theUrl = siteurl + "getcannedmessage";  
    const _data = JSON.stringify({"uid":uid, "email":email})
    httpPostAsync(_theUrl, _data, res => {
        if (res) {
            results = JSON.parse(res);
            if (!results.status) {
                callback(results)
            } else callback(false)
        } else {
            callback(false)
        }
    })
}
/**
 * save canned messages to the server
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
 * save setting favorite mode
 * @param {*} mode 
 */
function saveServerSettingfavorite(mode) {
    const _theUrl = siteurl + "settingfavorite";  
    const _data = JSON.stringify({"uid":uid, "email":email,"favorite":mode})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
}
/* this function cause conflict with watch favorite on server side, duplicate possible

function saveFavorites(f_uid) {
    const _theUrl = siteurl + "auth";  
    const _data = JSON.stringify({"uid":uid, "email":email,"f_uid":f_uid,"favorite_user":1})
    httpPostAsync(_theUrl, _data, res => {

    })
} */
/**
 * unfavorite user
 * @param {string} f_uid user_id unfavorited
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
function saveSendMessage(s_uid, age, address, message) {
    const _theUrl = siteurl + "delaycannedmessage";  
    _data = JSON.stringify({"uid":uid, "email":email,"s_uid":s_uid,"age":age,"address":address, "message":message})
    httpPostAsync(_theUrl, _data, res => {
        console.log(res)
    })
}

function deleteCannedMessage(suid, callback){
    const _theUrl = siteurl + "deletecannedmessage";  
    _data = JSON.stringify({"uid":uid, "email":email,"s_uid":suid})
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