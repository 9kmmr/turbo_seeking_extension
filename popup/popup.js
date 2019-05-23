
var currentpage, page_index, next_page,m;

var cannedmessage1,cannedmessage2,cannedmessage3,cannedmessage4,cannedmessage5;

var listusersentmessage=[];

var port = chrome.runtime.connect();

chrome.extension.sendMessage({ getidentity: 1 }, function (res) {
    
    if (res) {
        chrome.extension.sendMessage({ getsettings: 1 }, function (response) {
            
            if (response) {
                if (response.delaymode=="on") {
                    document.getElementById('delaymode').setAttribute('checked',true);
                }
                if (response.favoritemode=="on") {
                    document.getElementById('favoritemode').setAttribute('checked',true);
                }
            }
        })
        chrome.extension.sendMessage({ getcannedmessages: 1 }, function (response) {
            
            if (response) {
                response = JSON.parse(response);
                cannedmessage1 = response.message1;
                cannedmessage2 = response.message2;
                cannedmessage3 = response.message3;
                cannedmessage4 = response.message4;
                cannedmessage5 = response.message5; 
                $('#messagenumber1').val(cannedmessage1)
                $('#messagenumber2').val(cannedmessage2)
                $('#messagenumber3').val(cannedmessage3)
                $('#messagenumber4').val(cannedmessage4)
                $('#messagenumber5').val(cannedmessage5)
                

            }

        })

        

        chrome.extension.sendMessage({ getlastsearch: 1 }, function (response) {            
            if (response) {
                $('#search-url').val(response);

                compileSettingSearchFromUrl(response);


            }
        })
        chrome.extension.sendMessage({ usersentmessage: 1 }, function (response) {  
            console.log(response)
            listusersentmessage = response;
            chrome.extension.sendMessage({ getHistory: 1 }, function (response) {            
                if (response) {                
                    if (response.length)
                    {   
                        response.forEach(element => {                        
                            showProfiles(element, function(){          
                            })
                        });
                    }
                }
            })
        })
        
        chrome.extension.sendMessage({ getPageIndex: 1 }, function (response) {            
            if (response) {
                page_index = response;
                console.log(page_index)
            }
        })
        chrome.extension.sendMessage({ getNextPage: 1 }, function (response) {            
            if (response) {
                next_page = response;
                console.log(next_page)
            }
        })
        
        chrome.extension.sendMessage({ getDelayedMessages: 1 }, function (response) {            
            if (response) {
                if (response.length) {
                    response.forEach(element => {
                        if (element) {
                            html='<div class="row" id="delay-user-"'+(element.s_uid)+'>'  
                                    +'<div class="col-xs-7">'                                    
                                        +'<div><b>Address:</b> '+(element.address)+'</div>'
                                        +'<div><b>age:</b>'+(element.age)+'</div>'
                                        +'<div><b> message:</b> '+(element.message)+'</div>'
                                    +'</div>'
                                    +'<div class="col-xs-3"></div>'
                                    +'<div class="col-xs-2">'
                                        +'<a class="btn btn-sm btn-danger btn-delete-delay" data-suid="'+(element.s_uid)+'" href="#" role="button">Delete</a>'
                                    +'</div>'                                        
                                +'</div>';
                            $('#results-delayed-messages').append(html);
                        }
                    });
                }
                console.log(response)
            }
        })
        
        

        document.getElementById("authenticated").style.display = "block";

    } else {
        document.getElementById("not-auth").style.display = "block";
    }
})

searchbtn = document.getElementById('start-search');
searchbtn.onclick = function(e){
    e.preventDefault();
    currentpage=null;
    page_index=null;
    next_page=null;
    $('#result-search-section').empty();
    searchurl = document.getElementById('search-url').value ;
    if (searchurl) {
        chrome.extension.sendMessage({ savelastsearch: searchurl }, function (res) {})
        chrome.extension.sendMessage({ firstsearch: true }, function (res) {})
        compileSettingSearchFromUrl(searchurl);
        dosearch(searchurl);
    }
}

function dosearch(url) {
    $('#result-search-section').append("<img id='ajax-loader' src='./popup/flick-loader.gif' width='40px' height='40px' >")
    $('#err-banned').remove();
    chrome.extension.sendMessage({ startsearch: url }, function (response) {
        
        if (response) {
            if (typeof(response)!=="string") {
                currentpage = response.currentpage;
                next_page = response.next_page;
                console.time('response')
                showProfiles(response.profiles, function(){
                    console.timeEnd('response')
                    $('#ajax-loader').remove();                
                })
            } else if (response=="banned") {
                $('#ajax-loader').remove();   
                $('#result-search-section').append('<h5 id="err-baned">Sorry! You have been banned temporarily , Please try again after 2 minutes.</h5>')
            }
        } 
        return true;           
    })
    return false;
}

