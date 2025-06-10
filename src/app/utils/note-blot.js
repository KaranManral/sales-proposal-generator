export function createNoteBlot(Quill) {
  const BlockEmbed = Quill.import('blots/block/embed');

  class NoteBlot extends BlockEmbed {
    static blotName  = 'note';
    static tagName   = 'div';
    static className = 'ql‑note';

    static create(value) {
      const node = super.create();
      // wrapper styles
      node.setAttribute('data-note‑id', value.id||`note‑${Date.now()}`);
      node.style.border        = '1px dashed #aaa';
      node.style.padding       = '8px';
      node.style.margin        = '8px 0';
      node.style.background    = '#f9f9f9';

      // use a textarea or input or even another div[contenteditable]
      const textarea = document.createElement('textarea');
      textarea.placeholder     = value.placeholder || 'Type your note…';
      textarea.style.width     = '100%';
      textarea.style.minHeight = '50px';
      textarea.value           = value.text || '';

      // stop Quill from capturing events inside the textarea
      ['mousedown','mouseup','click','keydown','keyup','keypress','focus','blur']
        .forEach(evt => textarea.addEventListener(evt, e => e.stopPropagation()));

      textarea.addEventListener('input', e => {
        node.setAttribute('data-note‑text', textarea.value);
      });

      node.appendChild(textarea);
      return node;
    }

    static value(domNode) {
      const ta = domNode.querySelector('textarea');
      return {
        id: domNode.getAttribute('data-note‑id'),
        text: ta?.value || '',
      };
    }
  }

  return NoteBlot;
}
