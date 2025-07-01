export async function getSelectedMicStream(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (err) {
    console.error('Microphone access denied:', err);
    return null;
  }
}
