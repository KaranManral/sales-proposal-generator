"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter }
from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';

import QuillViewer from '@app/components/QuillViewer';

export default function ViewTemplatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params?.templateId;

  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (templateId && status === "authenticated") {
      setIsLoading(true);
      setError(null);
      fetch(`/api/templates/${templateId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "An unknown error occurred" }));
            throw new Error(errorData.message || `Failed to fetch template (status: ${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          setTemplate(data);
        })
        .catch((err) => {
          console.error("Error fetching template:", err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === "authenticated" && !templateId) {
        setError("Template ID not found in URL.");
        setIsLoading(false);
    }
  }, [templateId, status]);

  const handleDeleteTemplate = async () => {
    if (!template || !confirm(`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`)) {
        return;
    }
    try {
        const response = await fetch(`/api/templates/${template._id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete template.");
        }
        alert("Template deleted successfully!");
        router.push('/dashboard/mytemplates');
    } catch (err) {
        console.error("Error deleting template:", err);
        alert(`Error: ${err.message}`);
    }
  };


  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        <p className="mt-4 text-lg text-gray-600">Loading Template...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
         <Link href="/dashboard/mytemplates" className="absolute top-6 left-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200">
            <FaArrowLeft className="mr-2" /> Back to Templates
        </Link>
        <p className="text-2xl font-semibold text-red-700 mb-2">Error Loading Template</p>
        <p className="text-md text-red-600">{error}</p>
        <p className="mt-4 text-sm text-gray-500">Please check the URL or try again later.</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
         <Link href="/dashboard/mytemplates" className="absolute top-6 left-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200">
            <FaArrowLeft className="mr-2" /> Back to Templates
        </Link>
        <p className="text-2xl font-semibold text-gray-500">Template Not Found</p>
        <p className="mt-2 text-gray-400">The template you are looking for does not exist or could not be loaded.</p>
      </div>
    );
  }

  const mainContentSection = template.sections?.find(sec => sec.order === 0) || template.sections?.[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/dashboard/mytemplates" className="inline-flex items-center text-purple-600 hover:text-purple-800 group">
            <FaArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Back to My Templates
          </Link>
          <div className="flex space-x-3">
            {/* TODO: Link to an edit page for this template */}
            <Link href={`/dashboard/mytemplates/edit/${template._id}`} className="p-2 text-gray-500 hover:text-purple-600 rounded-full hover:bg-purple-100 transition-colors">
                <FaEdit size={20} title="Edit Template" />
            </Link>
            <button onClick={handleDeleteTemplate} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                <FaTrash size={20} title="Delete Template" />
            </button>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-5 sm:px-8 sm:py-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h1 className="text-3xl font-bold text-white">{template.name}</h1>
            {template.description && (
              <p className="mt-1 text-sm text-purple-200">{template.description}</p>
            )}
          </div>

          <div className="p-6 sm:p-8 prose max-w-none">
            {mainContentSection && mainContentSection.content_type === "quill_delta" ? (
              <QuillViewer deltaContent={mainContentSection.content} />
            ) : mainContentSection && mainContentSection.content_type === "html" ? (
              <div dangerouslySetInnerHTML={{ __html: mainContentSection.content }} />
            ) : (
              <p className="text-gray-500">No displayable content found in this template or content type is not supported for viewing.</p>
            )}
          </div>

          {template.tags && template.tags.length > 0 && (
            <div className="px-6 sm:px-8 py-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {template.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
          )}

           {template.placeholders && template.placeholders.length > 0 && (
            <div className="px-6 sm:px-8 py-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Placeholders</h3>
                <ul className="list-disc list-inside pl-1 space-y-1">
                    {template.placeholders.map(p => (
                        <li key={p.name} className="text-sm text-gray-700">
                            <code className="px-1 py-0.5 bg-gray-200 text-gray-800 rounded text-xs">{p.name}</code>
                            {p.description && <span className="ml-2 text-gray-500 text-xs">- {p.description}</span>}
                        </li>
                    ))}
                </ul>
            </div>
          )}

          <div className="px-6 sm:px-8 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            <p>Created: {new Date(template.created_at).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(template.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}