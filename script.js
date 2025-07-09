document.addEventListener("DOMContentLoaded", function () {
  // Helper to format 1st, 2nd, 3rd, 4th…
  function formatOrdinal(n) {
    let suffix = 'th';
    const rem100 = n % 100;
    if (rem100 < 11 || rem100 > 13) {
      const rem10 = n % 10;
      if (rem10 === 1) suffix = 'st';
      else if (rem10 === 2) suffix = 'nd';
      else if (rem10 === 3) suffix = 'rd';
    }
    return `${n}<sup>${suffix}</sup>`;
  }

  // Grab elements
  const cake               = document.querySelector(".cake");
  const candleCountDisplay = document.getElementById("candleCount");
  const ageIn              = document.getElementById("age");
  const goBtn              = document.getElementById("go");
  const micBtn             = document.getElementById("mic");
  const heading            = document.getElementById("heading");

  let candles   = [];
  let audioContext;
  let analyser;
  let microphone;

  function updateCandleCount() {
    const activeCandles = candles.filter(c => !c.classList.contains("out")).length;
    candleCountDisplay.textContent = activeCandles;
  }

  function addCandle(left, top) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top  = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  // Click-to-add
  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top  = event.clientY - rect.top;
    addCandle(left, top);
  });

  function isBlowing() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    const average = sum / bufferLength;
    return average > 40;
  }

  // Extinguish randomly on blow
  function blowOutCandles() {
    let blownOut = 0;
    if (isBlowing()) {
      candles.forEach(candle => {
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
        }
      });
    }
    if (blownOut > 0) {
      updateCandleCount();

      if (
        candles.length > 0 && 
        candles.every(c => c.classList.contains("out"))
      ) {
        confetti({
          particleCount: 100, 
          spread: 60, 
          origin: { y: 0.6 } 
        });
      }
    }
  }

  // Mic setup for blow detection
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser     = audioContext.createAnalyser();
        microphone   = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        setInterval(blowOutCandles, 200);
      })
      .catch(err => console.log("Unable to access microphone: " + err));
  } else {
    console.log("getUserMedia not supported on your browser!");
  }

  // Light/relight all
  goBtn.addEventListener("click", function () {
    const age = Math.max(1, +ageIn.value || 1);
    heading.innerHTML = `🎂 Happy ${formatOrdinal(age)} Birthday, Kashish! 🎂`;
    candles.forEach(c => c.classList.remove("out"));
    updateCandleCount();
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.3 } });
  });

  // Mic toggle
  micBtn.addEventListener("click", function () {
    if (microphone) {
      microphone.disconnect();
      microphone = null;
      micBtn.textContent = "🎤 Blow With Mic";
    } else if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(stream => {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser     = audioContext.createAnalyser();
          microphone   = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 256;
          setInterval(blowOutCandles, 200);
          micBtn.textContent = "🛑 Stop Mic";
        })
        .catch(err => console.log("Unable to access microphone: " + err));
    }
  });
});