function showProfiles(data, callback) {
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        insertProfile(element, done => {
            
           callPhoto(element.user_uid)
        })
    }
    
    callback();
}

function insertProfile(element, callback)  {
    
    tmp = '<div class="profiles" data-uid="'+element.user_uid+'">'   
                +'<div id="carousel-'+element.user_uid+'" class="carousel slide" data-ride="carousel" data-pause="false">'
                    +'<div class="carousel-inner" id="carousel-inner-'+element.user_uid+'">'
                        +'<div class="item active">'
                            +'<img src="'+element.pic+'">'
                        +'</div>'                        
                    +'</div>'
                +'</div>'      
                
                +'<div class="button-functions" data-uid="'+element.user_uid+'">'                    
                        +'<input class="toggle-heart-check" type="checkbox" data-uid="'+element.user_uid+'" id="cb_'+element.user_uid+'"  '+(element.favorited?"checked":"")+' />'
                        +'<label class="toggle-heart" for="cb_'+element.user_uid+'" data-toggle="tooltip" data-placement="top" title="'+(element.favorited?"UnFavorite":"Favorite")+'">❤</label>'
                    
                        +'<button  class="canned-btn-send-mes dropdown"  data-toggle="tooltip" data-placement="top" title="'+cannedmessage1+'">#1'
                        +'<div class="dropdown-content">'
                            +'<a href="#" data-mode="delay">Delay Mode</a>'
                            +'<a href="#" data-mode="message">Message Mode</a>'
                        +'</div>'
                        +'</button>'
                        +'<button  class="canned-btn-send-mes dropdown"  data-toggle="tooltip" data-placement="top" title="'+cannedmessage2+'">#2'
                        +'<div class="dropdown-content">'
                            +'<a href="#" data-mode="delay">Delay Mode</a>'
                            +'<a href="#" data-mode="message">Message Mode</a>'
                        +'</div>'
                        +'</button>'
                        +'<button  class="canned-btn-send-mes dropdown"  data-toggle="tooltip" data-placement="top" title="'+cannedmessage3+'">#3'
                        +'<div class="dropdown-content">'
                            +'<a href="#" data-mode="delay">Delay Mode</a>'
                            +'<a href="#" data-mode="message">Message Mode</a>'
                        +'</div>'
                        +'</button>'
                        +'<button  class="canned-btn-send-mes dropdown"  data-toggle="tooltip" data-placement="top" title="'+cannedmessage4+'">#4'
                        +'<div class="dropdown-content">'
                            +'<a href="#" data-mode="delay">Delay Mode</a>'
                            +'<a href="#" data-mode="message">Message Mode</a>'
                        +'</div>'
                        +'</button>'
                        +'<button  class="canned-btn-send-mes dropdown"  data-toggle="tooltip" data-placement="top" title="'+cannedmessage5+'">#5'
                        +'<div class="dropdown-content">'
                            +'<a href="#" data-mode="delay">Delay Mode</a>'
                            +'<a href="#"data-mode="message" >Message Mode</a>'
                        +'</div>'
                        +'</button>'
                        +((element.sent||(listusersentmessage.indexOf(element.user_uid)!==-1))?'<span id="sent_'+(element.user_uid)+'" class="glyphicon glyphicon-send" style="color:#07e818;margin-top:-20px;" data-toggle="tooltip" title="Message sent"></span>':'')
                       // +((listusersentmessage.indexOf(element.user_uid)!==-1)?'<span class="glyphicon glyphicon-send" style="color:#07e818;margin-top:-20px;" data-toggle="tooltip" title="Message sent"></span>':'')
                +'</div>'
                +'<div class="user-details">'
                    +'<span class="user-address">'+element.location+'</span>'
                    +'-'
                    +'<span class="user-age">'+element.age+'</span>'
                    +'-'
                    +'<span class="user-body">'+element.body+'</span>'
                    +'-'
                    +'<span class="user-height">'+element.height+'</span>'
                +'</div>'                
            +'</div>';

            $('#result-search-section').append(tmp);
    callback();
}

