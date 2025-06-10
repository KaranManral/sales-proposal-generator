export function createEditablePlaceholderBlot(Quill) {
  const Embed = Quill.import('blots/embed'); // Get Embed directly from the passed Quill instance

  class EditablePlaceholderBlot extends Embed {
    static blotName = 'editable-placeholder';
    static tagName = 'span';
    static className = 'ql-editable-placeholder';

    static create(value) {
      const node = super.create(value);
      node.setAttribute('data-placeholder-id', value.id || `ph-${Date.now()}`);
      node.setAttribute('data-placeholder-label', value.label || 'Editable Note:');
      node.setAttribute('tabindex', '-1');

      const innerContent = document.createElement('span');
      innerContent.setAttribute('contenteditable', 'true');
      innerContent.classList.add('placeholder-inner-content');
      innerContent.innerText = value.initialContent || '';

      ['mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'keypress', 'focus', 'blur'].forEach(eventName => {
          innerContent.addEventListener(eventName, (e) => e.stopPropagation());
      });
      node.appendChild(innerContent);
      return node;
    }

    static value(domNode) {
      const innerContentNode = domNode.querySelector('.placeholder-inner-content');
      return {
        id: domNode.getAttribute('data-placeholder-id'),
        label: domNode.getAttribute('data-placeholder-label'),
        initialContent: innerContentNode ? innerContentNode.innerText : '',
        originalPlaceholderName: domNode.getAttribute('data-original-placeholder-name') || undefined
      };
    }

    length() { return 1; }
  }

  return EditablePlaceholderBlot;
}