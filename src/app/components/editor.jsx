"use client";

import React from 'react';
import 'react-quill-new/dist/quill.snow.css';

import ReactQuill,{Quill} from 'react-quill-new';
import Table from 'quill/modules/table'

function QuillEditor({ value, onChange, placeholder, modules, formats }) {
  const defaultModules = {
    toolbar: [
      [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
      [{size: []}],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'},
       {'indent': '-1'}, {'indent': '+1'}],
      ['link',],
      ['clean'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],                       
    ],
    clipboard: {
      matchVisual: false, 
    }
  };

  const defaultFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'color', 'background', 'align'
  ];

  if (typeof window === 'undefined' || !ReactQuill) {
    return <div className="p-4 border rounded-md bg-gray-100 text-gray-500">Loading editor...</div>;
  }

  Quill.register({
    'modules/table':Table
  },true);
  
  return (
    <ReactQuill
      theme="snow"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder || "Start writing..."}
      modules={modules || defaultModules}
      formats={formats || defaultFormats}
      className="bg-white"
    />
  );
}

export default QuillEditor;