function callPhoto(user_uid){
    chrome.extension.sendMessage({ getallphotos: user_uid }, function (res) {
        if (res) {
            if (typeof(res)!=="string") {
                combinePhoto(res,  photohtml => {
                    $('#carousel-inner-'+user_uid+'').append(photohtml);
                    if (res.length) 
                        $('<a class="right carousel-control" href="#carousel-'+user_uid+'" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>').insertAfter('#carousel-inner-'+user_uid+'');
                })
            } else if (res=="banned") {
                console.log("banned");
            }
        }
    })
}

function combinePhoto(photos, callback) {
    html = "";
    if (photos)
    photos.forEach((element,index) => {
        html += '<div class="item ">'
                +'<img src="'+element+'">'
                +'</div>';
    });
    callback(html)
}
// sceamless scroll
result_search_section = document.getElementById('result-search-section');
result_search_section.addEventListener('scroll', function(event) { 
    event.preventDefault();   
    if(event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight){
        if (next_page) { 
            if (page_index!=currentpage) {
                dosearch(next_page);
                page_index=currentpage;
            }          
        }
    }
})



/******************************************** FAVORITE ************************************/
$(document).on('click','.toggle-heart',function(){
    
    checkheart = $("#"+$(this).attr("for"));
    const datauid = $(checkheart).data('uid');
    if ($(checkheart).prop('checked')) {
        $(this).prop('checked',false)
        console.log('unfavorite')
        unfavorite(datauid, res => {
            if (!res) {
                $(checkheart).prop("checked",true);
            }
        })        
    } else {
        $(this).prop('checked',true)
        console.log('favorite')
        favorite(datauid, res => {
            if (!res) {
                $(checkheart).prop("checked",false);
            }
        })
    }
})

function favorite(uid, callback) {
    chrome.extension.sendMessage({ favorite: uid }, function (response) {  
        
        if (response) {
            
            if (typeof(response)=="string"&&response=="banned") {
                alert("You have been banned temporarily from server, Please try again after 2 minutes");
                callback(false)
            } else
                callback(true);
        } else {
            callback(false);
        }
    })
}
function unfavorite(uid, callback) {
    chrome.extension.sendMessage({ unfavorite: uid }, function (response) {        
        if (response) {
            if (typeof(response)=="string"&&response=="banned") {
                alert("You have been banned temporarily from server, Please try again after 2 minutes");
                callback(false)
            } else
                callback(true);
        } else {
            callback(false);
        }
    })
}


/****************************************** SEND MESSAGE****************************** */

$(document).on('click','.canned-btn-send-mes a',function(e){
    const button = $(this).parent().parent();
    const uid = $(button).parent().data('uid');
    mess = $(button).prop('title');
    mode = $(this).data("mode");
    address = $($($(button).parent().parent().find(".user-details")[0]).find(".user-address")[0]).text();
    age= $($($(button).parent().parent().find(".user-details")[0]).find(".user-age")[0]).text();
    
    sendMessage(uid, mess, age, address, mode,  res => {

        if (!res) {
            $(button).css("background-color","#666");
            console.log('failed to send message');
            $(button).attr("disabled",false)
        } else {
            $(button).css("background-color","#ff0000d9");
            $(button).attr("disabled",true) 
            console.log($('#sent_'+uid).length)
            if (!$('#sent_'+uid).length)  {
                
                $(button).parent().append('<span class="glyphicon glyphicon-send" style="color:#07e818;margin-top:-20px;" data-toggle="tooltip" title="Message sent"></span>')
            }
        }
    })
})
function sendMessage(uid, messages, _age, _address , _mode, callback) {
    chrome.extension.sendMessage({ sendmessage: uid, message: messages ,age:_age, address:_address, mode: _mode}, function (response) {        
        if (response) {
            if (response.status==200) {
                callback(true)
            } else if (response.status==400) {
                alert("You have reach the limit of send message please upgrade account.");
                callback(false)
            } else if (response.status==429) {
                alert("You have been banned temporarily from server, Please try again after 2 minutes");
                callback(false)
            } else 
                callback(false)
            
        } else {
            callback(false);
        }
    })
}



/******************************************* SETTINGS ****************************** */
// delay mode

// favorite mode
$('#favoritemode').change(function(){
    value=($(this).is(':checked')?"on":"off");
    
    setFavoritemode(value, res => {
        if (!res) {

        }
    })
})
function setFavoritemode(value, callback) {
    chrome.extension.sendMessage({ savefavoritemode: value }, function (response) {        
        if (response) {
            callback(true);
        } else {
            callback(false);
        }
    })
}


