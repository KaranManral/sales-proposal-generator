"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function QuillViewer({ deltaContent, className }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !ReactQuill) {
    return <div className={`p-4 border rounded-md bg-gray-100 text-gray-500 ${className || ''}`}>Loading content...</div>;
  }

  if (!deltaContent || typeof deltaContent !== 'object' || !deltaContent.ops) {
    return <div className={`p-4 border rounded-md bg-gray-100 text-gray-400 ${className || ''}`}>No content to display or invalid format.</div>;
  }

  return (
    <div className={`quill-viewer-container ${className || ''}`}>
      <ReactQuill
        value={deltaContent}
        readOnly={true}
        theme="snow"
        modules={{ toolbar: false }}
        formats={[
            'header', 'font', 'size',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'indent',
            'link', 'image', 'video', 'color', 'background', 'align',
            'table',
        ]}
      />
      {/* Add custom styling for read-only view if needed */}
      <style jsx global>{`
        .quill-viewer-container .ql-editor {
          border: none; /* Remove editor border */
          padding: 0; /* Adjust padding as needed */
          font-size: 1rem; /* Or your desired base font size */
          line-height: 1.6;
          /* Add any other read-only specific styles */
        }
        .quill-viewer-container .ql-container.ql-snow {
            border: none; /* Remove container border if theme is snow */
        }
        /* Ensure tables render nicely in read-only */
        .quill-viewer-container .ql-editor table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        .quill-viewer-container .ql-editor table,
        .quill-viewer-container .ql-editor th,
        .quill-viewer-container .ql-editor td {
          border: 1px solid #ccc;
        }
        .quill-viewer-container .ql-editor th,
        .quill-viewer-container .ql-editor td {
          padding: 8px;
          text-align: left;
        }
      `}</style>
    </div>
  );
}