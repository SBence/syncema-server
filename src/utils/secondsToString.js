export default function secondsToString(seconds) {
  seconds = Number(seconds);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor((seconds % 3600) % 60);

  const hDisplay = h > 0 ? h + ":" : "";
  const mDisplay = m.toString().padStart(1, "0") + ":";
  const sDisplay = s.toString().padStart(2, "0");

  return hDisplay + mDisplay + sDisplay;
}
