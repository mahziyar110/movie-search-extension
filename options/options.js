document.addEventListener("DOMContentLoaded", function () {
  // Load previously saved API key
  chrome.storage.sync.get("apiKey", function (data) {
    document.querySelector("#api-key").value = data.apiKey || "";
  });

  // Save API key on button click
  document.querySelector("#save").addEventListener("click", function () {
    let apiKey = document.querySelector("#api-key").value;
    chrome.storage.sync.set({ apiKey: apiKey }, function () {
      window.close();
    });
  });
});
