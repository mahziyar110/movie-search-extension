chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: "options/options.html",
    });
  }
});

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "searchIMDb",
    title: "Search IMDb for '%s'",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "searchIMDb") {
    searchIMDb(info.selectionText);
  }
});

function searchIMDb(query) {
  var url = "https://www.imdb.com/find?q=" + encodeURIComponent(query);
  chrome.tabs.create({
    url: url,
  });
}

chrome.commands.onCommand.addListener(async function (command) {
  if (command === "search-imdb") {
    let result;
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    try {
      [{ result }] = await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
        },
        function: () => {
          return window.getSelection().toString().substr(0, 64);
        },
      });
    } catch (e) {
      return; // ignoring an unsupported page like chrome://extensions
    }

    if (!result) {
      return;
    }

    var url = "https://www.imdb.com/find?q=" + encodeURIComponent(result);
    chrome.tabs.create({
      url: url,
    });
  }
});
