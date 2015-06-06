var timezoneChanged = function(event) {
  var timezone = this.value;

  $('#value').text(timezone);

  var data = {
    type: 'TIMEZONE_CHANGE',
    value: {
      timezone: timezone
    }
  }

  chrome.tabs.query({url: "http://www.weibo.com/*"}, function(tabs) {
    tabs.forEach(function(tab, i){
      console.log(tab.id, tab.url, data.value);
      chrome.tabs.sendMessage(tab.id, {data: data}, function(response) {
        console.log('res', response);
      })
    });
  })
}

$(document).ready(function() {
  $("#sel").select2({
    data: timeData
  })
  $('#value').text($('#sel').val());

  $('#sel').on('select2:select', timezoneChanged);
});


