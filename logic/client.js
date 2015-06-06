/**
 *
 * @author  Zhenfei Nie<youyis2fox@gmail.com>
 */


var WT = {
  feedList: null,

  /**
   * ....
   * 
   * @attribute timer
   * @type Object
   * @default null
   */
  timer: null,

  timeInterval: 200,

  count: 0,

  MAX_COUNT: 200,

  observer: null,

  /**
   * @attribute config
   * @type Object
   */
  config: { childList: true, characterData: true },

  srcTimezone: 'Asia/Shanghai',

  dstTimezone: 'Asia/Shanghai',

  setDstTimezone: function(tz) {
    console.log('setDstTimezone', tz);
    this.dstTimezone = tz;
    this.mutationHandler();
  },


  /**
   * ....
   * 
   * @method  getAllTimestamps
   * @return array array of timestamps
   */
  getAllTimestamps: function() {
    return Array.prototype.slice.call(document.querySelectorAll('[node-type="feed_list_item_date"]'));
  },

  formatTime: function(time) {
    return time.format().replace('T', ' ').substr(0, 16);
  },

  switchTo: function(srcTime) {
    var beijingTime = moment.tz(srcTime, "Asia/Shanghai");
    return srcTime.clone().tz(this.dstTimezone);
  },

  switchTimezone: function(feedList, timeStamps) {
    timeStamps.forEach(function(ts, index) {
      var originTime = ts.getAttribute('title');

      var srcTime = moment.tz(originTime, "Asia/Shanghai");
      var dstTime = this.switchTo(srcTime);

      ts.setAttribute('hidden', true);

      var newTs = ts.parentNode.querySelector('a[wt-signature=wt]');
      if ( !newTs ) {
        newTs = document.createElement('a');
        newTs.setAttribute('wt-signature', 'wt');
        newTs.setAttribute('target', ts.getAttribute('target'));
        newTs.setAttribute('href', ts.getAttribute('href'));
        newTs.setAttribute('origin-time', originTime);
        newTs.setAttribute('srctimezone', this.srcTimezone);
        newTs.setAttribute('dsttimezone', this.dstTimezone);
        newTs.setAttribute('title', this.formatTime(dstTime));
        newTs.textContent =  this.formatTime(dstTime);

        newTs.classList.add('itemdate');
        newTs.classList = ts.classList;

        ts.parentNode.insertBefore(newTs, ts);

      } else if ( newTs.getAttribute('dsttimezone') !== this.dstTimezone ) {
        newTs.setAttribute('dsttimezone', this.dstTimezone);
        newTs.setAttribute('title', this.formatTime(dstTime));
        newTs.textContent =  this.formatTime(dstTime);
      }
      
    }, this);
  },

  mutationHandler: function(mutations) {
    console.log('Mutations observed.', this.feedList);
    this.switchTimezone(this.feedList, this.getAllTimestamps());
  },

  reset: function() {
    console.log('-- reset --\n');

    this.count = 0;
    this.timer = null;
    if ( this.observer ) this.observer.disconnect();
    this.observer = null;
    this.feedList = null;

    this.set();
  },

  set: function() {
    if ( ! this.feedList ) {
      console.log('please wait ...');
      this.feedList = document.querySelector('[node-type=feed_list]');
      if ( ! this.feedList && this.count++ < this.MAX_COUNT ) {
        this.timer = window.setTimeout(this.set, this.timeInterval); 
        return
      }
      if ( this.count >= this.MAX_COUNT ) {
        console.log('Not Found');
        return
      } 
      console.log(this.count, this.MAX_COUNT);
      console.log('Found', this.feedList);
      if ( this.observer ) this.observer.disconnect();
      this.observer = new MutationObserver(this.mutationHandler);
      this.observer.observe(this.feedList, this.config);
      this.mutationHandler();
      
    }
  },

  ready: function() {
    chrome.storage.sync.get('timezone', function(items){
      if ( items ) WT.dstTimezone = items.timezone;
      WT.reset();
    })
  }

}

// Alternative: put this inside ready function
for ( var p in WT ) {
  if ( WT.hasOwnProperty(p) && typeof(WT[p]) === 'function' ) {
    WT[p] = WT[p].bind(WT);
  }
}

document.addEventListener('DOMContentLoaded', WT.ready.bind(WT));

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (!request || !request.data || !request.data.type) return

  switch ( request.data.type ) {
    case 'URL_CHANGE': 
      console.log("\n-- URL CHANGED: " + request.data.value.url);
      WT.reset();
      break;
    case 'TIMEZONE_CHANGE':
      console.log('Got it', request.data.value.timezone);
      WT.setDstTimezone(request.data.value.timezone);
      break;
    default:
      console.log('Unknow type.', request.data);
  }
});

