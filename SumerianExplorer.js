/*
# Copyright (c) 2019 Robert Hogan (robhogan at gmail.com) All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#    * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#    * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#    * Neither the name of Google Inc. nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
console.log("If you have any feedback or issues contact me @mwenge on Twitter or open a ticket at https://github.com/mwenge/LinearBExplorer/issues")
document.onkeydown = checkKey;
function checkKey(e) {
  e = e || window.event;
  var menu_was_showing = help_menu.style.display != "none";
  help_menu.style.display = "none";
  switch(e.keyCode) {
    case 191: // show help
      if (e.shiftKey) {
        if (help_menu.style.display == "block") {
          help_menu.style.display = "none";
        } else if (!menu_was_showing) {
          help_menu.style.display = "block";
        }
        break;
      }
      // fall through
    case 191: // '/' - focus search bar
      if (search == document.activeElement) {
        return true;
      }
      search.focus();
      return false;
    case 83: // 's' - sort inscriptions by closest edit distance to 
             // inscription currently hovered over
      var current = getInscriptionHoveredOver();
      sortNearest(current);
      break;
    case 89: // 'y' - show commentary for inscription currently hovered over
      var current = getInscriptionHoveredOver();
      showCommentaryForInscription(current.id);
      break;
  }
}

function showCommentaryForInscription(inscription) {
  var inscriptionElement = document.getElementById(inscription);

  var commentBox = document.getElementById("comment-box-" + inscription);
  if (commentBox) {
    if (commentBox.style.display == "block") {
      commentBox.style.display = "none";
      return;
    }
    commentBox.style.display = "block";
    return;
  }

  var commentBox = document.createElement("div")
  commentBox.className = 'comment-box';
  commentBox.id = 'comment-box-' + inscription;
  commentBox.style.top = inscriptionElement.offsetHeight + "px";
  commentBox.addEventListener("click", makeHideElements([commentBox]));
  inscriptionElement.appendChild(commentBox);

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
			if (xhttp.status == 404) {
        commentBox.style.display = "none";
			} else {
        commentBox.innerHTML = xhttp.responseText;
        commentBox.style.display = "block";
      }
  };
  inscription = inscription.replace(/[a-z]/g, "");
  xhttp.open("GET", "commentary/" + inscription + ".html", true);
  xhttp.send();
}

function getInscriptionHoveredOver() {
  var n = document.querySelector(":hover");
  var nn;
  while (n) {
    nn = n;
    if (nn.className == "item-container") {
      return nn;
    }
    n = nn.querySelector(":hover");
  }
  return nn;
}

function highlightMatchesInElement(element, searchTerm) {
  for (var j = 0; j < element.children.length; j++) {
    var span = element.children[j];
    if (searchTerm != "" && span.textContent.includes(searchTerm)) {
      var inscription = element.getAttribute("inscription");
      if (!inscription) {
        continue;
      }
      var translation = document.getElementById(inscription + "-translation-" + j);
      translation.style.backgroundColor = "yellow";
      var transcription = document.getElementById(inscription + "-transcription-" + j);
      transcription.style.backgroundColor = "yellow";
      highlightedSearchElements.push(translation);
      highlightedSearchElements.push(transcription);
    }
  }
}

function clearHighlights() {
  for (var index in highlightedSearchElements) {
    highlightedSearchElements[index].style.backgroundColor = "";
  }
  highlightedSearchElements = [];
}

var highlightedSearchElements = [];
function updateSearch(event) {
  clearHighlights();
  document.getElementById("search-terms").innerHTML = "";
  var searchTerm = event.target.value;
  for (var inscription of inscriptions.values()) {
    if (searchTerm == "") {
			if (inscription.element) {
        inscription.element.style.display = "flex";
			}
			continue;
		}
    if (inscription.transcription.includes(searchTerm) || inscription.name.includes(searchTerm)) {
      loadInscription(inscription);
      inscription.element.style.display = "flex";
      highlightMatchesInElement(inscription.element, searchTerm);
    } else if (inscription.element) {
      inscription.element.style.display = "none";
    }
  } 
}

function makeMoveLens(lens, img, result, cx, cy) {
  return function(e) {
    result.style.display = "flex";
    lens.style.display = "block";
    result.style.width = (img.parentElement.offsetWidth * 2) + "px";
    result.style.height = img.parentElement.offsetHeight + "px";
    lens.style.width = (img.parentElement.offsetWidth / 2) + "px";
    lens.style.height = (img.parentElement.offsetHeight / 5) + "px";

    var availableHeight = img.parentElement.getBoundingClientRect().top;
    if (availableHeight < (img.parentElement.offsetHeight / 2)) {
      result.style.top = img.parentElement.offsetHeight + "px";
    } else {
      result.style.top = "-" + img.parentElement.offsetHeight + "px";
    }

    /* Calculate the ratio between itemZoom DIV and lens: */
    cx = result.offsetWidth / lens.offsetWidth;
    cy = result.offsetHeight / lens.offsetHeight;
    result.style.backgroundSize = (img.width * cx) + "px " + (img.height * cy) + "px";

    var pos, x, y;
    /* Prevent any other actions that may occur when moving over the image */
    e.preventDefault();
    /* Get the cursor's x and y positions: */
    pos = getCursorPos(e);
    /* Calculate the position of the lens: */
    x = pos.x - (lens.offsetWidth / 2);
    y = pos.y - (lens.offsetHeight / 2);
    /* Prevent the lens from being positioned outside the image: */
    if (x > img.width - lens.offsetWidth) {x = img.width - lens.offsetWidth;}
    if (x < 0) {x = 0;}
    if (y > img.height - lens.offsetHeight) {y = img.height - lens.offsetHeight;}
    if (y < 0) {y = 0;}
    /* Set the position of the lens: */
    lens.style.left = x + "px";
    lens.style.top = y + "px";
    /* Display what the lens "sees": */
    result.style.backgroundPosition = "-" + (x * cx) + "px -" + (y * cy) + "px";

    function getCursorPos(e) {
      var a, x = 0, y = 0;
      e = e || window.event;
      /* Get the x and y positions of the image: */
      a = img.getBoundingClientRect();
      /* Calculate the cursor's x and y coordinates, relative to the image: */
      x = e.pageX - a.left;
      y = e.pageY - a.top;
      /* Consider any page scrolling: */
      x = x - window.pageXOffset;
      y = y - window.pageYOffset;
      return {x : x, y : y};
    }
  };
}

