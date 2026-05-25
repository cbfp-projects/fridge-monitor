interface AddItemBarProps {
  onAdd: () => void;
}

export function AddItemBar({ onAdd }: AddItemBarProps) {
  return (
    <div className="app-footer-add">
      <button type="button" className="add-item-bar" onClick={onAdd}>
        <span className="add-item-bar-icon">+</span>
        <span className="add-item-bar-label">Add item</span>
      </button>
    </div>
  );
}
