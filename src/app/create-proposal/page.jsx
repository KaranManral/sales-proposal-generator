"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@app/components/Header';
import TemplateSelector from '@app/components/TemplateSelector';
import { transformDeltaForEditablePlaceholders } from '@app/utils/transformDelta';

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
  const [editorContent, setEditorContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [readOnlyMainEditor,setReadOnlyMainEditor] = useState(false);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
            try{
                const response = await fetch("/api/templates");
                const data = await response.json();
                setAvailableTemplates(data);
            }catch(error){
                console.error("Failed to fetch templates:", error);
            }finally {
                setIsLoadingTemplates(false);
            }
        }

        if(status === "authenticated"){
            setIsLoadingTemplates(true);
            fetchTemplates();
        }
        else if(status === "unauthenticated"){
            setIsLoadingTemplates(false);
            alert("Unauthorized")
        }
    
      setIsLoadingTemplates(false);

  }, [status]);


  const handleEditorChange = (contentValue, delta, source, editor) => {
    setEditorContent(editor.getContents());
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (template?.sections[0]?.content_type === "html") {
      console.warn("HTML content types not yet supported for editable placeholders.");
      setEditorContent(template.content); // Load HTML content
    } else if (template?.sections[0]?.content_type === "quill_delta") {
      const deltaWithBlots = transformDeltaForEditablePlaceholders(
      template.sections[0].content,
      template.placeholders
    );
  
    if(template.placeholders && template.placeholders.length>0)
      setReadOnlyMainEditor(true);
    else
      setReadOnlyMainEditor(false);
    setEditorContent(deltaWithBlots);
      // setEditorContent(template.sections[0].content);
    }
  };

  useEffect(() => {
    setProposalTitle(`Proposal for ${clientName || '[Client]'} based on ${selectedTemplate?.name}`);
    
  }, [clientName, selectedTemplate]);

  const handleSaveProposal = async () => {
    if (!proposalTitle.trim()) {
      alert("Proposal title is required.");
      return;
    }
    // In a real app, `editorContent` would be saved along with other proposal metadata
    console.log("Saving Proposal:", {
      title: proposalTitle,
      client: clientName,
      content: editorContent, // This is the fully edited content from Quill
      template_used_id: selectedTemplate?._id,
    });
    alert("Proposal save functionality not implemented yet. Check console.");
    // TODO: API call to save the proposal
  };

  if (status === "loading") return <p>Loading session...</p>;

  if(session.user.role != "user"){
        return <h1 className="text-red-500">You are not authorized to view this page.<a className="text-blue-500" href="/dashboard/profile">Go Back</a></h1>
    }

  return (
    <>
      <Header />
      <main className="mt-20 md:mt-24 lg:mt-28 xl:mt-32 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Create New Proposal</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 xl:col-span-3">
            {isLoadingTemplates ? (
              <p>Loading templates...</p>
            ) : (
              <TemplateSelector
                templates={availableTemplates}
                onSelectTemplate={handleSelectTemplate}
                selectedTemplateId={selectedTemplate?._id}
              />
            )}
          </div>

          <div className="lg:col-span-9 xl:col-span-9 bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="mb-6 text-right">
              <button
                onClick={handleSaveProposal}
                className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow-md cursor-pointer hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Save Proposal
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="proposalTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Proposal Title
              </label>
              <input
                type="text"
                id="proposalTitle"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Web Development Proposal for Acme Corp"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                Client Company Name (for placeholders)
              </label>
              <input
                type="text"
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter client name"
              />
            </div>

            <div className="mb-1 text-sm font-medium text-gray-700">Proposal Content</div>
            <div className="border border-gray-300 rounded-md overflow-hidden min-h-[500px]">
              <QuillEditor
                key={selectedTemplate?._id||'blank'}
                initialDelta={editorContent}
                readOnlyMainEditor={readOnlyMainEditor}
                onChange={handleEditorChange}
                placeholder="Select a template or start writing..."
              />
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        .user-notes-placeholder {
            background-color: #f0f9ff; /* Light blue background */
            border-left: 3px solid #3b82f6; /* Blue left border */
            padding: 0.5em 0.75em;
            margin: 0.5em 0;
            font-style: italic;
            color: #374151; /* Darker gray text */
        }
        .user-notes-placeholder p { /* Ensure paragraphs inside also get the style */
            margin: 0 !important;
        }
      `}</style>
    </>
  );
}