function makeHideElements(elements) {
  return function(e) {
    for (var index in elements) {
      elements[index].style.display = "none";
    }
  };
}

function addImageToItem(item, imageToAdd, name) {
  var itemShell = document.createElement("div");
  itemShell.className = 'item-shell';
  item.appendChild(itemShell);

  var itemZoom = document.createElement("div");
  itemZoom.className = 'item-zoom';
  itemShell.appendChild(itemZoom);

  var label = document.createElement("div");
  label.className = 'label';
  label.textContent = name;
  itemZoom.appendChild(label);

  var inscriptionImage = document.createElement("div");
  inscriptionImage.className = 'item';
  var imageWrapper = document.createElement("div");
  imageWrapper.setAttribute("class", "img-wrapper");
  inscriptionImage.appendChild(imageWrapper);

  var lens = document.createElement("div");
  lens.setAttribute("class", "img-zoom-lens");
  imageWrapper.appendChild(lens);

  var img = document.createElement("img");
  img.src = imageToAdd;
  img.height = "200";
  imageWrapper.appendChild(img);
  itemShell.appendChild(inscriptionImage);

  itemZoom.style.backgroundImage = "url('" + img.src + "')";
  lens.addEventListener("mousemove", makeMoveLens(lens, img, itemZoom));
  img.addEventListener("mousemove", makeMoveLens(lens, img, itemZoom));
  itemShell.addEventListener("mouseout", makeHideElements([lens, itemZoom]));
}

