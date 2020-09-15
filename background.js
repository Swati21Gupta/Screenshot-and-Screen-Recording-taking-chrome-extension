// Listening for messages
chrome.runtime.onMessage.addListener(receiver);

// option receiver
function receiver(request, sender, sendResponse) {
  if (request.message === "screenShot") {
    screenshot.init();
  }
  if (request.message === "screenRecording") {
    screenRecording();
  }
  if (request.message === "preview") {
    screenshot.saveScreenshot();
  }
  if (request.message === "back") {
    screenshot.data = '';
    chrome.tabs.remove(screenshot.targetId );
  }
}

// Take screenShot and Save Image
screenshot = {
  content: document.createElement("canvas"),
  data: '',
  id: 1,

  // initialization
  init: function () {
    this.initEvents();
  },

  // to save the Image
  saveScreenshot: function () {
    var image = new Image();
    image.onload = function () {
      var canvas = screenshot.content;
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);

      // save the image
      var link = document.createElement('a');
      link.download = "download.png";
      link.href = screenshot.content.toDataURL();
      link.click();
      screenshot.data = '';
    };
    image.src = screenshot.data;
  },

  // open url for screenShot
  initEvents: function () {
    chrome.tabs.captureVisibleTab(null, {
      format: "png",
      quality: 100
    }, function (data) {
      screenshot.data = data;
      const viewTabUrl = chrome.extension.getURL('screenshot.html?id=' + screenshot.id++)
      let targetId = null;
      chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
        if (tabId != targetId || changedProps.status != "complete")
          return;
        chrome.tabs.onUpdated.removeListener(listener);
        const views = chrome.extension.getViews();
        for (let i = 0; i < views.length; i++) {
          let view = views[i];
          if (view.location.href == viewTabUrl) {
            view.setScreenshotUrl(data);
            break;
          }
        }
      });
      chrome.tabs.create({ url: viewTabUrl }, (tab) => {
        targetId = tab.id;
        screenshot.targetId = targetId;
      });
    });
  },
};

// take screen recording
function screenRecording() {
  chrome.desktopCapture.chooseDesktopMedia(['screen', 'audio'],
    function onAccessApproved(id) {
      let recordedChunks = [];
      const constraints = {
        "video": {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: id,
            minWidth: 1280,
            minHeight: 720,
            maxWidth: 1280,
            maxHeight: 720
          }
        },
        "audio": false
      };

      navigator.mediaDevices.getUserMedia(constraints).then(gotMedia).catch(e => {
        console.error('getUserMedia() failed: ' + e);
      });

      function gotMedia(stream) {
        theStream = stream;
        var binaryData = [];
        binaryData.push(stream);
        
        try {
          recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        } catch (e) {
          console.error('Exception while creating MediaRecorder: ' + e);
          return;
        }

        theRecorder = recorder;
        recorder.ondataavailable =
          (event) => { recordedChunks.push(event.data); };
        recorder.start(100);


        stream.getVideoTracks()[0].onended = function () {
          download();
        };
      }


      function download() {
        theRecorder.stop();
        theStream.getTracks().forEach(track => { track.stop(); });

        var blob = new Blob(recordedChunks, { type: "video/webm" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = 'test.webm';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 100);
      }
    })
}
