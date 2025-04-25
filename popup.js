document.addEventListener("DOMContentLoaded", () => {
    const toggleAlarm = document.getElementById("toggle-alarm");
    const toggleTelegram = document.getElementById("toggle-telegram");
    const volumeSlider = document.getElementById("volume-slider");
    const resetVisitedButton = document.getElementById("clear-visitors");
    const visitorNumber = document.getElementById("visitor-count");

    chrome.storage.local.get(["isAlarmActive", "isTelegramActive", "alarmVolume"], (result) => {
        if (result.isAlarmActive) {
            toggleAlarm.classList.add("active");
        }
        if (result.isTelegramActive) {
            toggleTelegram.classList.add("active");
        }
        if (result.alarmVolume !== undefined) {
            volumeSlider.value = result.alarmVolume;
        }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getVisitorCount" }, (response) => {
                if (response?.count !== undefined) {
                    visitorNumber.textContent = response.count;
                }
            });
        }
    });

    toggleAlarm.addEventListener("click", () => {
        const isActive = !toggleAlarm.classList.contains("active");
        toggleAlarm.classList.toggle("active", isActive);
        chrome.storage.local.set({ isAlarmActive: isActive });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggleAlarm", isActive });
            }
        });
    });

    toggleTelegram.addEventListener("click", () => {
        const isActive = !toggleTelegram.classList.contains("active");
        toggleTelegram.classList.toggle("active", isActive);
        chrome.storage.local.set({ isTelegramActive: isActive });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggleTelegram", isActive });
            }
        });
    });

    volumeSlider.addEventListener("input", () => {
        const volume = parseFloat(volumeSlider.value);
        chrome.storage.local.set({ alarmVolume: volume });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "setVolume", volume });
            }
        });
    });

    resetVisitedButton.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "resetVisited" }, (response) => {
                    if (response?.status === "reset") {
                        alert("방문자 기록이 초기화되었습니다.");
                        visitorNumber.textContent = "0";
                    }
                });
            }
        });
    });
});