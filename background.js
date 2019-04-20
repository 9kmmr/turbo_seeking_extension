uid, email, access_token;
chrome.storage.sync.get(['uid','email','access_token'], function(items){
    uid = items.uid;
    email = items.email;
    access_token = items.access_token;
})


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (request.getidentity) {
        chrome.storage.sync.get(['uid','email','access_token'], function(items){
            uid = items.uid;
            email = items.email;
            access_token = items.access_token;
            if (uid&&email&&access_token) {
                sendResponse(items)
            } else 
                sendResponse(null)

        })
    }
    if (request.saveidentity) {
         
    }
    if (request.updateidentity) {
         
    }
    if (request.savecannedmessages) {
         
    }
    if (request.savecannedmessages) {
         
    }

});