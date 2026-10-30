export interface CountdownState {
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  formattedTime: string;
}

export function calculateElectionCountdown(startTimeStr?: string, endTimeStr?: string): CountdownState {
  const now = new Date().getTime();
  
  // Default fallback dates if not defined
  const start = startTimeStr ? new Date(startTimeStr).getTime() : now - 3600000; // 1 hour ago
  const end = endTimeStr ? new Date(endTimeStr).getTime() : now + (24 * 3600 * 1000); // 24 hours ahead

  if (now < start) {
    // Belum dimulai -> Hitung mundur menuju waktu mulai
    const diff = Math.max(0, start - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      status: 'UPCOMING',
      days,
      hours,
      minutes,
      seconds,
      label: 'Menuju Pembukaan Pemilihan',
      formattedTime: `${pad(days)}h : ${pad(hours)}j : ${pad(minutes)}m : ${pad(seconds)}d`
    };
  } else if (now >= start && now < end) {
    // Sedang berlangsung -> Hitung mundur menuju waktu selesai
    const diff = Math.max(0, end - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      status: 'ACTIVE',
      days,
      hours,
      minutes,
      seconds,
      label: 'Sisa Waktu Pemungutan Suara',
      formattedTime: `${pad(days)}h : ${pad(hours)}j : ${pad(minutes)}m : ${pad(seconds)}d`
    };
  } else {
    // Selesai
    return {
      status: 'ENDED',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: 'Waktu Pemilihan Selesai',
      formattedTime: '00h : 00j : 00m : 00d'
    };
  }
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}
