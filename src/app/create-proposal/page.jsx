"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@app/components/Header';
import TemplateSelector from '@app/components/TemplateSelector';

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
    setEditorContent(contentValue);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (template.content_type === "html") {
      setEditorContent(template.content); // Load HTML content
    } else if (template.content_type === "quill_delta") {
      // If content is Delta, your QuillEditor should handle it via `value` prop
      // Or, you might need to use quillInstanceRef.current.getEditor().setContents(template.content)
      setEditorContent(template.content);
    }
    // You might want to pre-fill proposalTitle based on template name or other logic
    setProposalTitle(`Proposal for ${clientName || '[Client]'} based on ${template.name}`);
  };

  const processPlaceholders = (content, clientName) => {
    // Basic placeholder replacement - extend as needed
    let processedContent = content;
    if (typeof content === 'string') { // For HTML content
        processedContent = processedContent.replace(/\{\{CLIENT_COMPANY_NAME\}\}/g, clientName || "[Client Company Name]");
        processedContent = processedContent.replace(/\{\{PRODUCT_NAME\}\}/g, "[Product Name Placeholder]"); // Example
        // Replace {{USER_NOTES_HERE_...}} with something to indicate an editable area
        // This is where it gets tricky. For a single editor, these become part of the editable content.
        // You might replace them with a visually distinct placeholder text or a specific style.
        processedContent = processedContent.replace(/\{\{USER_NOTES_HERE_(\d+)\}\}/g,
            (match, num) => `<p class="user-notes-placeholder"><em>[Add your notes for section ${num} here...]</em></p>`);
        processedContent = processedContent.replace(/\{\{USER_NOTES_SECTION_(\d+)_TITLE\}\}/g,
            (match, num) => `<!-- User Notes Section ${num} Title Placeholder -->`);

    } else if (typeof content === 'object' && content.ops) { // For Delta content
        // Placeholder replacement in Delta is more complex. You'd iterate through ops.
        // For simplicity, this example assumes HTML content for templates initially.
        console.warn("Placeholder replacement for Delta content is not fully implemented in this example.");
    }
    return processedContent;
  };

  useEffect(() => {
    if (selectedTemplate) {
        const processed = processPlaceholders(selectedTemplate.content, clientName);
        setEditorContent(processed);
    }
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
                value={editorContent}
                onChange={handleEditorChange}
                placeholder="Select a template or start writing..."
              />
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={handleSaveProposal}
                className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Save Proposal
              </button>
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