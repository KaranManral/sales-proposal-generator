// "use client";

// import React from 'react';
// import 'react-quill-new/dist/quill.snow.css';

// import ReactQuill,{Quill} from 'react-quill-new';
// import Table from 'quill/modules/table';

// function QuillEditor({ value, onChange, placeholder, modules, formats,readOnly}) {
//   const defaultModules = {
//     toolbar: [
//       [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
//       [{size: []}],
//       ['bold', 'italic', 'underline', 'strike', 'blockquote'],
//       [{'list': 'ordered'}, {'list': 'bullet'},
//        {'indent': '-1'}, {'indent': '+1'}],
//       ['link',],
//       ['clean'],
//       [{ 'color': [] }, { 'background': [] }],
//       [{ 'align': [] }],                       
//     ],
//     clipboard: {
//       matchVisual: false, 
//     }
//   };

//   const defaultFormats = [
//     'header', 'font', 'size',
//     'bold', 'italic', 'underline', 'strike', 'blockquote',
//     'list', 'bullet', 'indent',
//     'link', 'color', 'background', 'align'
//   ];

//   if (typeof window === 'undefined' || !ReactQuill) {
//     return <div className="p-4 border rounded-md bg-gray-100 text-gray-500">Loading editor...</div>;
//   }

//   Quill.register({
//     'modules/table':Table
//   },true);
  
//   return (
//     <ReactQuill
//       theme="snow"
//       value={value || ''}
//       readOnly={readOnly || false}
//       onChange={onChange}
//       placeholder={placeholder || "Start writing..."}
//       modules={modules || defaultModules}
//       formats={formats || defaultFormats}
//       className="bg-white"
//     />
//   );
// }

// export default QuillEditor;

"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import Table from 'quill/modules/table';

import { createEditablePlaceholderBlot } from '@app/utils/editable-placeholder-blot';
import { createNoteBlot } from '@app/utils/note-blot';


