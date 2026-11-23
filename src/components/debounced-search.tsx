"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Input, type InputProps } from "antd";

type Props = Omit<InputProps,
  "value" | "defaultValue" | "onChange" | "onPressEnter" |
  "onCompositionStart" | "onCompositionEnd" | "onClear"
> & {
  value: string;
  onSearch: (value: string) => void;
  delay?: number;
};

export function DebouncedSearch({ value, onSearch, delay = 400, ...props }: Props) {
  const [draft, setDraft] = useState({ source: value, text: value });
  const [composing, setComposing] = useState(false);
  // URL navigation updates the input without remounting it or stealing focus.
  if (draft.source !== value) {
    setDraft({ source: value, text: value });
  }
  const text = draft.source === value ? draft.text : value;
  const commit = useEffectEvent(onSearch);

  useEffect(() => {
    if (composing || text.trim() === value) return;
    const timer = setTimeout(() => commit(text.trim()), delay);
    return () => clearTimeout(timer);
  }, [text, value, composing, delay]);

  return (
    <Input
      {...props}
      prefix={<SearchOutlined aria-hidden />}
      allowClear
      value={text}
      onChange={event => {
        const next = event.target.value;
        setDraft({ source: value, text: next });
        if (!next && !composing) onSearch("");
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={() => setComposing(false)}
      onPressEnter={event => {
        if (!composing && !event.nativeEvent.isComposing) onSearch(text.trim());
      }}
    />
  );
}
