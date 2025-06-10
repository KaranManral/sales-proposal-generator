// app/proposals/create/page.js
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@app/components/Header';
import TemplateSelector from '@app/components/TemplateSelector'; // Assuming path
import { Quill } from 'react-quill-new'; // Import Quill for Quill.sources.USER

// --- Helper function to transform Delta (should be in a separate utils file) ---
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function transformDeltaForEditablePlaceholders(originalDelta, identifiedPlaceholdersArray, initialValues = {}) {
  if (!originalDelta || !originalDelta.ops) return { ops: [] };
  const newOps = [];
  originalDelta.ops.forEach(op => {
    if (typeof op.insert === 'string') {
      let currentText = op.insert;
      let lastIndex = 0;
      let hasReplacements = false;
      const placeholderNames = identifiedPlaceholdersArray.map(ph => escapeRegex(ph.name));
      if (placeholderNames.length === 0) { newOps.push(op); return; }
      const globalRegex = new RegExp(`\\{\\{(${placeholderNames.join('|')})\\}\\}`, 'g');
      let match;
      while ((match = globalRegex.exec(currentText)) !== null) {
        hasReplacements = true;
        const placeholderName = match[1];
        const matchStartIndex = match.index;
        const matchEndIndex = matchStartIndex + match[0].length;
        if (matchStartIndex > lastIndex) {
          newOps.push({ ...op, insert: currentText.substring(lastIndex, matchStartIndex) });
        }
        const placeholderDefinition = identifiedPlaceholdersArray.find(p => p.name === placeholderName);
        const uniqueId = placeholderDefinition?.id || `ph_${placeholderName.toLowerCase().replace(/\W+/g, '_')}_${Date.now()}`;
        newOps.push({
          insert: {
            'editable-placeholder': {
              id: uniqueId,
              label: placeholderDefinition?.description || `Edit ${placeholderName}:`,
              initialContent: initialValues[placeholderName] || '',
              originalPlaceholderName: placeholderName
            }
          }
        });
        lastIndex = matchEndIndex;
      }
      if (lastIndex < currentText.length) {
        newOps.push({ ...op, insert: currentText.substring(lastIndex) });
      }
      if (!hasReplacements) newOps.push(op);
    } else {
      newOps.push(op);
    }
  });
  return { ops: newOps };
}
// --- End Helper function ---

// This now refers to your enhanced @app/components/editor.js
const QuillEditor = dynamic(
  () => import('@app/components/editor'),
  {
    ssr: false,
    loading: () => <div className="p-4 border rounded-md bg-gray-100 text-gray-500 min-h-[300px]">Loading editor...</div>
  }
);

