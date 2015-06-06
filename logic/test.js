var WT = {
  feedList: null,

  timer: null,

  count: 0,

  MAX_COUNT: 200, // 200 * 200 == 40s

  observer: null,

  config: { attributes: true, childList: true, characterData: true },

  isInPernalPage: function() {
    return window.location.href.indexOf('/u/') > 0;
  },

  /**
   * TODO
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
    return beijingTime.clone().tz('Europe/Zurich');
  },

  // sina's inconsistency
  getFakeTime: function(srcTime, dstTime) {
    var fake = srcTime.clone();
    var diff = srcTime._offset - dstTime._offset;

    fake.subtract(diff, 'minutes');

    return fake
  },

  timeObservers: [],

  timeCorrecter: function(mutaions) {
    this.timeObservers.forEach(function(observer, index){
      observer.disconnect();
    });

    console.log('timeCorrecter', mutaions);

    var target = mutaions[0].target;

    var originTime = target.getAttribute('title');


    target.textContent = originTime;

    var timeStamps = this.getAllTimestamps();
    for ( var i=0; i<1; i++) {
      this.timeObservers[i].observe(timeStamps[i], { attributes: false, childList: true, characterData: true });
    }

  },

  switchTimezone: function(feedList, timeStamps, timezone) {
    timeStamps.forEach(function(ts, index) {
      ts.classList.add('itemdate');

      var originTime = ts.getAttribute('title');

      var srcTime = moment.tz(originTime, "Asia/Shanghai");
      var dstTime = this.switchTo(srcTime);

      // ts.setAttribute('wt-origin-time', originTime);

      ts.textContent = this.formatTime(dstTime);

      for ( var i=0; i<1; i++) {
        console.log('gogo');
        this.timeObservers[i] = new MutationObserver(this.timeCorrecter);
        this.timeObservers[i].observe(timeStamps[i], { attributes: false, childList: true, characterData: true });
      }

      // if ( this.isInPernalPage() ) {
      //   ts.textContent = this.formatTime(dstTime);
      // } else {
      //   var fake = this.getFakeTime(srcTime, dstTime);
      //   // console.log('wocao', ts.getAttribute('date'), fake.unix(), fake.unix() < ts.getAttribute('date'));
      //   ts.textContent = this.formatTime(fake);
      //   // ts.setAttribute('title', this.formatTime(fake));
      //   ts.setAttribute('date', fake.unix()); 
      //   console.log('fake:', fake, fake.format());
      //   console.log('src:', srcTime, srcTime.format());
      //   console.log('dst:', dstTime, dstTime.format());

      // }
    }, this);
    console.log('window.location.href', window.location.href);
  },

  mutationHandler: function(mutations) {
    console.log('muuuuuuutaions', this.feedList);
    var timezone = 0;
    this.switchTimezone(this.feedList, this.getAllTimestamps(), timezone);
  },

  reset: function() {
    console.log('-- reset --\n');
    this.timeObservers.forEach(function(observer, index){
      observer.disconnect();
      observer = null;
    });
    this.timeObservers = [];
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
    // TODO: not hardcode
    this.reset            = this.reset.bind(this);
    this.set              = this.set.bind(this);
    this.mutationHandler  = this.mutationHandler.bind(this);
    this.switchTimezone   = this.switchTimezone.bind(this);
    this.switchTo         = this.switchTo.bind(this);
    this.isInPernalPage   = this.isInPernalPage.bind(this);
    this.getFakeTime      = this.getFakeTime.bind(this);
    this.formatTime       = this.formatTime.bind(this);
    this.timeCorrecter    = this.timeCorrecter.bind(this);

    this.reset();    
  }

}

document.addEventListener('DOMContentLoaded', WT.ready.bind(WT));


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //here we get the new 
  console.log("URL CHANGED: " + request.data.url);
  WT.reset();
});

