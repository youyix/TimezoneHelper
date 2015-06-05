var WT = {
  feedList: null,

  timer: null,

  count: 0,

  MAX_COUNT: 200, // 200 * 200 == 40s

  observer: null,

  config: { attributes: true, childList: true, characterData: true },

  /**
   * TODO
   * 
   * @method  getAllTimestamps
   * @return array array of timestamps
   */
  getAllTimestamps: function() {
    return Array.prototype.slice.call(document.querySelectorAll('[node-type="feed_list_item_date"]'));
  },

  switchTo: function(srcTime) {
    var beijingTime = moment.tz(srcTime, "Asia/Shanghai");
    var zurichTime = beijingTime.clone().tz('Europe/Zurich');
    return zurichTime.format().replace('T', ' ').substr(0, 16);    
  },

  switchTimezone: function(feedList, timeStamps, timezone) {
    timeStamps.forEach(function(ts, index) {
      ts.classList.add('itemdate');
      var srcTime = ts.getAttribute('title');
      var dstTime = this.switchTo(srcTime);
      ts.textContent = dstTime;
    }, this);
  },

  mutationHandler: function(mutations) {
    console.log('muuuuuuutaions', this.feedList);
    var timezone = 0;
    this.switchTimezone(this.feedList, this.getAllTimestamps(), timezone);
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
        this.timer = window.setTimeout(this.set, 200); 
        return
      } 
      this.count = 0;
      console.log('Found', this.feedList);

      if ( this.observer ) this.observer.disconnect();
      this.observer = new MutationObserver(this.mutationHandler);
      this.observer.observe(this.feedList, this.config);
      this.mutationHandler();
    }
  },

  ready: function() {
    this.reset = this.reset.bind(this);
    this.set = this.set.bind(this);
    this.mutationHandler = this.mutationHandler.bind(this);
    this.switchTimezone = this.switchTimezone.bind(this);
    this.switchTo = this.switchTo.bind(this);

    this.reset();    
  }

}

document.addEventListener('DOMContentLoaded', WT.ready.bind(WT));


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //here we get the new 
  console.log("URL CHANGED: " + request.data.url);
  WT.reset();
});

