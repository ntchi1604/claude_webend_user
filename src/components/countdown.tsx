'use client';
import { useState, useEffect } from 'react';

export default function Countdown({ resetAt }: { resetAt: string | null }) {
  const [text, setText] = useState('');

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
        setTimeout(() => window.location.reload(), 2000);
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
  }, [resetAt]);

  return <span className="caption font-medium">{text}</span>;
}
