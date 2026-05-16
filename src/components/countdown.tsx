'use client';
import { useState, useEffect } from 'react';

export default function Countdown({ resetAt }: { resetAt: string | null }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!resetAt) {
      setText('Chưa sử dụng');
      return;
    }

    function update() {
      const diff = new Date(resetAt!).getTime() - Date.now();
      if (diff <= 0) {
        setText('Đã reset');
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
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [resetAt]);

  return <span className="caption font-medium">{text}</span>;
}
