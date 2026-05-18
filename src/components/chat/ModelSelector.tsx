'use client';

interface Props {
  models: string[];
  selected: string;
  onChange: (model: string) => void;
}

export default function ModelSelector({ models, selected, onChange }: Props) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="model-selector"
    >
      {models.length > 0
        ? models.map((m) => <option key={m} value={m}>{m}</option>)
        : <option value={selected}>{selected}</option>
      }
    </select>
  );
}
