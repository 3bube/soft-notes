import { useMemo } from "react";
import YooptaEditor, {
  createYooptaEditor,
  YooptaContentValue,
} from "@yoopta/editor";
import Paragraph from "@yoopta/paragraph";
import Headings from "@yoopta/headings";
import Lists from "@yoopta/lists";
import Blockquote from "@yoopta/blockquote";
import Code from "@yoopta/code";
import Divider from "@yoopta/divider";
import Image from "@yoopta/image";
import Embed from "@yoopta/embed";
import Table from "@yoopta/table";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import ActionMenu, { DefaultActionMenuRender } from "@yoopta/action-menu-list";
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import {
  Bold,
  Italic,
  CodeMark,
  Underline,
  Strike,
  Highlight,
} from "@yoopta/marks";

interface YooptaEditorWrapperProps {
  value?: YooptaContentValue;
  onChange: (value: YooptaContentValue) => void;
  placeholder?: string;
  readOnly?: boolean;
  textColor?: string;
}

const PLUGINS = [
  Paragraph,
  Headings.HeadingOne,
  Headings.HeadingTwo,
  Headings.HeadingThree,
  Lists.BulletedList,
  Lists.NumberedList,
  Lists.TodoList,
  Blockquote,
  Code,
  Divider,
  Image,
  Embed,
  Table,
] as any;

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

const TOOLS = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  ActionMenu: {
    tool: ActionMenu,
    render: DefaultActionMenuRender,
  },
  LinkTool: {
    tool: LinkTool,
    render: DefaultLinkToolRender,
  },
};

export function YooptaEditorWrapper({
  value,
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  textColor = "#3d3d3d",
}: YooptaEditorWrapperProps) {
  const editor = useMemo(() => createYooptaEditor(), []);

  return (
    <div className="yoopta-editor-wrapper" style={{ color: textColor }}>
      <YooptaEditor
        editor={editor}
        plugins={PLUGINS as any}
        marks={MARKS}
        tools={TOOLS}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="yoopta-editor"
        autoFocus={false}
      />
    </div>
  );
}
