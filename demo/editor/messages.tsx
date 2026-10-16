import { createContext, useContext, type ReactNode } from 'react';
import { useEditablePage } from '../../src';
export type EditorMessages = {
  edit: string; close: string; add: string; remove: string; moveUp: string; moveDown: string;
  chooseMedia: string; clearMedia: string; altText: string; noMediaPicker: string; destination: string;
};
const defaults: EditorMessages = { edit: 'Edit', close: 'Done', add: 'Add item', remove: 'Remove', moveUp: 'Move up', moveDown: 'Move down', chooseMedia: 'Choose image', clearMedia: 'Clear image', altText: 'Alternative text', noMediaPicker: 'No media picker configured', destination: 'Destination' };

const Messages = createContext(defaults);
export function EditorMessagesProvider({ messages, children }: { messages: Partial<EditorMessages>; children: ReactNode }) {
  return <Messages.Provider value={{ ...defaults, ...messages }}>{children}</Messages.Provider>;
}
export function useDemoEditor() {
  const page = useEditablePage();
  const messages = useContext(Messages);
  return { ...page, messages };
}