function getClassForInscriptionSize(wordCount) {
  if (wordCount > 100) {
    return "big-inscription";
  }
  if (wordCount > 50) {
    return "medium-inscription";
  }
  return "small-inscription";
}

function loadInscription(inscription) {
  if (inscription.element) {
    return null;
  }

  var item = document.createElement("div");
  item.className = 'item-container';
  item.id = inscription.name;
  item.setAttribute("onclick", "showCommentaryForInscription('" + inscription.name + "')");

  inscription.images.forEach( image => {
    addImageToItem(item, image, inscription.name)
  });
  if (inscription.tracingImages) {
    inscription.tracingImages.forEach( image => {
      addImageToItem(item, image, inscription.name)
    });
  }

  var classForSize = getClassForInscriptionSize(inscription.transliteratedWords.length);
  var transcript = document.createElement("div");
  transcript.className = 'item text-item' + " " + classForSize;
  transcript.setAttribute("inscription", inscription.name);
  for (var i = 0; i < inscription.words.length; i++) {
    var word = inscription.words[i];
    var elementName = word == "\n" ? "br" : "span";
    var span = document.createElement(elementName);
    if (elementName == "span") {
      span.textContent = word;

      var searchTerm = word.replace(/𐝫/g, "");
      span.id = inscription.name + "-transcription-" + i;
      span.setAttribute("onmouseover", "highlightWords(event, '" + inscription.name + "', '" + i + "')");
      span.setAttribute("onmouseout", "clearHighlight(event, '" + inscription.name + "', '" + i + "')");
      span.setAttribute("onclick", "updateSearchTerms(event, '" + inscription.name + "', '" + i + "')");
    }
    transcript.appendChild(span);
  }
  item.appendChild(transcript);

  transcript = document.createElement("div");
  transcript.className = 'item text-item transliteration-item' + " " + classForSize;
  transcript.setAttribute("inscription", inscription.name);
  for (var i = 0; i < inscription.transliteratedWords.length; i++) {
    var word = inscription.transliteratedWords[i];
    var elementName = word == "\n" ? "br" : "span";
    var span = document.createElement(elementName);
    if (elementName == "span") {
      span.textContent = word + " ";
      span.id = inscription.name + "-translation-" + i;
      span.setAttribute("onmouseover", "highlightWords(event, '" + inscription.name + "', '" + i + "')");
      span.setAttribute("onmouseout", "clearHighlight(event, '" + inscription.name + "', '" + i + "')");
      span.setAttribute("onclick", "updateSearchTerms(event, '" + inscription.name + "', '" + i + "')");
    }
    transcript.appendChild(span);
  }
  item.appendChild(transcript);

  transcript = document.createElement("div");
  transcript.className = 'item text-item transliteration-item' + " " + classForSize;
  transcript.setAttribute("inscription", inscription.name);
  for (var i = 0; i < inscription.translation.length; i++) {
    var word = inscription.translation[i];
    var span = document.createElement("span");
    span.textContent = word;
    span.id = inscription.name + "-translation-" + i;
    transcript.appendChild(span);
    span = document.createElement("br");
    transcript.appendChild(span);
  }
  item.appendChild(transcript);

  var label = document.createElement("div");
  label.className = 'label';
  label.textContent = inscription.name;
  item.appendChild(label);
  inscription.element = item;

  container.appendChild(item);
  inscriptionsToLoad.delete(inscription.name);
  
  return item;
}

