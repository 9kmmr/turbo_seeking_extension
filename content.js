
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.identity) {
            user = localStorage['react-state'];
            authenticate =  getCookie('user_authenticated');
            if (user&&authenticate) {
                chrome.runtime.sendMessage({state:true, detail: user});
            } else
                chrome.runtime.sendMessage({state:false});

            
        }
    }
);

(function() {
    user = localStorage['react-state'];
    authenticate =  getCookie('user_authenticated');
    if (user&&authenticate) {
        chrome.runtime.sendMessage({state:true, detail: user});
    } else
        chrome.runtime.sendMessage({state:false}); 
 })();