/****************************************CANNED MESSSAGE **************************** */

$('#save-setting').click(function(){
    message_save1 = $('#messagenumber1').val() || 'Hey';
    message_save2 = $('#messagenumber2').val() || 'Hey';
    message_save3 = $('#messagenumber3').val() || 'Hey';
    message_save4 = $('#messagenumber4').val() || 'Hey';
    message_save5 = $('#messagenumber5').val() || 'Hey';
    saveCannedMessage(JSON.stringify({"message1":message_save1,"message2":message_save2,"message3":message_save3,"message4":message_save4,"message5":message_save5 }), res => {
        if (!res) {
            
        } else {
            cannedmessage1 = message_save1;
            cannedmessage2 = message_save2;
            cannedmessage3 = message_save3;
            cannedmessage4 = message_save4;
            cannedmessage5 = message_save5;
        }
    })

})
function saveCannedMessage(data, callback) {
    chrome.extension.sendMessage({ savecannedmessages: data }, function (response) {        
        if (response) {
            callback(true);
        } else {
            callback(false);
        }
    })
}

$(document).on('click','.btn-delete-delay', function(){
    suid = $(this).data('suid');
    deleteCannedMessage(suid, res => {
        if (res) {
            $('#delay-user-"'+(suid)+'').remove();
        } else {
            alert("Delete delay message failed");
        }
    })

})

function deleteCannedMessage(suid, callback){
    chrome.extension.sendMessage({ deletecannedmessages: suid}, function (response) {        
        if (response) {
            
            callback(true);
        } else {
            callback(false);
        }
    })
}

/**
 * optional setting
 */

$('#maxage').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})
$('#minage').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})
$('#bodytype').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})
$('#ethnicity').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})
$('#smoking').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})
$('#drinking').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})
$('#haircolor').change(function(){
    
    $('#search-url').val( "https://www.seeking.com/search?"+$('#setting-form').serialize()+"&radius=100");
    
})


function compileSettingSearchFromUrl(url_string){
    var url = new URL(url_string);
    
    let maxage = url.searchParams.get("max-age");
    let minage = url.searchParams.get("min-age");

    let bodytype = url.searchParams.get("body_type");
    let ethnicity = url.searchParams.get("ethnicity");
    let smoking = url.searchParams.get("smoking");
    let drinking = url.searchParams.get("drinking");
    let hair_color = url.searchParams.get("hair_color");

    let bodytype_arr = url.searchParams.getAll("body_type[]");
    let ethnicity_arr = url.searchParams.getAll("ethnicity[]");
    let smoking_arr = url.searchParams.getAll("smoking[]");
    let drinking_arr = url.searchParams.getAll("drinking[]");
    let hair_color_arr = url.searchParams.getAll("hair_color[]");
       
    console.log(bodytype_arr)

    if (maxage)
        $('#maxage').val(parseInt(maxage))
    if (minage)
        $('#minage').val(parseInt(minage))

    if (bodytype) {
        $('#bodytype').selectpicker('deselectAll');
        $('#bodytype').selectpicker('val', bodytype);
    } else if (bodytype_arr.length) {
        $('#bodytype').selectpicker('deselectAll');
        $('#bodytype').selectpicker('val', bodytype_arr);
    }
    if (ethnicity) {
        $('#ethnicity').selectpicker('deselectAll');
        $('#ethnicity').selectpicker('val', ethnicity);
    } else if (ethnicity_arr.length) {
        $('#ethnicity').selectpicker('deselectAll');
        $('#ethnicity').selectpicker('val', ethnicity_arr);
    }
    if (drinking)  {
        $('#drinking').selectpicker('deselectAll');
        $('#drinking').selectpicker('val', drinking);
    } else if (drinking_arr.length) {
        $('#drinking').selectpicker('deselectAll');
        $('#drinking').selectpicker('val', drinking_arr);
    }
    if (hair_color) {
        $('#haircolor').selectpicker('deselectAll');
        $('#haircolor').selectpicker('val', hair_color);
    } else if (hair_color_arr.length) {
        $('#haircolor').selectpicker('deselectAll');
        $('#haircolor').selectpicker('val', hair_color_arr);
    }
    if (smoking) {
        $('#smoking').selectpicker('deselectAll');
        $('#smoking').selectpicker('val', smoking);
    } else if (smoking_arr.length) {
        $('#smoking').selectpicker('deselectAll');
        $('#smoking').selectpicker('val', smoking_arr);
    }
    
}