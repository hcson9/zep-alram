// 📁 content.js
let videoAlarmSound = new Audio("https://t1.daumcdn.net/cfile/tistory/991B26505CF6B23D03");
videoAlarmSound.volume = 0.5;

let checkInterval = null;
const visitedPeople = new Set();
const botToken = '{{BOT_TOKEN}}';
const chatId = '{{CHAT_ID}}';
let isTelegramActive = false;

// 알람 상태 초기화
chrome.storage.local.get(["isAlarmActive", "isTelegramActive"], (result) => {
    if (result.isAlarmActive) {
        startAlarm();
    }
    if (result.isTelegramActive !== undefined) {
        isTelegramActive = result.isTelegramActive;
    }
});

function checkVideoCount() {
    let videos = document.querySelector('#play-ui-layout [class^="VideosRightView_right_view_wrapper"] > div');
    if (!videos) return;

    let array = Array.from(videos.children).filter((video) => video.tagName === "DIV" && !video.querySelector('[class*="PlayerVideo_top"] span > svg'));
    let videoCount = array.length;

    if (videoCount > 1) {
        if (!window.alarmed) {
            videoAlarmSound.play();
            array.slice(1).forEach((video) => {
                let text = video.querySelector('span > span')?.textContent;
                if (text && !visitedPeople.has(text)) {
                    visitedPeople.add(text);
                    if (isTelegramActive) {
                        sendTelegramMessage(`${text} 방문했습니다.`);
                    }
                    // 10분 후 자동 삭제
                    setTimeout(() => visitedPeople.delete(text), 10 * 60 * 1000);
                }
            });
            setTimeout(stopVideoCheckAlarmSound, 1000);
        }
        window.alarmed = true;
    } else {
        window.alarmed = false;
    }
}

function stopVideoCheckAlarmSound() {
    videoAlarmSound.pause();
    videoAlarmSound.currentTime = 0;
}

function startAlarm() {
    if (!checkInterval) {
        checkInterval = setInterval(checkVideoCount, 1000);
    }
}

function stopAlarm() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
    stopVideoCheckAlarmSound();
}

function resetVisitedPeople() {
    visitedPeople.clear();
}

function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
    })
    .then(res => res.json())
    .then(data => console.log("Telegram message sent:", data))
    .catch(err => console.error("Telegram Error:", err));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleAlarm") {
        message.isActive ? startAlarm() : stopAlarm();
        sendResponse({ status: "success" });
    } else if (message.action === "setVolume") {
        videoAlarmSound.volume = message.volume;
        sendResponse({ status: "volume updated" });
    } else if (message.action === "resetVisited") {
        resetVisitedPeople();
        sendResponse({ status: "reset" });
    } else if (message.action === "getVisitorCount") {
        sendResponse({ count: visitedPeople.size });
    } else if (message.action === "toggleTelegram") {
        isTelegramActive = message.isActive;
        sendResponse({ status: "telegram toggled" });
    }
});
