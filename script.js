document.addEventListener("DOMContentLoaded", function () {
  // Helper for superscript suffixes
  function formatOrdinal(n) {
    let suffix = 'th';
    const rem100 = n % 100;
    if (rem100 < 11 || rem100 > 13) {
      const rem10 = n % 10;
      if      (rem10 === 1) suffix = 'st';
      else if (rem10 === 2) suffix = 'nd';
      else if (rem10 === 3) suffix = 'rd';
    }
    return `${n}<sup>${suffix}</sup>`;
  }

  // Grab DOM nodes
  const cake           = document.getElementById('cake');
  const stage          = document.getElementById('stage');
  const heading        = document.getElementById('heading');
  const ageIn          = document.getElementById('age');
  const goBtn          = document.getElementById('go');
  const micBtn         = document.getElementById('mic');
  const birthdayAudio  = document.getElementById('birthday-audio');
  let candles         = [];

  // AudioContext for microphone
  let audioContext, analyser, microphoneStream;

  // Update the candle count display if you have one
  function updateCandleCount() {
    const countEl = document.getElementById('candleCount');
    if (countEl) {
      const active = candles.filter(c => !c.classList.contains('out')).length;
      countEl.textContent = active;
    }
  }

  // Create & place a candle at (l,t)
  function addCandle(l, t) {
    const c = document.createElement('div');
    c.className = 'candle';
    c.style.left = l + 'px';
    c.style.top  = t + 'px';

    const f = document.createElement('div');
    f.className = 'flame';
    c.appendChild(f);

    c.addEventListener('click', () => {
      c.classList.add('out');
      updateCandleCount();
    });

    cake.appendChild(c);
    candles.push(c);
    updateCandleCount();
  }

  // Handle click-on-cake to add a candle
  cake.addEventListener('click', function (e) {
    const rect = cake.getBoundingClientRect();
    const l = e.clientX - rect.left;
    const t = e.clientY - rect.top;
    addCandle(l, t);
  });

  // Check audio levels for blowing
  function isBlowing() {
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let v of data) sum += ((v - 128) / 128) ** 2;
    const rms = Math.sqrt(sum / bufferLength);
    return rms > 0.25;
  }

  // Called repeatedly to check mic and blow out candles
  function monitorBlow() {
    if (!microphoneStream) return;
    if (isBlowing()) {
      // Play the tune immediately on first detection
      if (birthdayAudio) {
        birthdayAudio.currentTime = 0;
        birthdayAudio.play();
      }
      // Extinguish each remaining candle
      candles.forEach(c => {
        if (!c.classList.contains('out') && Math.random() > 0.5) {
          c.classList.add('out');
        }
      });
      updateCandleCount();
    }
    requestAnimationFrame(monitorBlow);
  }

  // Start microphone listening
  function startMic() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser     = audioContext.createAnalyser();
        microphoneStream = audioContext.createMediaStreamSource(stream);
        microphoneStream.connect(analyser);
        analyser.fftSize = 2048;
        monitorBlow();  // kick off the loop
        micBtn.textContent = '🛑 Stop Mic';
      })
      .catch(err => console.error('Mic error:', err));
  }

  // Stop microphone listening
  function stopMic() {
    if (microphoneStream) {
      microphoneStream.disconnect();
      microphoneStream = null;
      micBtn.textContent = '🎤 Blow With Mic';
    }
  }

  // Light / relight all candles
  goBtn.addEventListener('click', () => {
    const age = Math.max(1, Number(ageIn.value) || 1);
    heading.innerHTML = `🎂 Happy ${formatOrdinal(age)} Birthday, Kashish! 🎂`;
    candles.forEach(c => c.classList.remove('out'));
    updateCandleCount();
  });

  // Toggle mic on/off
  micBtn.addEventListener('click', () => {
    microphoneStream ? stopMic() : startMic();
  });

  // (Optional) Allow click-off-cake to blow all
  stage.addEventListener('click', e => {
    if (e.target === stage) {
      candles.forEach(c => c.classList.add('out'));
      updateCandleCount();
      if (birthdayAudio) {
        birthdayAudio.currentTime = 0;
        birthdayAudio.play();
      }
    }
  });
});
