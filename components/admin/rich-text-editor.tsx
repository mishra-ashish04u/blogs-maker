'use client';

import { useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import {
  Bold,
  Code,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Undo2,
  Unlink,
} from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, uploadImage } from '@/lib/admin-upload';

interface Props {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  onError?: (message: string) => void;
}

type Mode = 'visual' | 'html';

/**
 * Rich-text editor for post bodies. Produces the same HTML subset the site
 * renders (h2/h3, paragraphs, lists, quotes, code, links, images), styled
 * with `.editorial-body` so it previews exactly like the live article.
 *
 * An HTML mode is available for pasting pre-written markup; the server
 * sanitises whatever is saved either way.
 */
export function RichTextEditor({ id, value, onChange, onError }: Props) {
  const [mode, setMode] = useState<Mode>('visual');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  async function insertImages(files: File[], pos?: number) {
    const editor = editorRef.current;
    if (!editor || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const src = await uploadImage(file);
        const alt = file.name.replace(/\.[^.]*$/, '').replace(/[-_]+/g, ' ');
        const chain = editor.chain().focus();
        if (pos !== undefined) {
          chain.insertContentAt(pos, { type: 'image', attrs: { src, alt } }).run();
        } else {
          chain.setImage({ src, alt }).run();
        }
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  function imageFiles(list: FileList | null | undefined): File[] {
    return Array.from(list ?? []).filter((f) =>
      (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type),
    );
  }

  const editor = useEditor({
    // Required with SSR: render only on the client to avoid hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          protocols: ['http', 'https', 'mailto'],
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: 'Start writing… Use the toolbar for headings, lists, links and images.',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'editorial-body',
        'aria-label': 'Post body',
        'aria-multiline': 'true',
        role: 'textbox',
      },
      handlePaste(_view, event) {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
      handleDrop(view, event) {
        const files = imageFiles(event.dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void insertImages(files, coords?.pos);
        return true;
      },
    },
    onCreate({ editor }) {
      editorRef.current = editor;
    },
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            paragraph: e.isActive('paragraph'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            strike: e.isActive('strike'),
            code: e.isActive('code'),
            bulletList: e.isActive('bulletList'),
            orderedList: e.isActive('orderedList'),
            blockquote: e.isActive('blockquote'),
            codeBlock: e.isActive('codeBlock'),
            link: e.isActive('link'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  function setLink() {
    if (!editor) return;
    const previous = (editor.getAttributes('link').href as string | undefined) ?? '';
    const input = window.prompt('Link URL (https://… or mailto:…)', previous);
    if (input === null) return;
    const url = input.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const href = /^(https?:\/\/|mailto:)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (next === 'visual' && editor) {
      // Load whatever was typed in HTML mode back into the editor.
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    setMode(next);
  }

  const visual = mode === 'visual';
  const disabled = !editor || !visual;

  return (
    <div className="rich-editor overflow-hidden rounded-md bg-surface-low ghost-border focus-within:ring-2 focus-within:ring-primary">
      {/* TOOLBAR */}
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-outline-variant bg-surface-lowest/95 px-1.5 py-1 backdrop-blur"
      >
        <Btn label="Paragraph" active={state?.paragraph} disabled={disabled}
          onClick={() => editor?.chain().focus().setParagraph().run()}>
          <Pilcrow />
        </Btn>
        <Btn label="Heading" active={state?.h2} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 />
        </Btn>
        <Btn label="Subheading" active={state?.h3} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 />
        </Btn>
        <Sep />
        <Btn label="Bold (Ctrl+B)" active={state?.bold} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold />
        </Btn>
        <Btn label="Italic (Ctrl+I)" active={state?.italic} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic />
        </Btn>
        <Btn label="Strikethrough" active={state?.strike} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough />
        </Btn>
        <Btn label="Inline code" active={state?.code} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleCode().run()}>
          <Code />
        </Btn>
        <Sep />
        <Btn label="Bulleted list" active={state?.bulletList} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List />
        </Btn>
        <Btn label="Numbered list" active={state?.orderedList} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered />
        </Btn>
        <Btn label="Quote" active={state?.blockquote} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote />
        </Btn>
        <Btn label="Code block" active={state?.codeBlock} disabled={disabled}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
          <SquareCode />
        </Btn>
        <Btn label="Divider" disabled={disabled}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          <Minus />
        </Btn>
        <Sep />
        <Btn label="Add / edit link" active={state?.link} disabled={disabled} onClick={setLink}>
          <Link2 />
        </Btn>
        <Btn label="Remove link" disabled={disabled || !state?.link}
          onClick={() => editor?.chain().focus().extendMarkRange('link').unsetLink().run()}>
          <Unlink />
        </Btn>
        <Btn label="Insert image" disabled={disabled || uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        </Btn>
        <Sep />
        <Btn label="Undo (Ctrl+Z)" disabled={disabled || !state?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 />
        </Btn>
        <Btn label="Redo (Ctrl+Shift+Z)" disabled={disabled || !state?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 />
        </Btn>

        {/* MODE SWITCH */}
        <div className="ml-auto flex rounded-md bg-surface-container p-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
          {(['visual', 'html'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                mode === m ? 'bg-surface-lowest text-on-bg shadow-sm' : 'text-on-surface-muted hover:text-on-bg'
              }`}
            >
              {m === 'html' && <Code2 className="h-3 w-3" aria-hidden="true" />}
              {m === 'visual' ? 'Visual' : 'HTML'}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => {
          void insertImages(imageFiles(e.target.files));
          e.target.value = '';
        }}
      />

      {/* SURFACE */}
      <div className={visual ? 'px-5 py-5 md:px-8 md:py-7' : 'hidden'}>
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="flex min-h-[24rem] items-center justify-center text-sm text-on-surface-muted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Loading editor…
          </div>
        )}
      </div>
      {!visual && (
        <div>
          <textarea
            aria-label="Post body HTML"
            rows={22}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder="<h2>Section</h2><p>Editorial content…</p>"
            className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-[12px] leading-relaxed text-on-bg placeholder:text-on-surface-muted focus:outline-none"
          />
          <p className="border-t border-outline-variant px-4 py-2 text-[11px] text-on-surface-muted">
            Allowed: h2–h4, p, lists, blockquote, code/pre, a, img, figure, table. Anything else
            (scripts, styles, event handlers) is stripped on save.
          </p>
        </div>
      )}
    </div>
  );
}

function Btn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      // Keep the editor selection when clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors [&_svg]:h-4 [&_svg]:w-4 disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'bg-primary/12 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-bg'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-outline-variant" />;
}
