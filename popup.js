window.addEventListener("DOMContentLoaded", function () {
  const restoreButton = document.querySelector("#restoreButton");
  const retrieveButton = document.querySelector("#retrieveButton");
  const dateSelect = document.querySelector("#dateSelect");
  const deleteButton = document.querySelector("#deleteButton");

  retrieveButton.addEventListener("click", function () {
    const selectedDate = dateSelect.value;
    updateSavedTabsList(selectedDate);
  });

  restoreButton.addEventListener("click", function () {
    const selectedDate = dateSelect.value;
    restoreAllTabs(selectedDate); // Call the restoreAllTabs function
  });

  deleteButton.addEventListener("click", function () {
    const selectedDate = dateSelect.value;
    deleteTabs(selectedDate); // Call the deleteTabs function
  });

  populateDateSelect();
  // Fetch and display current open tabs
  chrome.runtime.sendMessage({ type: "getTabs" }, function (response) {
    const extTabs = document.querySelector("#ext_tabs");
    response.forEach((tab, index) => {
      const tabElement = document.createElement("li");
      const p = document.createElement("p");
      p.innerText = index + 1 + ") " + tab.title;
      const button = document.createElement("button");
      if (tab.active) {
        tabElement.classList.add("active");
      }
      button.addEventListener("click", function () {
        chrome.tabs.remove(tab.id);
        tabElement.remove();
      });
      p.addEventListener("click", function () {
        chrome.tabs.update(tab.id, { active: true });
      });
      button.innerText = "Close Tab";
      tabElement.appendChild(p);
      tabElement.appendChild(button);
      extTabs.appendChild(tabElement);
    });
  });

  // Add event listener for window beforeunload event
  window.addEventListener("beforeunload", function (event) {
    event.preventDefault(); // Cancel the default event behavior...because of this its asking to save changes in the application

    // Showing the confirmation popup
    const confirmationPopup = document.getElementById("confirmationPopup");
    confirmationPopup.classList.remove("hidden"); //removing the hidden class from the html so that it asks for confirmation

    // Disable other UI elements
    retrieveButton.disabled = true;
    dateSelect.disabled = true;
    restoreButton.disabled = true;
  });

  // Handle click on the Yes button in the confirmation popup
  const yesButton = document.getElementById("yesButton");
  yesButton.addEventListener("click", function () {
    saveTabsAndCloseWindow();
  });

  // Handle click on the No button in the confirmation popup
  const noButton = document.getElementById("noButton");
  noButton.addEventListener("click", function () {
    closeWindow();
  });
});

function saveTabsAndCloseWindow() {
  saveTabs(function () {
    closeWindow();
  });
}

// Saving all tabs according to the current date and time
function saveTabs(callback) {
  chrome.tabs.query({}, function (tabs) {
    const currentDate =
      new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString();
    const savedTabs = tabs.map(function (tab) {
      return { url: tab.url, title: tab.title };
    });
    const data = { [currentDate]: savedTabs };
    chrome.storage.local.set(data, function () {
      // Update the saved tabs list display
      updateSavedTabsList(currentDate);
      if (typeof callback === "function") {
        callback();
      }
    });
  });
}

function closeWindow() {
  window.close();
}

function populateDateSelect() {
  const dateSelect = document.querySelector("#dateSelect");
  chrome.storage.local.get(null, function (result) {
    const dates = Object.keys(result);
    dates.sort().reverse(); // sorting as the latest date should come on the top
    dateSelect.innerHTML = "";
    dates.forEach(function (date) {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      dateSelect.appendChild(option);
    });
  });
}

function updateSavedTabsList(date) {
  const savedTabsList = document.querySelector("#savedTabsList");
  savedTabsList.innerHTML = "";
  chrome.storage.local.get([date], function (result) {
    const savedTabs = result[date] || [];
    savedTabs.forEach(function (tab, index) {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = tab.url;
      link.textContent = `${index + 1}) ${tab.title}`;
      link.target = "_blank";
      listItem.appendChild(link);
      savedTabsList.appendChild(listItem);
    });
  });
}

function restoreAllTabs(date) {
  chrome.storage.local.get([date], function (result) {
    const savedTabs = result[date] || [];
    savedTabs.forEach(function (tab, index) {
      chrome.tabs.create({ url: tab.url, active: index === 0 }); // Open all tabs and make the first tab active
    });
  });
}

function deleteTabs(date) {
  chrome.storage.local.remove(date, function () {
    updateSavedTabsList(date); // show the updated date list
    location.reload(date); //refresh the date list
  });
}
