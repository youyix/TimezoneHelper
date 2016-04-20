// TOOD: 
// 1) bug: when changing the timezone, the changes are not cascading 
// 2) Webpack
(function(document, window) {
    'use strict';
    var isDebug = true;

    var debug = function() {
        if (isDebug) {
            console.log.apply(console, arguments)
        }
    };

    var toArray = function(data) {
        return Array.prototype.slice.call(data);
    }

    var query = function() {
        return document.querySelector.apply(document, arguments);
    }

    var queryAll = function() {
        return toArray(document.querySelectorAll.apply(document, arguments));
    }

    var startObserve = function(observer, node, config, mutationHandler) {
        if (observer) {
            observer.disconnect();
        }
        observer = new MutationObserver(mutationHandler);
        observer.observe(node, config);
    }

    var feedList = null;

    var timer = null;

    var timeInterval = 200;

    var count = 0;
    var MAX_COUNT = 200;

    var observer = null;

    var ORIGINAL_TIMEZONE = 'Asia/Shanghai';

    var dstTimezone = 'Asia/Shanghai';

    var formatTime = function(time) {
        return time.format().replace('T', ' ').substr(0, 16);
    };

    var getTimestamps = function() {
        return queryAll('[node-type="feed_list_item_date"]');
    };

    var init = function() {
        if (feedList !== null) {
            return;
        }

        feedList = query('[node-type=feed_list]');      
        // if cannot find the feedList, then try to find 
        // again after 200ms; stop if find that or reach
        // 200 times
        if (feedList === null && count++ < MAX_COUNT) {     
            timer = window.setTimeout(init, timeInterval);
            return;
        }
        var config = { childList: true, characterData: true };
        startObserve(observer, feedList, config, mutationHandler);
        switchTimezone(ORIGINAL_TIMEZONE, dstTimezone, getTimestamps());
    };

    var mutationHandler = function(mutations) {
        debug('Mutations observed:', feedList, mutations);
        switchTimezone(ORIGINAL_TIMEZONE, dstTimezone, getTimestamps());
    };

    var switchTimezone = function(srcTimezone, dstTimezone, timestamps) {
        timestamps.forEach(function(ts) {
            var originTime = ts.getAttribute('title');
            var srcTimeObj = moment.tz(originTime, srcTimezone);
            var dstTimeObj = srcTimeObj.clone().tz(dstTimezone); 

            insertTimestamp(ts, srcTimeObj, dstTimeObj, srcTimezone, dstTimezone);
        });
    }

    var setAttributes = function(node, attrs) {
        Object.keys(attrs).forEach(function(key) {
            node.setAttribute(key, attrs[key]);
        });
    }

    var insertTimestamp = function(ts, srcTimeObj, dstTimeObj, srcTimezone, dstTimezone) {
        ts.setAttribute('hidden', true);
        var originTime = ts.getAttribute('title');
        var node = ts.parentNode.querySelector('a[wt-signature=wt]');
        var dstTime = formatTime(dstTimeObj);

        if (node === null) {
            node = document.createElement('a');
            node.textContent = dstTime;
            var attributes = {
                'wt-signature': 'wt',
                'target': ts.getAttribute('target'),
                'href': ts.getAttribute('href'),
                'origin-time': originTime,
                'src-timezone': srcTimezone,
                'dst-timezone': dstTimezone,
                'dst-time': dstTime
            }
            setAttributes(node, attributes);
            node.classList = ts.classList;
            node.classList.add('bg-success');
            ts.parentNode.insertBefore(node, ts);

            setTooltip(node, 
                {'title': 'Beijing:' + originTime}, 
                {'data-toggle': 'tooltip', 'data-placement': 'right'}
            );
        } else if (node.getAttribute('dst-timezone') !== dstTimezone)  {
            node.setAttribute('dst-timezone', dstTimezone);
            node.setAttribute('dst-time', formatTime(dstTimeObj));
            node.textContent = dstTime;

            setTooltip(node, {'title': 'Beijing:' + originTime});
        }
    };

    var setTooltip = function(node, data, attributes) {
        setAttributes(node, attributes);
        $(node).tooltip(data);
    };

    var setDstTimezone = function(timezone) {
        debug(timezone);
        dstTimezone = timezone;
        switchTimezone(ORIGINAL_TIMEZONE, dstTimezone, getTimestamps());
    };

    var refresh = function() {
        if (observer) {
            observer.disconnect();
        }
        observer = null;
        feedList = null;

        init();
    };

    document.addEventListener('DOMContentLoaded', function() {
        chrome.storage.sync.get('timezone', function(items){
            if (items) {
                dstTimezone = items.timezone;
            } 
            refresh();
        });

        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (!request || !request.data || !request.data.type) {
                return;
            }

            switch (request.data.type) {
                case 'URL_CHANGE': 
                    debug("\n-- URL CHANGED: " + request.data.value.url);
                    refresh()
                    break;
                case 'TIMEZONE_CHANGE':
                    debug('Got it', request.data.value.timezone);
                    setDstTimezone(request.data.value.timezone);
                    break;
                default:
                    debug('Unknow type.', request.data);
            }
        });
    });
})(document, window);