const QuillEditor = forwardRef(
  ({
    initialDelta, // Expecting Delta for initial content
    placeholderContents, // Object: { placeholderId: "current_text" }
    onPlaceholderChange, // Callback: (placeholderId, newValue) => void
    readOnlyMainEditor = false, // Default to false, parent will set to true for proposal view
    onChange, // Standard ReactQuill onChange for the whole editor (if not fully readOnly)
    value,    // Standard ReactQuill value (if controlled for the whole editor)
    placeholder,
    modules: parentModules,
    formats: parentFormats,
    ...rest
  }, ref) => {
    const quillReactRef = useRef(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { 
      setIsClient(true); 
    }, []);

    useEffect(() => {
      // Module and Blot Registration (run once on client-side)
      if (typeof window !== "undefined") {
        const EditablePlaceholderBlot = createEditablePlaceholderBlot(Quill);
        const NoteBlot = createNoteBlot(Quill);

        // Register Table module (if not already part of react-quill-new's default)
        Quill.register(
          {
            "modules/table": Table,
          },
          true
        );

        // Register Editable Placeholder Blot
          Quill.register(EditablePlaceholderBlot,true);

        // Note blot
        Quill.register(NoteBlot, true);
      }
    }, []);

    useImperativeHandle(ref, () => ({
        getEditor: () => quillReactRef.current?.getEditor(),
        focus: () => quillReactRef.current?.focus(),
    }));

    const modules = useMemo(() => {
        const defaultToolbar = [
            [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
            [{size: []}],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link', /*'image', 'video'*/], // Add image/video if needed
            [{ 'color': [] }, { 'background': [] }], [{ 'align': [] }],
            ['table'],
            ['clean'],
            ['insertNote']
        ];

        return {
            toolbar: readOnlyMainEditor ? false : (parentModules?.toolbar || defaultToolbar),
            clipboard: { matchVisual: false, ...(parentModules?.clipboard) },
            table: !readOnlyMainEditor,
            ...parentModules,
            // Ensure keyboard bindings for placeholders don't get overridden if main editor is also interactive
        };
    }, [readOnlyMainEditor, parentModules]);

    const formats = useMemo(() => [
        'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'indent', 'link', /*'image', 'video',*/
        'color', 'background', 'align',
        'note',
        'table',
        'editable-placeholder', // Custom blot
        ...(parentFormats || [])
    ], [parentFormats]);

    // Effect to synchronize inner content of placeholders if `placeholderContents` prop changes
    useEffect(() => {
      if (!isClient || !quillReactRef.current || !placeholderContents || !readOnlyMainEditor) return;
      const editor = quillReactRef.current.getEditor();
      if (!editor) return;

      const rootNode = editor.root;
      const placeholderNodes = rootNode.querySelectorAll('.ql-editable-placeholder');
      placeholderNodes.forEach(node => {
        const placeholderId = node.getAttribute('data-placeholder-id');
        const innerContentNode = node.querySelector('.placeholder-inner-content');
        if (placeholderId && innerContentNode && placeholderContents[placeholderId] !== undefined) {
          if (innerContentNode.innerText !== placeholderContents[placeholderId]) {
            innerContentNode.innerText = placeholderContents[placeholderId];
          }
        }
      });
    }, [placeholderContents, isClient, readOnlyMainEditor]);

    // Effect to attach event listeners for capturing user input from placeholders
    useEffect(() => {
      if (!isClient || !quillReactRef.current || !onPlaceholderChange || !readOnlyMainEditor) return;
      const editor = quillReactRef.current.getEditor();
      if (!editor) return;

      const rootNode = editor.root;
      const handleInputOrPasteInPlaceholder = (event) => {
        let target = event.target;
        while (target && target !== rootNode) {
            if (target.classList && target.classList.contains('placeholder-inner-content')) {
                const placeholderNode = target.closest('.ql-editable-placeholder');
                if (placeholderNode) {
                    const placeholderId = placeholderNode.getAttribute('data-placeholder-id');
                    if (placeholderId) {
                        setTimeout(() => { // Use timeout to ensure DOM is updated, esp. for paste
                            onPlaceholderChange(placeholderId, target.innerText);
                        }, 0);
                    }
                }
                return;
            }
            target = target.parentNode;
        }
      };

      rootNode.addEventListener('input', handleInputOrPasteInPlaceholder);
      rootNode.addEventListener('paste', handleInputOrPasteInPlaceholder);
      return () => {
        rootNode.removeEventListener('input', handleInputOrPasteInPlaceholder);
        rootNode.removeEventListener('paste', handleInputOrPasteInPlaceholder);
      };
    }, [onPlaceholderChange, isClient, readOnlyMainEditor]);


    if (!isClient) {
      return <div className="p-4 border rounded-md bg-gray-100 text-gray-500 min-h-[300px]">Initializing editor...</div>;
    }

    // If the main editor is for template display with editable placeholders:
    if (readOnlyMainEditor) {
        return (
            <ReactQuill
                ref={quillReactRef}
                defaultValue={initialDelta} // Use defaultValue as the base structure won't change
                readOnly={true} // Main shell is read-only
                theme="snow"
                modules={modules}
                formats={formats}
                placeholder={placeholder || "Template content..."}
                className="bg-white proposal-editor-readonly" // Add a class for specific styling
                {...rest}
                // No top-level onChange needed if the shell is truly read-only
            />
        );
    }

    // Standard fully editable editor (e.g., for template creation page)
    return (
        <ReactQuill
            ref={quillReactRef}
            theme="snow"
            value={value || initialDelta || ''} // Controlled or uncontrolled for full edit
            readOnly={false}
            onChange={onChange} // Standard onChange for fully editable mode
            placeholder={placeholder || "Start writing..."}
            modules={modules}
            formats={formats}
            className="bg-white"
            {...rest}
        />
    );
  }
);

QuillEditor.displayName = 'QuillEditor';
export default QuillEditor;