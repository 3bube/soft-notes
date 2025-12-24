import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  CheckmarkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { NoteData } from "../stores/noteStore";
import { HexColorPicker } from "react-colorful";

interface TopMenuProps {
  note: NoteData;
  onColorChange: (color: string) => void;
  onTextColorChange?: (color: string) => void;
  onCheckboxToggle?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TopMenu({
  note,
  onColorChange,
  onTextColorChange,
  onCheckboxToggle,
  onDelete,
  onClose,
}: TopMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);

  console.log(note);

  // Map preset color names to hex values for the picker
  const colorMap: { [key: string]: string } = {
    yellow: "#fef08a",
    blue: "#a1e3fd",
    pink: "#fbcfe8",
    green: "#a7f3d0",
    purple: "#d8b4fe",
    peach: "#fed7aa",
  };

  const currentHex = colorMap[note.color] || note.color;
  const currentTextHex = note.textColor || note.text_color || "#3d3d3d";

  const handleHexChange = (hex: string) => {
    // Find the closest color name match
    const closestColor = Object.entries(colorMap).reduce(
      (closest, [name, hex_val]) => {
        return hex === hex_val ? name : closest;
      },
      null as string | null
    );
    onColorChange(closestColor || hex);
  };

  const handleTextColorChange = (hex: string) => {
    onTextColorChange?.(hex);
  };

  return (
    <div className="note__top-menu">
      <div className="note__menu-colors">
        <button
          className="note__color-swatch"
          style={{ backgroundColor: currentHex }}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Change background color"
        />
        {showColorPicker && (
          <div className="note__color-picker">
            <HexColorPicker color={currentHex} onChange={handleHexChange} />
          </div>
        )}
      </div>
      <div className="note__menu-colors">
        <button
          className="note__color-swatch"
          style={{ backgroundColor: currentTextHex }}
          onClick={() => setShowTextColorPicker(!showTextColorPicker)}
          title="Change text color"
        />
        {showTextColorPicker && (
          <div className="note__color-picker">
            <HexColorPicker
              color={currentTextHex}
              onChange={handleTextColorChange}
            />
          </div>
        )}
      </div>
      <button
        className={`note__menu-checkbox ${note.has_checkboxes ? "active" : ""}`}
        onClick={onCheckboxToggle}
        title="Toggle checkboxes"
      >
        <HugeiconsIcon icon={CheckmarkSquare02Icon} size={16} />
      </button>
      <button className="note__menu-delete" onClick={onDelete} title="Delete">
        <HugeiconsIcon icon={Delete02Icon} size={16} />
      </button>
    </div>
  );
}
