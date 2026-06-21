export function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('此浏览器不支持桌面通知');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('通知权限已授权');
      }
    });
  }

  return Notification.permission === 'granted';
}

export function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
    });
  }
}

let audioContext = null;

export function playBeep(frequency = 800, duration = 200) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (e) {
    console.log('音频播放失败:', e);
  }
}

export function playCompletionSound() {
  playBeep(880, 150);
  setTimeout(() => playBeep(1100, 150), 200);
  setTimeout(() => playBeep(1320, 300), 400);
}
