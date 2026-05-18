'use client';

interface Props {
  model: string;
}

export default function EmptyState({ model }: Props) {
  return (
    <div className="chat-empty">
      <div className="chat-empty-logo">C</div>
      <h2 className="chat-empty-title">How can I help you today?</h2>
      <p className="chat-empty-model">{model}</p>
    </div>
  );
}
