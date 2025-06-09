import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";

const MAX_POOL_SIZE = 3;

const useMusicPlayer = (audioUrl: string, volume: number, playbackRate: number) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(1);
  const soundRef = useRef<Howl | null>(null);
  const audioPool = useRef<Howl[]>([]);
  const progressTimer = useRef<number>(0);

  // 添加音频到池中
  const addToAudioPool = (sound: Howl): void => {
    if (audioPool.current.length >= MAX_POOL_SIZE) {
      const oldestSound = audioPool.current.shift();
      if (oldestSound) {
        oldestSound.unload();
      }
    }
    audioPool.current.push(sound);
  };

  useEffect(() => {
    // 卸载当前音频并创建新的音频实例
    soundRef.current?.unload();

    const sound = new Howl({
      src: [audioUrl],
      html5: false,
      volume,
      rate: playbackRate,
      onload: () => setDuration(sound.duration()),
      onend: () => {
        setPlaying(false);
        clearInterval(progressTimer.current);
      },
    });

    addToAudioPool(sound);
    soundRef.current = sound;

    return () => {
      soundRef.current?.unload();
      clearInterval(progressTimer.current);
    };
  }, [audioUrl, volume, playbackRate]);

  useEffect(() => {
    if (playing && soundRef.current) {
      progressTimer.current = window.setInterval(() => {
        const t = soundRef.current!.seek() as number;
        setProgress(t);
      }, 500);
    } else {
      clearInterval(progressTimer.current);
    }

    return () => clearInterval(progressTimer.current);
  }, [playing]);

  useEffect(() => {
    soundRef.current?.volume(volume);
  }, [volume]);

  useEffect(() => {
    soundRef.current?.rate(playbackRate);
  }, [playbackRate]);

  // 切换播放状态
  const togglePlay = () => {
    if (!soundRef.current) return;
    if (playing) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
    setPlaying(!playing);
  };

  // 快进/快退
  const skipTime = (offset: number) => {
    if (!soundRef.current) return;
    const current = soundRef.current.seek() as number;
    const newTime = Math.max(0, Math.min(current + offset, duration));
    soundRef.current.seek(newTime);
    setProgress(newTime);
  };

  // 格式化时间
  const formatTime = (t: number) => {
    const min = Math.floor(t / 60).toString().padStart(2, "0");
    const sec = Math.floor(t % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // 点击进度条跳转
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!soundRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = Math.max(0, Math.min(percent * duration, duration));
    soundRef.current.seek(newTime);
    setProgress(newTime);
  };

  return {
    playing,
    progress,
    duration,
    volume,
    togglePlay,
    skipTime,
    formatTime,
    handleSeek,
    setProgress,
  };
};

export default useMusicPlayer;
