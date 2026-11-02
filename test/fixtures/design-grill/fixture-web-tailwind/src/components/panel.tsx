export function Panel({ items, onSelect }: { items: string[]; onSelect: (s: string) => void }) {
  return (
    <div style={{ borderRadius: '6px', padding: '13px', background: '#3b82f6' }}>
      {items.map((item) => (
        <div key={item} onClick={() => onSelect(item)} style={{ transition: 'all 500ms linear' }}>
          {item}
        </div>
      ))}
      <img src="/icon.png" />
      <button onClick={() => onSelect('')}>Submit</button>
    </div>
  );
}
