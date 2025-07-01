export async function getAvailableMics(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'audioinput');
}

export async function getSelectedMicStream(deviceId?: string): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true
    });
  } catch (err) {
    console.error('Mic access failed:', err);
    return null;
  }
}

export function selectMicDevice(deviceId: string) {
  localStorage.setItem('selectedMic', deviceId);
}
