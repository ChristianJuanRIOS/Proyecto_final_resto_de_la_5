// Un "ding" corto para avisar que hay un pedido listo.
// Si el navegador no deja reproducir sonido, simplemente no suena.
export function sonarAviso() {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext
    const audio = new Contexto()
    const oscilador = audio.createOscillator()
    const volumen = audio.createGain()

    oscilador.type = 'sine'
    oscilador.frequency.value = 880
    volumen.gain.setValueAtTime(0.0001, audio.currentTime)
    volumen.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + 0.02)
    volumen.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.6)

    oscilador.connect(volumen)
    volumen.connect(audio.destination)
    oscilador.start()
    oscilador.stop(audio.currentTime + 0.6)
    setTimeout(() => audio.close(), 800)
  } catch {
    // sin sonido
  }
}