chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  if(changeInfo && changeInfo.status == "complete"){
      console.log("Tab updated: " + tab.url, tab.id);
      var data = {
        type: "URL_CHANGE",
        value: {
          url: tab.url
        }
      }
      chrome.tabs.sendMessage(tabId, {data: data}, function(response) {
          console.log(response);
      });

  }
});