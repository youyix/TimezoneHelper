/**
 * @author  Zhenfei Nie<youyis2fox@gmail.com>
 */

var timezoneChanged = function(evt) {
    var timezone = evt.detail.value;
    document.querySelector('#title').innerHTML = timezone;
    chrome.storage.sync.set({
        'timezone': timezone
    }, function() {
        console.log('stored', timezone);
    });
    var data = {
        type: 'TIMEZONE_CHANGE',
        value: {
            timezone: timezone
        }
    };
    chrome.tabs.query({
        url: 'http://*.weibo.com/*'
    }, function(tabs) {
        tabs.forEach(function(tab, i) {
            console.log(tab.id, tab.url, data.value);
            chrome.tabs.sendMessage(tab.id, {
                data: data
            }, function(response) {
                console.log('res', response);
            });
        });
    });
};
var getTimezone = function() {
    return document.querySelector('#timezone-picker').value;
};
var setTimezone = function(value) {
    document.querySelector('#timezone-picker').value = value;
};
HTMLImports.whenReady(function() {
    var combobox = combobox || document.querySelector('#timezone-picker');
    combobox.items = timezoneData;
    console.log('here', combobox, timezoneChanged);
    combobox.addEventListener('value-changed', timezoneChanged);
    chrome.storage.sync.get('timezone', function(items) {
        if (items.hasOwnProperty('timezone')) {
            console.log('loaded', items.timezone);
            setTimezone(items.timezone);
        } else {
            chrome.storage.sync.set({
                'timezone': getTimezone()
            }, function() {
                console.log('stored', getTimezone());
            });
        }
    });
});
