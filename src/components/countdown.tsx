'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Countdown({ resetAt }: { resetAt: string | null }) {
  const [text, setText] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!resetAt) {
      setText('Chưa sử dụng');
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    function update() {
      const diff = new Date(resetAt!).getTime() - Date.now();
      if (diff <= 0) {
        setText('Đã reset');
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        router.refresh();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) {
        setText(`${h}h ${m}p ${s}s`);
      } else if (m > 0) {
        setText(`${m}p ${s}s`);
      } else {
        setText(`${s}s`);
      }
    }

    update();
    interval = setInterval(update, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resetAt, router]);

  return <span className="caption font-medium">{text}</span>;
}