export default function CreateProposalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [proposalTitle, setProposalTitle] = useState('');
  const [clientName, setClientName] = useState('');
  
  const [transformedDelta, setTransformedDelta] = useState(null); // Delta passed to editor
  const [placeholderData, setPlaceholderData] = useState({}); // { placeholderId: "user_value" }

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const quillEditorRef = useRef(null); // Ref for the QuillEditor component

  useEffect(() => {
    // ... (fetchTemplates logic remains the same) ...
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/templates");
        if (!response.ok) throw new Error('Failed to fetch templates');
        const data = await response.json();
        setAvailableTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        alert("Error fetching templates. Please try again.");
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    if (status === "authenticated") { setIsLoadingTemplates(true); fetchTemplates(); }
    else if (status === "unauthenticated") { alert("Unauthorized. Please log in."); }
  }, [status]);

  const handlePlaceholderDataChange = (placeholderId, newContent) => {
    setPlaceholderData(prevData => ({ ...prevData, [placeholderId]: newContent, }));
  };

  const processAndSetTemplate = (templateToProcess, currentClientName) => {
    if (!templateToProcess || !templateToProcess.sections || !templateToProcess.sections[0]) {
        setTransformedDelta({ops: [{insert: '\n'}]}); setPlaceholderData({}); return;
    }
    const baseDelta = templateToProcess.sections[0].content_type === "quill_delta"
      ? templateToProcess.sections[0].content
      : { ops: [{ insert: templateToProcess.sections[0].content || "" }] };
    const identifiedPlaceholders = templateToProcess.placeholders || [];
    const initialValues = {};
    identifiedPlaceholders.forEach(ph => {
        const key = ph.name.toUpperCase(); // Normalize key
        if (key === "CLIENT_COMPANY_NAME" || key === "CLIENT_NAME") {
            initialValues[ph.name] = currentClientName || '';
        } else {
            // Try to find existing value in placeholderData if this is a re-process
            const existingPhEntry = Object.values(placeholderData).find(
                (entry) => typeof entry === 'object' && entry.originalPlaceholderName === ph.name
            );
            initialValues[ph.name] = existingPhEntry ? placeholderData[existingPhEntry.id] : (ph.defaultValue || '');
        }
    });

    const newTransformedDelta = transformDeltaForEditablePlaceholders(baseDelta, identifiedPlaceholders, initialValues);
    setTransformedDelta(newTransformedDelta);

    const newPlaceholderData = {};
    newTransformedDelta.ops.forEach(op => {
      if (op.insert && op.insert['editable-placeholder']) {
        const phEmbed = op.insert['editable-placeholder'];
        newPlaceholderData[phEmbed.id] = phEmbed.initialContent || '';
      }
    });
    setPlaceholderData(newPlaceholderData);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    processAndSetTemplate(template, clientName); // Process with current clientName
    setIsEditorReady(false); // Force re-check for editor readiness
    setTimeout(() => setIsEditorReady(true), 0); // Allow editor to mount with new delta
  };
  
  useEffect(() => {
    let baseTitle = "New Proposal";
    if (selectedTemplate) {
        baseTitle = `Proposal for ${clientName || '[Client]'} based on ${selectedTemplate.name}`;
        // Re-process if client name changes AND a template is selected
        if (clientName !== undefined) { // Check if clientName has been interacted with
            processAndSetTemplate(selectedTemplate, clientName);
        }
    } else if (clientName) {
        baseTitle = `Proposal for ${clientName}`;
    }
    setProposalTitle(baseTitle);
  }, [clientName, selectedTemplate]); // Re-run if clientName changes AFTER a template is selected

  useEffect(() => { // Ensure editor ready state is managed
    if (transformedDelta) setIsEditorReady(true);
  }, [transformedDelta]);


  const handleInsertNote = () => {
    const editor = quillEditorRef.current?.getEditor();
    if (!editor) {
      alert("Editor is not ready. Please wait or select a template.");
      return;
    }

    const range = editor.getSelection(true) || { index: editor.getLength() -1, length: 0 }; // Get cursor or end
    const noteId = `user_note_${Date.now()}`;
    const noteLabel = "User Note:";

    // Update placeholderData state for the new note
    setPlaceholderData(prev => ({ ...prev, [noteId]: "" }));

    // Insert the new EditablePlaceholderBlot into the Delta using Quill API
    editor.insertEmbed(range.index, 'editable-placeholder', {
      id: noteId,
      label: noteLabel,
      initialContent: '', // New notes start empty
      originalPlaceholderName: `USER_NOTE_RUNTIME_${Date.now()}`
    }, Quill.sources.USER);

    editor.insertText(range.index + 1, '\n', Quill.sources.USER); // Add newline after
    editor.setSelection(range.index + 2); // Move cursor
    editor.focus(); // Refocus editor
  };

  const handleSaveProposal = async () => {
    if (!proposalTitle.trim()) { alert("Proposal title is required."); return; }

    const editor = quillEditorRef.current?.getEditor();
    if (!editor) { alert("Editor not available."); return; }

    // The editor.getContents() will now use the EditablePlaceholderBlot's value() method,
    // which should reflect the current innerText of each placeholder.
    const finalProposalDelta = editor.getContents();

    console.log("Saving Proposal:", {
      title: proposalTitle,
      client: clientName,
      content_type: "quill_delta",
      content: finalProposalDelta,
      template_used_id: selectedTemplate?._id,
      // For easier access, you might still want to save the `placeholderData` map
      // if you need to query these values without parsing the full Delta.
      // filled_placeholder_values: placeholderData,
    });
    alert("Proposal Delta ready for saving. Check console.");
    // TODO: API call to save proposal
  };

  // ... (loading states, role check, JSX structure remains similar) ...
  // Ensure the QuillEditor gets the correct props

  if (status === "loading" && !session) return <p className="pt-32 text-center">Loading session...</p>;
  if (status === "unauthenticated") return <p className="pt-32 text-center text-red-500">Unauthorized. Please <a href="/login" className="text-blue-500">login</a>.</p>;
  if (!session) return null;

  if(session.user.role !== "user"){ /* ... role check JSX ... */ }

  return (
    <>
      <Header />
      <main className="mt-20 md:mt-24 lg:mt-28 xl:mt-32 p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Create New Proposal</h1>
          <button
            onClick={handleInsertNote}
            disabled={!isEditorReady} // Disable if editor not ready
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium disabled:opacity-50"
          >
            Insert Note Section
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 xl:col-span-3">
            {/* TemplateSelector */}
            {isLoadingTemplates ? ( <p>Loading templates...</p> ) : (
              <TemplateSelector
                templates={availableTemplates}
                onSelectTemplate={handleSelectTemplate}
                selectedTemplateId={selectedTemplate?._id}
              />
            )}
          </div>

          <div className="lg:col-span-9 xl:col-span-9 bg-white p-4 sm:p-6 rounded-lg shadow">
            {/* Proposal Title and Client Name inputs */}
            <div className="mb-4">
              <label htmlFor="proposalTitle" className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
              <input type="text" id="proposalTitle" value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} className="w-full p-2 input-style" placeholder="e.g., Web Development Proposal for Acme Corp"/>
            </div>
            <div className="mb-6">
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Client Company Name</label>
              <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-2 input-style" placeholder="Enter client name"/>
            </div>

            <div className="mb-1 text-sm font-medium text-gray-700">Proposal Content</div>
            <div className="border border-gray-300 rounded-md overflow-hidden min-h-[500px]">
              {isEditorReady && transformedDelta ? ( // Conditionally render editor
                <QuillEditor
                  ref={quillEditorRef} // Pass the ref
                  initialDelta={transformedDelta}
                  placeholderContents={placeholderData}
                  onPlaceholderChange={handlePlaceholderDataChange}
                  readOnlyMainEditor={true} // Main editor is read-only
                  placeholder="Select a template or insert notes..."
                />
              ) : (
                <div className="p-4 text-center text-gray-500">Select a template to start or editor is loading...</div>
              )}
            </div>
            <div className="mt-6 text-right">
              <button onClick={handleSaveProposal} className="px-6 py-2.5 btn-primary">
                Save Proposal
              </button>
            </div>
            {/* Debug display */}
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <h4 className="font-semibold">Current placeholderData State:</h4>
                <pre>{JSON.stringify(placeholderData, null, 2)}</pre>
                <h4 className="font-semibold mt-2">Current transformedDelta (snippet):</h4>
                <pre>{JSON.stringify(transformedDelta?.ops?.slice(0,5), null, 2)}...</pre>
            </div>
          </div>
        </div>
      </main>
      {/* Global styles (same as before) */}
      <style jsx global>{`
        .input-style { /* Example common input style */
            border: 1px solid #d1d5db; rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500;
        }
        .btn-primary { /* Example button style */
            background-color: #8b5cf6; color: white; font-semibold;
            hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
        }
        /* ... your .ql-editable-placeholder and .placeholder-inner-content styles ... */
        .ql-editable-placeholder {display: block;border: 1px dashed #b0b0b0;padding: 10px; margin: 10px 0;background-color: #f7f7f9; border-radius: 4px;}
        .ql-editable-placeholder::before {content: attr(data-placeholder-label); display: block;font-size: 0.85em; color: #555; margin-bottom: 6px;font-weight: 500;}
        .placeholder-inner-content {display: block; min-height: 24px; outline: none;border: 1px solid #d1d5db; padding: 6px 8px;border-radius: 3px; background-color: white;}
        .placeholder-inner-content:focus {border-color: #8b5cf6;box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);}
        .ql-container.ql-snow[contenteditable="false"] .ql-editor { cursor: default; }
        .ql-container.ql-snow[contenteditable="false"] .ql-editor p { cursor: text; }
      `}</style>
    </>
  );
}