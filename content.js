
function setScreenshotUrl(url) {
  document.getElementById('target').src = url;
  setTimeout(()=>{
    if (confirm('Do you want to save capture of this screen?')) {
      chrome.runtime.sendMessage({ message: "preview" });
    } else {
      chrome.runtime.sendMessage({ message: "back" });
    }
  },100)
  
}

let screenShot = document.getElementById('screenShot');
if (screenShot) {
  screenShot.onclick = function (element) {
    chrome.runtime.sendMessage({ message: "screenShot" });
  }
}

let screenRecording = document.getElementById('screenRecording');
if (screenRecording) {
  screenRecording.onclick = function (element) {
    chrome.runtime.sendMessage({ message: "screenRecording" });
  }
}
