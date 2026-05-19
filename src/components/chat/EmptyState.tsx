'use client';

interface Props {
  model: string;
  onSuggestion?: (text: string) => void;
}

const suggestions = [
  'Explain how async/await works',
  'Write a Python script to parse CSV',
  'Help me debug my React component',
  'Summarize this code for me',
];

export default function EmptyState({ model, onSuggestion }: Props) {
  return (
    <div className="chat-empty">
      <div className="chat-empty-logo">C</div>
      <h2 className="chat-empty-title">How can I help you today?</h2>
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