function addWordTip(word, inscription) {
  return;
  word = word.replace(/𐝫/g, "");
  word = word.replace(/ /g, "");
  var wordCount = 0;
  if (wordsInCorpus.has(word)) {
    wordCount = wordsInCorpus.get(word) - 1;
  }
  var tip = document.getElementById(inscription + "-tip");
  var inscriptionElement = document.getElementById(inscription);
  if (!tip) {
    var tip = document.createElement("div")
    tip.className = 'word-tip';
    tip.id = inscription + "-tip";
    inscriptionElement.appendChild(tip);
  }
  tip.style.display = "block";
  tip.innerHTML = "";

  var tipText = "";
  switch(wordCount) {
    case 0:
      tipText = "There is no other instance of this word."
      break;
    case 1:
      tipText = wordCount + " other instance of this word. Click to add to filter."
      break;
    default:
      tipText = wordCount + " other instances of this word. Click to add to filter."
  }
  var wordCommentElement = document.createElement("span");
  wordCommentElement.className = "tip-text";
  wordCommentElement.textContent = tipText;
  tip.appendChild(wordCommentElement);

  var availableHeight = inscriptionElement.getBoundingClientRect().top;
  if (availableHeight < tip.offsetHeight) {
    tip.style.top = inscriptionElement.offsetHeight + "px";
  } else {
    tip.style.top = "-" + tip.offsetHeight + "px";
  }
}

function updateTipText(string) {
  var tip = document.getElementById("tip");
  tip.innerHTML = string;
}

function highlightWords(evt, name, index) {
  var items = ["transcription", "translation"];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var element = document.getElementById(name + "-" + item + "-" + index);
    if (item == "transcription") {
      addWordTip(element.textContent, name);
    }
    element.style.backgroundColor = "yellow";
  }
}

function clearHighlight(evt, name, index) {
  var tip = document.getElementById(name + "-tip");
  if (tip) {
    tip.style.display = "none";
  }
  var items = ["transcription", "translation"];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var element = document.getElementById(name + "-" + item + "-" + index);
    if (highlightedSearchElements.includes(element)) {
      continue;
    }
    element.style.backgroundColor = "";
  }
}

function updateSearchTerms(evt, name, index) {
  var element = document.getElementById(name + "-transcription-" + index);
  var searchTerm = element.textContent.replace(/𐝫/g, "").replace(/ /g, "");
  var container = document.getElementById("search-terms");
  var existingElement = document.getElementById(searchTerm);
  if (existingElement) {
    return;
  }
  var item = document.createElement("div");
  item.className = 'search-term';
  item.textContent = searchTerm;
  item.id = searchTerm;
  item.setAttribute("term", searchTerm);
  item.setAttribute("onclick", "removeFilter(event)");
  container.appendChild(item);
  applySearchTerms();
  evt.stopPropagation();
}

function applySearchTerms() {
  var searchTerms = document.getElementById("search-terms");
  var numberOfSearchTerms = searchTerms.children.length;	
  clearHighlights();
  for (var inscription of inscriptions.values()) {
    if (!numberOfSearchTerms) {
      if (inscription.element) {
        inscription.element.style.display = "flex";
      }
      continue;
    }

    var shouldDisplay = true;
    for (var j = 0; j < numberOfSearchTerms; j++) {
      var element = searchTerms.children[j];
      var searchTerm = element.textContent;
      var searchTerm = element.textContent.replace(/𐝫/g, "");
      if (!inscription.words.includes(searchTerm) &&
          !inscription.words.map(x => x.replace(/𐝫/g, "")).includes(searchTerm)) {
        shouldDisplay = false;
        break;
      }
    }
    if (!shouldDisplay) {
      if (inscription.element) {
        inscription.element.style.display = "none";
      }
      continue;
    }
    var newElement = loadInscription(inscription);
    if (!newElement) {
      inscription.element.style.display = "flex";
    }
    for (index in searchTerms.children) {
      var term = searchTerms.children[index].textContent;
      for (var j = 0; j < inscription.element.children.length; j++) {
        var element = inscription.element.children[j];
        console.log("highlighting");
        highlightMatchesInElement(element, term);
      }
    }
  }
}

