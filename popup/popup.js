/**
 * @author  Zhenfei Nie<youyis2fox@gmail.com>
 */

var timezoneChanged = function(event) {
  var timezone = this.value;

  $('#value').text(timezone);

  chrome.storage.sync.set({'timezone': timezone}, function() {
    console.log('stored', timezone);
  })

  var data = {
    type: 'TIMEZONE_CHANGE',
    value: {
      timezone: timezone
    }
  }

  chrome.tabs.query({url: "http://*.weibo.com/*"}, function(tabs) {
    tabs.forEach(function(tab, i){
      console.log(tab.id, tab.url, data.value);
      chrome.tabs.sendMessage(tab.id, {data: data}, function(response) {
        console.log('res', response);
      })
    });
  })
}


var getTimezone = function() {
  return $('#sel').val();
}

var setTimezone = function(timezone) {
  $('#sel').select2().select2('val', timezone);
  $('#value').text(timezone);
  
}

$(document).ready(function() {
  $("#sel").select2({
    data: timeData
  })
  $('#value').text(getTimezone());

  $('#sel').on('select2:select', timezoneChanged);

  // Get stored timezone value in chrome storage
  chrome.storage.sync.get('timezone', function(items) {
    if ( items.hasOwnProperty('timezone') ) {
      console.log('loaded', items['timezone']);
      setTimezone(items['timezone'])
    } else {
      chrome.storage.sync.set({'timezone': getTimezone()}, function() {
        console.log('stored', getTimezone());
      })
    }
  });
});


