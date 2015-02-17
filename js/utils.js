// Bag of diverse things... all the ugliness, only one place to check :P
var Utils = (function() {

  'use strict';

  var debugUtils = true;
  var debug = debugUtils ? genericDebug.bind(undefined, "EDRoute:Utils"): function () {};

  function genericDebug (topic, msg) {
    console.log('[DEBUG] '+ new Date().toString() + " - " + topic + ': ' + msg + '\n');
  }


  // Doing it generic isn't worth the problem... this expects to send a JSON and get another and will bork otherwise.
  // Also doing a nice and nifty dirty trick to save on petitions to the server...
  function sendXHR(aType, aURL, aData) {
    return new Promise(function(resolve, reject) {

      if (typeof aData === "object") {
        aData = JSON.stringify(aData);
      }

      var cachedValue = window.localStorage.getItem(aData);
      if (cachedValue) {
        debug("send XHR. Using cached value for " + aData);
        resolve(JSON.parse(cachedValue));
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.open(aType, aURL);
      xhr.responseType = "json";
      xhr.overrideMimeType("application/json");

      xhr.setRequestHeader("Content-Type", "application/json"); // Note that this requires
      xhr.setRequestHeader("Content-Length", aData.length);

      xhr.onload = function (aEvt) {
        debug("sendXHR. XHR success. Caching result for " + aData);
        window.localStorage.setItem(aData, JSON.stringify(xhr.response));
        resolve(xhr.response);
      };

      xhr.onerror = function (aEvt) {
        debug("sendXHR. XHR failed " + JSON.stringify(aEvt) + "url: "+ aURL + " Data: " + aData + " RC: " + xhr.responseCode);
        reject(aEvt);
      };

      xhr.send(aData);
    });
  }

//////////////////////////////////////////////////////////////////////////////
// This exists only so I don't have to keep remembering how to do it...
//////////////////////////////////////////////////////////////////////////////
  function addText(aElem, aText) {
    aElem.appendChild(document.createTextNode(aText));
  }

  function createElementAt(aMainBody, aType, aAttrs, aOptionalText, aOptionalImg, aBefore) {
    var elem = document.createElement(aType);

    // Add all the requested attributes
    if (aAttrs){
      for (var i in aAttrs){
        elem.setAttribute(i, aAttrs[i]);
      }
    }

    if (!aBefore) {
      aMainBody.appendChild(elem);
    } else {
      mainBody.insertBefore(elem, aBefore);
    }

    if (aOptionalText) {
      addText(elem, aOptionalText);
    }

    return elem;
  }

//////////////////////////////////////////////////////////////////////////////
// End of useful DOM manipulation...
//////////////////////////////////////////////////////////////////////////////
  return {
    sendXHR: sendXHR,
    debug: genericDebug,
    addText: addText,
    createElementAt: createElementAt
  };

})();
