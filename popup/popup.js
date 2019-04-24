
var currentpage, page_index, next_page,m;

var cannedmessage1,cannedmessage2,cannedmessage3,cannedmessage4,cannedmessage5;

chrome.extension.sendMessage({ getidentity: 1 }, function (res) {
    
    if (res) {
        chrome.extension.sendMessage({ getsettings: 1 }, function (response) {
            console.log(response)
            if (response=="on") {
                document.getElementById('delaymode').setAttribute('checked',true);
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

        document.getElementById("authenticated").style.display = "block";

    } else {
        document.getElementById("not-auth").style.display = "block";
    }
})

searchbtn = document.getElementById('start-search');
searchbtn.onclick = function(e){
    e.preventDefault();
    next_page=null;
    page_index=null;
    next_page=null;
    $('#result-search-section').empty();
    searchurl = document.getElementById('search-url').value ;
    if (searchurl) {
        dosearch(searchurl);
    }
}

function dosearch(url) {
    $('#result-search-section').append("<p id='ajax-loader' style='color:red;' >Loading...</p>")
    chrome.extension.sendMessage({ startsearch: url }, function (response) {
        
        if (response) {
            currentpage = response.currentpage;
            next_page = response.next_page;
            page_index = currentpage;
            console.log(response)
            showProfiles(response.profiles, function(){
                $('#ajax-loader').remove();
                
            })
        } 
        return true;           
    })
    return false;
}

function showProfiles(data, callback) {
    data.forEach(element => {
        combinePhoto(element.photos,  photo=> {
            
            tmp = '<div class="profiles" data-uid="'+element.user_uid+'">'   
                +'<div id="carousel-'+element.user_uid+'" class="carousel slide" data-ride="carousel" data-pause="false">'
                    +'<div class="carousel-inner">'
                        +(photo)
                    +'</div>'
                    
                    +(element.photos.length>1?'<a class="right carousel-control" href="#carousel-'+element.user_uid+'" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>':'')
                +'</div>'      
                
                +'<div class="button-functions" data-uid="'+element.user_uid+'">'                    
                        +'<input class="toggle-heart-check" type="checkbox" data-uid="'+element.user_uid+'" id="cb_'+element.user_uid+'"  '+(element.favorited?"checked":"")+' />'
                        +'<label class="toggle-heart" for="cb_'+element.user_uid+'" data-toggle="tooltip" data-placement="top" title="'+(element.favorited?"UnFavorite":"Favorite")+'">❤</label>'
                    
                        +'<button  class="canned-btn-send-mes "  data-toggle="tooltip" data-placement="top" title="'+cannedmessage1+'">#1</button>'
                        +'<button  class="canned-btn-send-mes "  data-toggle="tooltip" data-placement="top" title="'+cannedmessage2+'">#2</button>'
                        +'<button  class="canned-btn-send-mes "  data-toggle="tooltip" data-placement="top" title="'+cannedmessage3+'">#3</button>'
                        +'<button  class="canned-btn-send-mes "  data-toggle="tooltip" data-placement="top" title="'+cannedmessage4+'">#4</button>'
                        +'<button  class="canned-btn-send-mes "  data-toggle="tooltip" data-placement="top" title="'+cannedmessage5+'">#5</button>'

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
        })
        
    });
    callback();
}
function combinePhoto(photos, callback) {
    html = "";
    if (photos)
    photos.forEach((element,index) => {
        html += '<div class="item '+(index==0?"active":"")+'">'
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
            if (page_index!=next_page){
                dosearch(next_page);
                page_index=next_page;
            }
        }
    }
})



/******************************************** FAVORITE ************************************/

$('.toggle-heart').click(function(){
    console.log($(this).data("for"))
    checkheart = $("#"+$(this).data("for"));
    const datauid = $(checkheart).data('uid');
    console.log(datauid)
    if( $(checkheart).is(':checked') ) {
        console.log('checked')
        favorite(datauid, res => {
            if (!res) {
                $(checkheart).prop("checked",false);
            }
        })
    } else {
        console.log('unchecked')
        unfavorite(datauid, res => {
            if (!res) {
                $(checkheart).prop("checked",true);
            }
        })
    }
})

function favorite(uid, callback) {
    chrome.extension.sendMessage({ favorite: uid }, function (response) {        
        if (response) {
            callback(true);
        } else {
            callback(false);
        }
    })
}
function unfavorite(uid, callback) {
    chrome.extension.sendMessage({ unfavorite: uid }, function (response) {        
        if (response) {
            callback(true);
        } else {
            callback(false);
        }
    })
}


/****************************************** SEND MESSAGE****************************** */

$('.canned-btn-send-mes').click(function(e){
    e.preventDefault();
    const uid = $(this).parent().data('uid');
    mess = $(this).prop('title');
    sendMessage(uid, mess, res => {
        if (!res) {
            console.log('failed to send message');
        }
    })
})
function sendMessage(uid, messages, callback) {
    chrome.extension.sendMessage({ sendmessage: uid, message: messages }, function (response) {        
        if (response) {
            callback(true);
        } else {
            callback(false);
        }
    })
}



/******************************************* SETTINGS ****************************** */

$('#delaymode').change(function(){
    value=($(this).is(':checked')?"on":"off");
    console.log(value);
    setDelaymode(value, res => {
        if (!res) {

        }
    })
})

function setDelaymode(value, callback) {
    chrome.extension.sendMessage({ savesetting: value }, function (response) {        
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