function removeFilter(evt) {
  evt.target.parentElement.removeChild(evt.target);
  applySearchTerms();
}

function resetSort(evt) {
  var element = evt.target;
  element.style.display = "none";
  var p = document.getElementById('container');
  Array.prototype.slice.call(p.children)
    .map(function (x) { return p.removeChild(x); })
    .sort(function(a, b) {
          var x = a.id;
          var y = b.id;
          if (x < y) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
    })
    .forEach(function (x) { p.appendChild(x); });
}

function updateSortStatus(inscription) {
  var element = document.getElementById("sort-status");
  element.textContent = "Sorted by " + inscription;
  element.style.display = "flex";
}

function searchForWord(evt, name, index) {
  var element = document.getElementById(name + "-transcription-" + index);
  var searchTerm = element.textContent.replace(/𐝫/g, "");
  var searchBox = document.getElementById("search");
  searchBox.value = searchTerm;
  searchBox.dispatchEvent(new InputEvent("input"));
}

var inscriptionsAsArray = Array.from(inscriptions.entries());	
var inscriptionsToLoad = new Map(inscriptions);
// create config object: rootMargin and threshold
// are two properties exposed by the interface
const config = {
  rootMargin: '0px 0px 50px 0px',
  threshold: 0
};

// register the config object with an instance
// of intersectionObserver
let observer = new IntersectionObserver(function(entries, self) {
  // iterate over each entry
  entries.forEach(entry => {
    // process just the images that are intersecting.
    // isIntersecting is a property exposed by the interface
    if(entry.isIntersecting) {
      // custom function that copies the path to the img
      // from data-src to src
		  var key = inscriptionsToLoad.keys().next().value;	
      if (key) {
        var visibleInscription = loadInscription(inscriptions.get(key));
        observer.observe(visibleInscription);
      }
      // the image is now in place, stop watching
      self.unobserve(entry.target);
    }
  });
}, config);

function loadExplorer() {
  for (var i = 0; i < 20; i++) {
    var key = inscriptionsToLoad.keys().next().value;	
    var visibleInscription = loadInscription(inscriptions.get(key));
    observer.observe(visibleInscription);
  }
}

function sortNearest(current) {
  var string = inscriptions.get(current.id).parsedInscription;
  updateTipText("Sorting..");
  var p = document.getElementById('container');
  Array.prototype.slice.call(p.children)
    .map(function (x) { return p.removeChild(x); })
    .sort(function(a, b) {
          var s = inscriptions.get(a.id).parsedInscription.replace(/𐝫|\n/g, "");
          var t = inscriptions.get(b.id).parsedInscription;
          var x = s.levenstein(string);
          var y = t.levenstein(string);
          if (x < y) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
    })
    .forEach(function (x) { p.appendChild(x); });
  updateTipText("");
  updateSortStatus(current.id);
} 

String.prototype.levenstein = function(string) {
  if (typeof String.prototype.levenstein.cachedDistances == "undefined") {
    String.prototype.levenstein.cachedDistances = new Map();
  }
	var a = this, b = string + "", m = [], i, j, min = Math.min;
  if (String.prototype.levenstein.cachedDistances.has(a+b)) {
    return String.prototype.levenstein.cachedDistances.get(a+b);
  }

	if (!(a && b)) return (b || a).length;

	for (i = 0; i <= b.length; m[i] = [i++]);
	for (j = 0; j <= a.length; m[0][j] = j++);

	for (i = 1; i <= b.length; i++) {
		for (j = 1; j <= a.length; j++) {
			m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
				? m[i - 1][j - 1]
				: m[i][j] = min(
					m[i - 1][j - 1] + 1, 
					min(m[i][j - 1] + 1, m[i - 1 ][j] + 1))
		}
	}

	var result = m[b.length][a.length];
  String.prototype.levenstein.cachedDistances.set(a+b, result);
  String.prototype.levenstein.cachedDistances.set(b+a, result);
  return result;
}

