export default function TemplateSelector({ templates, onSelectTemplate, selectedTemplateId }) {
  if (!templates || templates.length === 0) {
    return <p className="text-sm text-gray-500">No templates available.</p>;
  }
  return (
    <div className="w-full h-full bg-gray-50 p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Choose a Template</h2>
      <ul className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {templates.map((template) => (
          <li key={template._id}>
            <button
              onClick={() => onSelectTemplate(template)}
              className={`w-full text-left p-3 rounded-md transition-colors duration-150
                ${selectedTemplateId === template._id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white hover:bg-purple-50 text-gray-700 border border-gray-200 hover:border-purple-300'
                }
              `}
            >
              <h3 className="font-medium">{template.name}</h3>
              {template.description && <p className="text-xs mt-1 opacity-80">{template.description}</p>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}