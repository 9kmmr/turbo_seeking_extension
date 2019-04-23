
var currentpage, page_index, next_page,m;

 chrome.extension.sendMessage({ getidentity: 1 }, function (response) {
    if (response) {
        chrome.extension.sendMessage({ getsettings: 1 }, function (response) {
            if (response) {
                document.getElementById('delaymode').setAttribute('checked',true);
            }
        })
        chrome.extension.sendMessage({ getcannedmessages: 1 }, function (response) {
            if (response) {
                console.log(response);
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
            console.log(photo)
            tmp = '<div class="profiles" data-uid="'+element.user_uid+'">'   
                +'<div id="carousel-'+element.user_uid+'" class="carousel slide" data-ride="carousel" data-pause="false">'
                    +'<div class="carousel-inner">'
                        +(photo)
                    +'</div>'
                    
                    +(element.photos.length>1?'<a class="right carousel-control" href="#carousel-'+element.user_uid+'" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>':'')
                +'</div>'      
                
                +'<div class="button-functions">'                    
                        +'<input class="toggle-heart-check" type="checkbox" id="cb_'+element.user_uid+'"  '+(element.favorited?"checked":"")+' />'
                        +'<label class="toggle-heart" for="cb_'+element.user_uid+'" data-toggle="tooltip" data-placement="top" title="'+(element.favorited?"UnFavorite":"Favorite")+'">❤</label>'
                    
                        +'<button id="canned-btn-send-1" class="canned-btn-send-mes" data-toggle="tooltip" data-placement="top" title="Hooray!">#1</button>'
                        +'<button id="canned-btn-send-2" class="canned-btn-send-mes" data-toggle="tooltip" data-placement="top" title="Hooray!">#2</button>'
                        +'<button id="canned-btn-send-3" class="canned-btn-send-mes" data-toggle="tooltip" data-placement="top" title="Hooray!">#3</button>'
                        +'<button id="canned-btn-send-4" class="canned-btn-send-mes" data-toggle="tooltip" data-placement="top" title="Hooray!">#4</button>'
                        +'<button id="canned-btn-send-5" class="canned-btn-send-mes" data-toggle="tooltip" data-placement="top" title="Hooray!">#5</button>'

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

