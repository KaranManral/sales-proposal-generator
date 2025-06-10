"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@app/components/Header';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const QuillEditor = dynamic(
  () => import('../components/editor'),
  {
    ssr: false,
    loading: () => <p className="p-4 border rounded-md bg-gray-100 text-gray-500">Loading editor...</p>,
  }
);

export default function CreateTemplate() {
  const router = useRouter();
  const {data:session,status} = useSession();
  const [editorContent, setEditorContent] = useState('');
  const [editorDelta, setEditorDelta] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [title, setTitle] = useState("Title");
  const [templateDescription, setTemplateDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  const handleEditorChange = (content, delta, source, editor) => {
    setEditorContent(content);
    setEditorDelta(editor.getContents());
    // console.log(editor.getHTML());
    // console.log(editor.getText());
    // console.log(editor.getContents());
  };

  const detectPlaceholders = (delta) => {
    const placeholders = [];
    if (delta && delta.ops) {
        delta.ops.forEach(op => {
            if (typeof op.insert === 'string') {
                const matches = op.insert.match(/\{\{([A-Za-z0-9_ ]+)\}\}/g);
                if (matches) {
                    matches.forEach(match => {
                        const placeholderName = match.substring(2, match.length - 2);
                        if (!placeholders.find(p => p.name === placeholderName)) {
                            placeholders.push({ name: placeholderName, description: `Value for ${placeholderName}` });
                        }
                    });
                }
            }
        });
    }
    return placeholders;
  };

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      alert("Template name is required.");
      return;
    }
    if (!editorDelta || (editorDelta.ops && editorDelta.ops.length === 1 && editorDelta.ops[0].insert === '\n')) {
      alert("Template content cannot be empty.");
      return;
    }
    if (!session?.user?.companyId || !session?.user?.id) {
        alert("User session is invalid or missing company/user ID.");
        return;
    }

    setIsLoading(true);

    const placeholdersFound = detectPlaceholders(editorDelta);

    const templateData = {
      name: title,
      description: templateDescription,
      company_id: session.user.companyId,
      created_by_user_id: session.user.id,
      sections: [
        {
          order: 0,
          content_type: "quill_delta",
          content: editorDelta,
        },
      ],
      placeholders: placeholdersFound,
      tags: [],
    };

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save template.');
      }

      router.push('/dashboard/mytemplates');
      
      setEditorContent(null);
      setEditorDelta(null);


    } catch (err) {
      console.error("Failed to save template:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
      [{size: []}],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link'],
      ['clean'],
      ['table'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'link', 'table', 'color', 'background', 'align'
  ];

  if (!isMounted) {
    return <div className="p-4 border rounded-md bg-gray-100 text-gray-500">Initializing editor interface...</div>;
  }

  if (status === "loading") return <p>Loading session...</p>;

  if (!session) return null;

  if(session.user.role != "admin"){
        return <h1 className="text-red-500">You are not authorized to view this page.<a className="text-blue-500" href="/dashboard/profile">Go Back</a></h1>
    }
    
  return (
    <>
    <Header />
    <div className="container mx-auto p-4 mt-32">
      <div className="headContainer grid grid-cols-2 gap-10">
      <input className="text-2xl font-bold w-72 border" value={title} onChange={(e)=>{setTitle(e.target.value)}} />
      <br />
      <textarea name="description" id="description" className='border text-lg mb-4 w-72' placeholder='Description' onChange={(e)=>{setTemplateDescription(e.target.value)}}></textarea>
      <button
        onClick={handleSaveTemplate}
        disabled={isLoading}
        className="w-fit mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 justify-self-end"
      >
        Save Template
      </button>
      </div>
      <div className="my-6 prose max-w-none">
        <QuillEditor
          value={editorContent}
          onChange={handleEditorChange}
          placeholder="Compose your proposal details here..."
          modules={modules}
          formats={formats}
        />
      </div>
    </div>
    </>
  );
}