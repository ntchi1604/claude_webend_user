'use client';

interface Props {
  model: string;
  onSuggestion?: (text: string) => void;
}

const suggestions = [
  'Giải thích cách async/await hoạt động',
  'Viết script Python để đọc file CSV',
  'Giúp tôi debug component React',
  'Tóm tắt đoạn code này',
];

export default function EmptyState({ model, onSuggestion }: Props) {
  return (
    <div className="chat-empty">
      <div className="chat-empty-logo">C</div>
      <h2 className="chat-empty-title">Hôm nay tôi có thể giúp gì cho bạn?</h2>
      <p className="chat-empty-model">{model}</p>
      <div className="chat-empty-suggestions">
        {suggestions.map((s) => (
          <button
            key={s}
            className="chat-suggestion-chip"
            onClick={() => onSuggestion?.(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
